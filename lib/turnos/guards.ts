import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getTurnoAbierto, getTurnoOlvidado } from './queries';
import type { Turno } from '@prisma/client';

/**
 * Retorna el turno abierto del user logueado.
 * Redirige a `/turno/abrir` si no hay turno abierto, o a `/login` si no hay sesión.
 */
export async function requireTurnoAbierto(): Promise<Turno> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const turno = await getTurnoAbierto(user.id);
  if (!turno) redirect('/turno/abrir');
  return turno;
}

export { getTurnoAbierto, getTurnoOlvidado };
