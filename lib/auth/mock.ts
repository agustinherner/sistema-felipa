import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import {
  MOCK_AUTH_COOKIE,
  type MockUser,
  type Role,
  usuarioToMockUser,
} from './types';

type AllowedRole = Role | 'ADMIN' | 'VENDEDOR';

function normalizeRole(r: AllowedRole): Role {
  if (r === 'ADMIN') return 'admin';
  if (r === 'VENDEDOR') return 'vendedor';
  return r;
}

export async function getMockUser(): Promise<MockUser | null> {
  const value = cookies().get(MOCK_AUTH_COOKIE)?.value;
  if (value !== 'admin' && value !== 'vendedor') return null;

  const usuario = await prisma.usuario.findFirst({
    where: {
      rol: value === 'admin' ? 'ADMIN' : 'VENDEDOR',
      activo: true,
    },
    orderBy: { creadoEn: 'asc' },
  });

  if (!usuario) return null;
  return usuarioToMockUser(usuario);
}

export async function requireAuth(
  allowedRoles?: AllowedRole[],
): Promise<MockUser> {
  const user = await getMockUser();
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
