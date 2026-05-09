import type { Rol, User } from '@prisma/client';

export type Role = 'admin' | 'vendedor';

export type SessionUser = {
  id: string;
  name: string;
  role: Role;
  email: string;
  sucursalId: string | null;
};

export type { Rol, User };

export function rolToRole(rol: Rol): Role {
  return rol === 'ADMIN' ? 'admin' : 'vendedor';
}

export function roleToRol(role: Role | Rol): Rol {
  if (role === 'ADMIN' || role === 'VENDEDOR') return role;
  return role === 'admin' ? 'ADMIN' : 'VENDEDOR';
}
