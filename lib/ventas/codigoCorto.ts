import { Prisma } from '@prisma/client';

// TODO: reemplazar por Sucursal.codigo cuando se soporte Felipa 2.
const PREFIJO_SUCURSAL_DEFAULT = 'F1';

function ddmm(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}${mm}`;
}

/**
 * Genera el código corto de la venta con formato `{PREFIJO}-{DDMM}-{NNN}`.
 *
 * Toma un advisory lock transaccional por (sucursalId, día) para serializar
 * la generación: dentro del lock, busca el NNN más alto YA usado para ese
 * `{PREFIJO}-{DDMM}-` y devuelve max+1. El lock se libera al commit/rollback.
 *
 * El query mira por `startsWith` del prefijo-día (no por sucursalId del row)
 * para que dos sucursales que compartan prefijo no choquen entre sí en el
 * unique global de `Venta.codigoCorto`. Hoy `PREFIJO_SUCURSAL_DEFAULT` está
 * hardcodeado en `F1` para todas las sucursales: cuando se soporte Felipa 2
 * con prefijos distintos, cada prefijo tendrá su propio espacio de NNN.
 */
export async function generarCodigoCortoVenta(
  sucursalId: string,
  fecha: Date,
  tx: Prisma.TransactionClient,
): Promise<string> {
  const fechaStr = ddmm(fecha);
  const prefijoDia = `${PREFIJO_SUCURSAL_DEFAULT}-${fechaStr}-`;

  // Advisory lock: hashtext convierte string a int4. Dos argumentos para
  // que cada (sucursal, día) tenga su propio slot y no contienda entre días.
  // `$executeRaw` no intenta deserializar el `void` que devuelve la función.
  await tx.$executeRaw(
    Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${sucursalId}), hashtext(${fechaStr}))`,
  );

  const ultima = await tx.venta.findFirst({
    where: { codigoCorto: { startsWith: prefijoDia } },
    orderBy: { codigoCorto: 'desc' },
    select: { codigoCorto: true },
  });

  const maxNNN = ultima
    ? Number.parseInt(ultima.codigoCorto.slice(prefijoDia.length), 10)
    : 0;
  const correlativo = String(maxNNN + 1).padStart(3, '0');

  return `${prefijoDia}${correlativo}`;
}
