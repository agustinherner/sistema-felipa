import { requireAuth } from '@/lib/auth/session';
import {
  listarTurnosDelMes,
  obtenerResumenTurnoAbierto,
} from '@/lib/turnos/queries';
import { ResumenTurno } from './_components/ResumenTurno';
import { SinTurno } from './_components/SinTurno';
import { TablaTurnosMes } from './_components/TablaTurnosMes';

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

export default async function DashboardPage() {
  const user = await requireAuth(['ADMIN', 'VENDEDOR']);

  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = ahora.getMonth() + 1;

  const [resumen, turnosMes] = await Promise.all([
    obtenerResumenTurnoAbierto(user.id),
    listarTurnosDelMes(user.id, anio, mes),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hola, {user.name.split(' ')[0]}</h1>
        <p className="text-sm text-muted-foreground">
          Tu actividad de hoy y resumen del mes.
        </p>
      </div>

      {resumen ? <ResumenTurno resumen={resumen} /> : <SinTurno />}

      <TablaTurnosMes nombreMes={MESES[mes - 1]} turnos={turnosMes} />
    </div>
  );
}
