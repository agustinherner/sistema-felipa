import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import {
  calcularEfectivoVendidoEnTurno,
  getTurnoAbierto,
} from '@/lib/turnos/queries';
import { CerrarTurnoForm } from './cerrar-turno-form';

const TURNO_OLVIDADO_HORAS = 12;

const MetodosPagoSchema = z.array(
  z.object({ metodo: z.string(), monto: z.number() }),
);

type MetodosTotales = {
  efectivo: number;
  transferencia: number;
  debito: number;
  credito: number;
};

function metodoKey(metodo: string): keyof MetodosTotales | null {
  const normalizado = metodo.toLowerCase().trim();
  if (normalizado === 'efectivo') return 'efectivo';
  if (normalizado === 'transferencia') return 'transferencia';
  if (normalizado === 'débito' || normalizado === 'debito') return 'debito';
  if (normalizado === 'crédito' || normalizado === 'credito') return 'credito';
  return null;
}

export default async function CerrarTurnoPage() {
  const user = await requireAuth();
  const turno = await getTurnoAbierto(user.id);
  if (!turno) redirect('/turno/abrir');

  const ventas = await prisma.venta.findMany({
    where: { turnoId: turno.id, anuladaEn: null },
    select: { metodosPago: true, total: true },
  });

  const montosPorMetodo: MetodosTotales = {
    efectivo: 0,
    transferencia: 0,
    debito: 0,
    credito: 0,
  };
  let totalVendido = 0;
  for (const venta of ventas) {
    totalVendido += Number(venta.total);
    const parsed = MetodosPagoSchema.safeParse(venta.metodosPago);
    if (!parsed.success) continue;
    for (const item of parsed.data) {
      const key = metodoKey(item.metodo);
      if (key) montosPorMetodo[key] += item.monto;
    }
  }

  const efectivoVendido = await calcularEfectivoVendidoEnTurno(turno.id);
  const efectivoInicial = Number(turno.efectivoInicialDeclarado);
  const efectivoEsperado = efectivoInicial + efectivoVendido;

  const horasAbierto =
    (Date.now() - turno.aperturaEn.getTime()) / (1000 * 60 * 60);
  const esTurnoOlvidado = horasAbierto > TURNO_OLVIDADO_HORAS;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <CerrarTurnoForm
        turnoAperturaEn={turno.aperturaEn.toISOString()}
        efectivoInicial={efectivoInicial}
        cantidadVentas={ventas.length}
        montosPorMetodo={montosPorMetodo}
        totalVendido={totalVendido}
        efectivoEsperado={efectivoEsperado}
        esTurnoOlvidado={esTurnoOlvidado}
        horasAbierto={horasAbierto}
      />
    </div>
  );
}
