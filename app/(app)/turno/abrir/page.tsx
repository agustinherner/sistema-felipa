import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import { getTurnoAbierto } from '@/lib/turnos/queries';
import { AbrirTurnoForm } from './abrir-turno-form';

export default async function AbrirTurnoPage() {
  const user = await requireAuth();
  const turno = await getTurnoAbierto(user.id);
  if (turno) redirect('/turno/cerrar');

  return (
    <div className="mx-auto w-full max-w-md">
      <AbrirTurnoForm />
    </div>
  );
}
