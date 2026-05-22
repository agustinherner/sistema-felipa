import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { type RangoFechas, serializarDecimal } from './types';

export type ProductoVendido = {
  productoId: string;
  nombre: string;
  /** Cantidad neta (vendida − devuelta) en el rango. Puede ser 0 si todo se devolvió. */
  cantidad: number;
  /** Monto neto en el rango, serializado como string. */
  monto: string;
};

type Params = RangoFechas & {
  /** Por defecto 10. */
  limit?: number;
};

/**
 * Top productos por cantidad NETA (vendida − devuelta) en el rango.
 *
 * Agregamos a nivel **producto** (no variante): sumamos `ItemVenta.cantidad`
 * de ventas no anuladas dentro del rango, y restamos `ItemDevolucion.cantidad`
 * correspondientes a esas mismas ventas (independiente de cuándo se haya
 * registrado la devolución — una devolución de mayo de una venta de mayo
 * sigue "perteneciendo" a mayo).
 *
 * Productos con cantidad neta <= 0 se descartan.
 */
export async function productosMasVendidos({
  desde,
  hasta,
  limit = 10,
}: Params): Promise<ProductoVendido[]> {
  const [items, devs] = await Promise.all([
    prisma.itemVenta.findMany({
      where: {
        venta: {
          anuladaEn: null,
          creadaEn: { gte: desde, lte: hasta },
        },
      },
      select: {
        cantidad: true,
        subtotal: true,
        variante: {
          select: { producto: { select: { id: true, nombre: true } } },
        },
      },
    }),
    prisma.itemDevolucion.findMany({
      where: {
        devolucion: {
          venta: {
            anuladaEn: null,
            creadaEn: { gte: desde, lte: hasta },
          },
        },
      },
      select: {
        cantidad: true,
        subtotal: true,
        variante: {
          select: { producto: { select: { id: true } } },
        },
      },
    }),
  ]);

  type Acc = { nombre: string; cantidad: number; monto: Prisma.Decimal };
  const por: Map<string, Acc> = new Map();

  for (const it of items) {
    const pid = it.variante.producto.id;
    const cur = por.get(pid);
    if (cur) {
      cur.cantidad += it.cantidad;
      cur.monto = cur.monto.add(it.subtotal);
    } else {
      por.set(pid, {
        nombre: it.variante.producto.nombre,
        cantidad: it.cantidad,
        monto: new Prisma.Decimal(it.subtotal),
      });
    }
  }

  for (const d of devs) {
    const pid = d.variante.producto.id;
    const cur = por.get(pid);
    if (!cur) continue;
    cur.cantidad -= d.cantidad;
    cur.monto = cur.monto.sub(d.subtotal);
  }

  const arr: ProductoVendido[] = [];
  por.forEach((acc, productoId) => {
    if (acc.cantidad <= 0) return;
    arr.push({
      productoId,
      nombre: acc.nombre,
      cantidad: acc.cantidad,
      monto: serializarDecimal(acc.monto),
    });
  });

  arr.sort((a, b) => {
    if (b.cantidad !== a.cantidad) return b.cantidad - a.cantidad;
    return Number(b.monto) - Number(a.monto);
  });

  return arr.slice(0, limit);
}
