import type { Prisma } from '@prisma/client';

// TODO: reemplazar por Sucursal.codigo cuando se soporte Felipa 2.
const PREFIJO_SUCURSAL_DEFAULT = 'F1';

function ddmm(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}${mm}`;
}

/**
 * Genera el código corto de la venta con formato `{PREFIJO}-{DDMM}-{NNN}`.
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
  return `${PREFIJO_SUCURSAL_DEFAULT}-${ddmm(fecha)}-${correlativo}`;
}
