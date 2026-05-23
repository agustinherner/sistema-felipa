import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Rol } from '@prisma/client';
import { auth } from './server';
import type { SessionUser } from './types';

function toRol(raw: unknown): Rol | null {
  // Better Auth tipa `rol` en additionalFields como `string` (no soporta enums
  // nativos), por eso el narrow string→Rol vive acá, en el único borde donde
  // pasamos del mundo de la librería al mundo del dominio.
  if (raw === Rol.ADMIN || raw === Rol.VENDEDOR) return raw;
  return null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const u = session.user;
  const rol = toRol(u.rol);
  if (rol === null) {
    // Valor inesperado en la DB (drift). Tratamos como sesión inválida.
    return null;
  }
  return {
    id: u.id,
    name: u.name,
    rol,
    email: u.email,
    sucursalId: u.sucursalId ?? null,
  };
}

export async function requireAuth(
  allowedRoles?: Rol[],
): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.rol)) {
      redirect('/');
    }
  }
  return user;
}
