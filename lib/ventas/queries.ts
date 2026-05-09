import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { precioEfectivo } from '@/lib/db/precio';

export type ResultadoBusquedaVariante = {
  varianteId: string;
  nombreCompleto: string;
  precioEfectivo: Prisma.Decimal;
  stockActual: number;
  tieneStock: boolean;
};

const select = {
  id: true,
  nombre: true,
  codigoBarras: true,
  activa: true,
  precio: true,
  producto: {
    select: {
      nombre: true,
      precioBase: true,
      activo: true,
    },
  },
  stocks: {
    select: { cantidad: true, sucursalId: true },
  },
} satisfies Prisma.VarianteSelect;

type VarianteRow = Prisma.VarianteGetPayload<{ select: typeof select }>;

function mapVariante(
  v: VarianteRow,
  sucursalId: string,
): ResultadoBusquedaVariante {
  const stockActual =
    v.stocks.find((s) => s.sucursalId === sucursalId)?.cantidad ?? 0;
  const nombreCompleto =
    v.nombre === 'Única' || v.nombre === 'Único'
      ? v.producto.nombre
      : `${v.producto.nombre} - ${v.nombre}`;
  return {
    varianteId: v.id,
    nombreCompleto,
    precioEfectivo: precioEfectivo(v, v.producto),
    stockActual,
    tieneStock: stockActual > 0,
  };
}

/**
 * Busca variantes para nueva venta.
 *
 * - Si `termino` matchea exacto un `codigoBarras`, retorna solo esa variante.
 * - Sino, busca por nombre del producto (ILIKE %termino%), hasta `limit`.
 *
 * Filtros: solo variantes activas y productos no soft-deleted (activo = true).
 * `stockActual` es de la sucursal `sucursalId` (la del vendedor).
 */
export async function buscarProductoOVariante(
  termino: string,
  sucursalId: string,
  limit = 20,
): Promise<ResultadoBusquedaVariante[]> {
  const q = termino.trim();
  if (!q) return [];

  const exact = await prisma.variante.findFirst({
    where: {
      codigoBarras: q,
      activa: true,
      producto: { activo: true },
    },
    select,
  });
  if (exact) return [mapVariante(exact, sucursalId)];

  const rows = await prisma.variante.findMany({
    where: {
      activa: true,
      producto: {
        activo: true,
        nombre: { contains: q, mode: 'insensitive' },
      },
    },
    orderBy: [
      { producto: { nombre: 'asc' } },
      { nombre: 'asc' },
    ],
    take: limit,
    select,
  });
  return rows.map((r) => mapVariante(r, sucursalId));
}
