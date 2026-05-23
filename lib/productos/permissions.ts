import { Rol } from '@prisma/client';

export type ProductoPermissions = {
  /** Ver costos (costoBase y costo de variante) y márgenes en el listado y el detalle. */
  verCosto: boolean;
  /** Crear nuevos productos (link a /productos/nuevo y CTA en empty state). */
  crear: boolean;
  /** Editar productos existentes (botón lápiz por fila, ruta /productos/[id]/editar). */
  editar: boolean;
  /** Desactivar / reactivar productos. */
  eliminar: boolean;
};

export function permisosProductos(rol: Rol): ProductoPermissions {
  if (rol === Rol.ADMIN) {
    return {
      verCosto: true,
      crear: true,
      editar: true,
      eliminar: true,
    };
  }
  return {
    verCosto: false,
    crear: false,
    editar: false,
    eliminar: false,
  };
}
