import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './server';
import type { Role, SessionUser } from './types';

type AllowedRole = Role | 'ADMIN' | 'VENDEDOR';

function normalizeRole(r: AllowedRole): Role {
  if (r === 'ADMIN') return 'admin';
  if (r === 'VENDEDOR') return 'vendedor';
  return r;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const u = session.user;
  return {
    id: u.id,
    name: u.name,
    role: u.rol === 'ADMIN' ? 'admin' : 'vendedor',
    email: u.email,
    sucursalId: u.sucursalId ?? null,
  };
}

export async function requireAuth(
  allowedRoles?: AllowedRole[],
): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  if (allowedRoles && allowedRoles.length > 0) {
    const normalized = allowedRoles.map(normalizeRole);
    if (!normalized.includes(user.role)) {
      redirect('/');
    }
  }
  return user;
}
