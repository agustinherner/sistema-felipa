import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import {
  METODOS_PAGO,
  type MetodoPago,
  type RangoFechas,
  metodoCanonico,
  serializarDecimal,
} from './types';

/**
 * Estructura esperada de `Venta.metodosPago`. Es JSON (no relacional) por eso
 * no se puede agregar con groupBy de Prisma — traemos las ventas del rango
 * y agregamos en JS. Para el volumen de Felipa está perfecto.
 *
 * Conviven dos formas históricas:
 *   - Sprint 6.0 seed:   { metodo: 'efectivo' | ... }
 *   - Sprint 6.1 nueva venta: { metodo: 'EFECTIVO' | ... }
 * Normalizamos con `metodoCanonico`.
 */
const MetodoPagoItemSchema = z.object({
  metodo: z.string(),
  monto: z.number(),
});
const MetodosPagoSchema = z.array(MetodoPagoItemSchema);

export type VentasTotales = {
  /** Cantidad de ventas no anuladas en el rango. */
  cantidad: number;
  /** Suma de `Venta.total` en el rango (serializado como string). */
  montoTotal: string;
};

/** Total y cantidad de ventas no anuladas en el rango. */
export async function ventasTotales({
  desde,
  hasta,
}: RangoFechas): Promise<VentasTotales> {
  const ventas = await prisma.venta.findMany({
    where: {
      anuladaEn: null,
      creadaEn: { gte: desde, lte: hasta },
    },
    select: { total: true },
  });

  const total = ventas.reduce(
    (acc, v) => acc.add(v.total),
    new Prisma.Decimal(0),
  );

  return {
    cantidad: ventas.length,
    montoTotal: serializarDecimal(total),
  };
}

export type DesgloseMetodo = {
  metodo: MetodoPago;
  /** Cantidad de ventas que incluyeron este método (no líneas — ventas distintas). */
  cantidad: number;
  /** Suma de la PORCIÓN pagada con este método (no el total de la venta). */
  monto: string;
};

/**
 * Desglose por método de pago de las ventas no anuladas en el rango.
 *
 * `metodosPago` es JSON, así que traemos las ventas y agregamos en memoria:
 * por cada venta, por cada entrada de su array de métodos, sumamos +1 a la
 * cantidad de ese método y sumamos la porción (no el total de la venta) al
 * monto.
 *
 * Devuelve siempre los 4 métodos en orden fijo, aunque alguno esté en cero
 * (simplifica el rendering en la UI).
 */
export async function ventasPorMetodoPago({
  desde,
  hasta,
}: RangoFechas): Promise<DesgloseMetodo[]> {
  const ventas = await prisma.venta.findMany({
    where: {
      anuladaEn: null,
      creadaEn: { gte: desde, lte: hasta },
    },
    select: { metodosPago: true },
  });

  const acumulado: Record<MetodoPago, { cantidad: number; monto: Prisma.Decimal }> = {
    efectivo: { cantidad: 0, monto: new Prisma.Decimal(0) },
    transferencia: { cantidad: 0, monto: new Prisma.Decimal(0) },
    debito: { cantidad: 0, monto: new Prisma.Decimal(0) },
    credito: { cantidad: 0, monto: new Prisma.Decimal(0) },
  };

  for (const venta of ventas) {
    const parsed = MetodosPagoSchema.safeParse(venta.metodosPago);
    if (!parsed.success) continue;
    for (const m of parsed.data) {
      const canon = metodoCanonico(m.metodo);
      if (!canon) continue;
      acumulado[canon].cantidad += 1;
      acumulado[canon].monto = acumulado[canon].monto.add(
        new Prisma.Decimal(m.monto),
      );
    }
  }

  return METODOS_PAGO.map((m) => ({
    metodo: m,
    cantidad: acumulado[m].cantidad,
    monto: serializarDecimal(acumulado[m].monto),
  }));
}
