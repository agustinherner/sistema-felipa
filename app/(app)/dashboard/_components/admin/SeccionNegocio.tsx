import { rangoDiaAR, rangoMesAR } from '@/lib/fecha';
import {
  alertas,
  cajaDelDia,
  productosMasVendidos,
  ventasPorMetodoPago,
} from '@/lib/reportes';
import { CajaDelDia } from './CajaDelDia';
import { TopProductos } from './TopProductos';
import { MetodosPagoMes } from './MetodosPagoMes';
import { AlertasAdmin } from './AlertasAdmin';

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/**
 * Sección "Negocio" del dashboard del admin. Server Component: hace todas las
 * queries de agregación en paralelo y renderiza las cards.
 *
 * Los rangos se arman con `lib/fecha.ts` para que los cortes "hoy" y "este
 * mes" caigan en hora argentina aunque el server corra en UTC.
 */
export async function SeccionNegocio() {
  const ahora = new Date();
  const dia = rangoDiaAR(ahora);
  const mes = rangoMesAR(ahora);
  // El nombre del mes lo derivamos del límite `desde` (ya está expresado en
  // el primer día del mes AR; tomar el mes UTC ahí da el mes AR correcto).
  const nombreMes = MESES[mes.desde.getUTCMonth()];

  const [caja, topProd, metodos, alerts] = await Promise.all([
    cajaDelDia(dia),
    productosMasVendidos({ ...mes, limit: 10 }),
    ventasPorMetodoPago(mes),
    alertas(),
  ]);

  const hayAlertas =
    alerts.turnosLargos.length > 0 ||
    alerts.stockNegativo.length > 0 ||
    alerts.productosIncompletos.length > 0;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Negocio</h2>
        <p className="text-sm text-muted-foreground">
          Métricas operativas del local.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CajaDelDia data={caja} />
        {hayAlertas ? (
          <AlertasAdmin data={alerts} />
        ) : (
          <div className="hidden lg:block" aria-hidden />
        )}
        <div className="lg:col-span-2">
          <MetodosPagoMes data={metodos} nombreMes={nombreMes} />
        </div>
        <div className="lg:col-span-2">
          <TopProductos data={topProd} nombreMes={nombreMes} />
        </div>
      </div>
    </section>
  );
}
