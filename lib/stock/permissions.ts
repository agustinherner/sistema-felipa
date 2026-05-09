import type { Role } from '@/lib/auth/types';

export type StockPermissions = {
  /** Ver columna Costo y precios de costo en el detalle. */
  verCosto: boolean;
  /** Disparar acciones de ajuste (rotura, robo, conteo, devolución). */
  ajustar: boolean;
  /** Acceder a /stock/movimientos (historial completo). */
  verHistorialCompleto: boolean;
  /** Acceder a /stock/ingreso (carga bulk de mercadería). */
  ingresarMercaderia: boolean;
};

/**
 * Mapea rol → permisos del módulo Stock.
 *
 * El enum del schema (`Rol`) está en uppercase (ADMIN/VENDEDOR), pero la
 * sesión ya entrega `Role` en lowercase (admin/vendedor). Acá usamos `Role`
 * para que el call site (Server Component) lo pase directo desde la sesión.
 */
export function permisosStock(role: Role): StockPermissions {
  if (role === 'admin') {
    return {
      verCosto: true,
      ajustar: true,
      verHistorialCompleto: true,
      ingresarMercaderia: true,
    };
  }
  // Vendedor (y cualquier rol futuro no-admin por defecto): solo lectura.
  return {
    verCosto: false,
    ajustar: false,
    verHistorialCompleto: false,
    ingresarMercaderia: false,
  };
}
