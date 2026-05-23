import type { Rol, User } from '@prisma/client';

export type SessionUser = {
  id: string;
  name: string;
  rol: Rol;
  email: string;
  sucursalId: string | null;
};

export type { Rol, User };
