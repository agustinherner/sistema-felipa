import { prisma } from './index';

function prefijoSucursal(nombre: string): string {
  const match = nombre.match(/(\d+)\s*$/);
  if (match) return `F${match[1]}`;
  return 'F1';
}

function ddmm(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}${mm}`;
}

/**
 * Genera el código corto de venta con formato `F<N>-DDMM-NNN`.
 * El correlativo NNN se reinicia por sucursal y por día.
 */
export async function generarCodigoVenta(sucursalId: string): Promise<string> {
  const sucursal = await prisma.sucursal.findUniqueOrThrow({
    where: { id: sucursalId },
    select: { nombre: true },
  });

  const ahora = new Date();
  const inicioDia = new Date(ahora);
  inicioDia.setHours(0, 0, 0, 0);
  const finDia = new Date(inicioDia);
  finDia.setDate(finDia.getDate() + 1);

  const ventasHoy = await prisma.venta.count({
    where: {
      sucursalId,
      creadaEn: { gte: inicioDia, lt: finDia },
    },
  });

  const correlativo = String(ventasHoy + 1).padStart(3, '0');
  return `${prefijoSucursal(sucursal.nombre)}-${ddmm(ahora)}-${correlativo}`;
}
