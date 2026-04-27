import type { Rol, Usuario } from '@prisma/client';

export type Role = 'admin' | 'vendedor';

export type MockUser = {
  id: string;
  name: string;
  role: Role;
  email: string;
  sucursalId: string | null;
};

export const MOCK_AUTH_COOKIE = 'felipa-mock-role';

export type { Rol, Usuario };

export function rolToRole(rol: Rol): Role {
  return rol === 'ADMIN' ? 'admin' : 'vendedor';
}

export function roleToRol(role: Role | Rol): Rol {
  if (role === 'ADMIN' || role === 'VENDEDOR') return role;
  return role === 'admin' ? 'ADMIN' : 'VENDEDOR';
}

export function usuarioToMockUser(u: Usuario): MockUser {
  return {
    id: u.id,
    name: u.nombre,
    role: rolToRole(u.rol),
    email: u.email,
    sucursalId: u.sucursalId,
  };
}
