export type VentasPermissions = {
  verTodas: boolean;
  filtrarPorUsuario: boolean;
};

export function permisosVentas(rol: string): VentasPermissions {
  const esAdmin = rol === 'admin' || rol === 'ADMIN';
  return {
    verTodas: esAdmin,
    filtrarPorUsuario: esAdmin,
  };
}
