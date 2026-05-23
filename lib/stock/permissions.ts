import { Rol } from '@prisma/client';

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

export function permisosStock(rol: Rol): StockPermissions {
  if (rol === Rol.ADMIN) {
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
