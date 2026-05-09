import 'server-only';
import { getCurrentUser } from '@/lib/auth/session';
import { getTurnoAbierto, getTurnoOlvidado } from './queries';
import type { Turno } from '@prisma/client';

/**
 * Lanza error si no hay turno abierto.
 * Se va a usar en /ventas/nueva en Sprint 6.1 — no se usa todavía.
 */
export async function requireTurnoAbierto(): Promise<Turno> {
  const user = await getCurrentUser();
  if (!user) throw new Error('No autenticado');

  const turno = await getTurnoAbierto(user.id);
  if (!turno) {
    throw new Error('Necesitás un turno abierto para hacer esta acción.');
  }
  return turno;
}

export { getTurnoAbierto, getTurnoOlvidado };
