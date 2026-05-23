import { Rol } from '@prisma/client';

export type VentasPermissions = {
  verTodas: boolean;
  filtrarPorUsuario: boolean;
};

export function permisosVentas(rol: Rol): VentasPermissions {
  const esAdmin = rol === Rol.ADMIN;
  return {
    verTodas: esAdmin,
    filtrarPorUsuario: esAdmin,
  };
}
