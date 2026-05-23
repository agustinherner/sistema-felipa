import { Rol } from '@prisma/client';
import { requireAuth } from '@/lib/auth/session';
import {
  fechaCivilAR_ISO,
  rangoEntreFechasAR,
  rangoMesAR,
} from '@/lib/fecha';
import {
  type Granularidad,
  horasPorVendedor,
  productosMasVendidos,
  ventasPorMetodoPago,
  ventasPorPeriodo,
  ventasPorVendedor,
} from '@/lib/reportes';
import { FiltroRango } from './_components/FiltroRango';
import { TablaVentasPeriodo } from './_components/TablaVentasPeriodo';
import { TablaProductos } from './_components/TablaProductos';
import { TablaMetodos } from './_components/TablaMetodos';
import { TablaVendedores } from './_components/TablaVendedores';
import { TablaHoras } from './_components/TablaHoras';

/**
 * Reportes. Admin only — gate por requireAuth con la whitelist del enum.
 */
export default async function ReportesPage({
  searchParams,
}: {
  searchParams: { desde?: string; hasta?: string; g?: string };
}) {
  await requireAuth([Rol.ADMIN]);

  const ahora = new Date();
  const defaultMes = rangoMesAR(ahora);
  const defaultDesdeCivil = fechaCivilAR_ISO(defaultMes.desde);
  const defaultHastaCivil = fechaCivilAR_ISO(defaultMes.hasta);

  const { desdeCivil, hastaCivil, rango } = resolverRango(
    searchParams.desde,
    searchParams.hasta,
    defaultDesdeCivil,
    defaultHastaCivil,
  );

  const granularidad = resolverGranularidad(searchParams.g);

  const [vPeriodo, productos, metodos, vendedores, horas] = await Promise.all([
    ventasPorPeriodo({ ...rango, granularidad }),
    productosMasVendidos({ ...rango, limit: 1000 }),
    ventasPorMetodoPago(rango),
    ventasPorVendedor(rango),
    horasPorVendedor(rango),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Resumen del rango seleccionado. Excluye ventas anuladas; los
          productos están netos de devoluciones; las horas cuentan solo turnos
          cerrados.
        </p>
      </div>

      <FiltroRango
        desde={desdeCivil}
        hasta={hastaCivil}
        granularidad={granularidad}
      />

      <div className="space-y-6">
        <TablaVentasPeriodo
          data={vPeriodo}
          granularidad={granularidad}
          desde={desdeCivil}
          hasta={hastaCivil}
        />

        <TablaMetodos data={metodos} desde={desdeCivil} hasta={hastaCivil} />

        <TablaVendedores
          data={vendedores}
          desde={desdeCivil}
          hasta={hastaCivil}
        />

        <TablaHoras data={horas} desde={desdeCivil} hasta={hastaCivil} />

        <TablaProductos data={productos} desde={desdeCivil} hasta={hastaCivil} />
      </div>
    </div>
  );
}

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parsea desde/hasta de searchParams. Si alguno es inválido (vacío, mal
 * formado o el rango está dado vuelta) cae al default sin romper.
 *
 * Devuelve también las strings civiles ya validadas para que la UI muestre
 * lo que efectivamente se aplicó (no lo que pidió el usuario).
 */
function resolverRango(
  desdeIn: string | undefined,
  hastaIn: string | undefined,
  defaultDesde: string,
  defaultHasta: string,
): {
  desdeCivil: string;
  hastaCivil: string;
  rango: { desde: Date; hasta: Date };
} {
  let desdeCivil = desdeIn && RE_FECHA.test(desdeIn) ? desdeIn : defaultDesde;
  let hastaCivil = hastaIn && RE_FECHA.test(hastaIn) ? hastaIn : defaultHasta;

  // Si vino dado vuelta, swap (en vez de tirar default — preserva la
  // intención del usuario).
  if (desdeCivil > hastaCivil) {
    const tmp = desdeCivil;
    desdeCivil = hastaCivil;
    hastaCivil = tmp;
  }

  try {
    return {
      desdeCivil,
      hastaCivil,
      rango: rangoEntreFechasAR(desdeCivil, hastaCivil),
    };
  } catch {
    // Cualquier otra cosa que escape la regex (fecha imposible tipo
    // 2026-13-40) -> fallback al default.
    return {
      desdeCivil: defaultDesde,
      hastaCivil: defaultHasta,
      rango: rangoEntreFechasAR(defaultDesde, defaultHasta),
    };
  }
}

function resolverGranularidad(g: string | undefined): Granularidad {
  if (g === 'semana' || g === 'mes' || g === 'dia') return g;
  return 'dia';
}
