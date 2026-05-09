import type { Role } from '@/lib/auth/types';

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

/**
 * Mapea rol → permisos del módulo Productos.
 *
 * El call site (Server Component) recibe `Role` ya normalizado desde la
 * sesión (`admin` / `vendedor`) y lo pasa directo.
 */
export function permisosProductos(role: Role): ProductoPermissions {
  if (role === 'admin') {
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
