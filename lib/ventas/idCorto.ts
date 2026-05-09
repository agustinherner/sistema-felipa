import type { Prisma } from '@prisma/client';

// TODO: Sprint Felipa 2 — multisucursal. Cuando se agregue Sucursal.codigo,
// derivar el prefijo desde ahí en vez de inferirlo del nombre o caer al default.
export const CODIGO_SUCURSAL_DEFAULT = 'F1';

/**
 * Si el nombre de la sucursal termina en un número (ej. "Felipa 1", "Sucursal 2"),
 * usa "F<n>". Sino retorna el default.
 */
function prefijoDesdeNombre(nombre: string | null | undefined): string {
  if (!nombre) return CODIGO_SUCURSAL_DEFAULT;
  const match = nombre.match(/(\d+)\s*$/);
  if (match) return `F${match[1]}`;
  return CODIGO_SUCURSAL_DEFAULT;
}

function ddmm(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}${mm}`;
}

/**
 * Genera el código corto de la venta con formato `{CODIGO}-{DDMM}-{NNN}`.
 * NNN es el correlativo del día por sucursal (count de ventas hoy + 1).
 *
 * Recibe el `tx` para que el count y el INSERT siguiente vivan en la misma
 * transacción y reduzcan la ventana de colisión (la unicidad la garantiza
 * de todas formas el unique index de `Venta.codigoCorto`; el caller hace
 * retry sobre P2002).
 *
 * Nota de naming: el prompt se refiere al campo como `idCorto`, pero el
 * schema lo tiene como `codigoCorto` desde sprints anteriores. Mantenemos
 * el nombre de DB y exportamos el helper como `generarCodigoCortoVenta`.
 */
export async function generarCodigoCortoVenta(
  sucursalId: string,
  fecha: Date,
  tx: Prisma.TransactionClient,
): Promise<string> {
  const sucursal = await tx.sucursal.findUnique({
    where: { id: sucursalId },
    select: { nombre: true },
  });
  const prefijo = prefijoDesdeNombre(sucursal?.nombre);

  const inicioDia = new Date(fecha);
  inicioDia.setHours(0, 0, 0, 0);
  const finDia = new Date(inicioDia);
  finDia.setDate(finDia.getDate() + 1);

  const ventasHoy = await tx.venta.count({
    where: {
      sucursalId,
      creadaEn: { gte: inicioDia, lt: finDia },
    },
  });

  const correlativo = String(ventasHoy + 1).padStart(3, '0');
  return `${prefijo}-${ddmm(fecha)}-${correlativo}`;
}
