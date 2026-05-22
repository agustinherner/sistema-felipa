import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import {
  bucketDiaAR,
  bucketMesAR,
  bucketSemanaAR,
  type BucketPeriodo,
} from '@/lib/fecha';
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

/* ────────────────────────────────────────────────────────────────────────── *
 * Ventas agrupadas por período (día / semana / mes)
 *
 * Reusa los helpers de bucketing de `lib/fecha.ts` para que cada venta caiga
 * en su período en HORA CIVIL ARGENTINA. Hacer el bucketing sobre el
 * timestamp UTC crudo metería las ventas nocturnas en el día (o semana o mes)
 * equivocado.
 * ────────────────────────────────────────────────────────────────────────── */

export type Granularidad = 'dia' | 'semana' | 'mes';

export type VentasPeriodoFila = {
  clave: string;
  etiqueta: string;
  cantidad: number;
  monto: string;
};

const BUCKET_POR_GRANULARIDAD: Record<
  Granularidad,
  (d: Date) => BucketPeriodo
> = {
  dia: bucketDiaAR,
  semana: bucketSemanaAR,
  mes: bucketMesAR,
};

/**
 * Ventas no anuladas del rango, agrupadas por período. Devuelve los buckets
 * que tuvieron al menos una venta, ordenados ascendentemente. Los Decimals
 * salen como string.
 */
export async function ventasPorPeriodo({
  desde,
  hasta,
  granularidad,
}: RangoFechas & { granularidad: Granularidad }): Promise<VentasPeriodoFila[]> {
  const ventas = await prisma.venta.findMany({
    where: { anuladaEn: null, creadaEn: { gte: desde, lte: hasta } },
    select: { total: true, creadaEn: true },
    orderBy: { creadaEn: 'asc' },
  });

  const bucketear = BUCKET_POR_GRANULARIDAD[granularidad];

  type Acc = {
    clave: string;
    etiqueta: string;
    inicio: Date;
    cantidad: number;
    monto: Prisma.Decimal;
  };
  const acc: Map<string, Acc> = new Map();

  for (const v of ventas) {
    const b = bucketear(v.creadaEn);
    const cur = acc.get(b.clave);
    if (cur) {
      cur.cantidad += 1;
      cur.monto = cur.monto.add(v.total);
    } else {
      acc.set(b.clave, {
        clave: b.clave,
        etiqueta: b.etiqueta,
        inicio: b.inicio,
        cantidad: 1,
        monto: new Prisma.Decimal(v.total),
      });
    }
  }

  const filas: Acc[] = [];
  acc.forEach((a) => filas.push(a));
  filas.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());

  return filas.map((f) => ({
    clave: f.clave,
    etiqueta: f.etiqueta,
    cantidad: f.cantidad,
    monto: serializarDecimal(f.monto),
  }));
}
