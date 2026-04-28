import { Prisma, type TipoMovimiento } from '@prisma/client';
import { prisma } from '@/lib/db';
import {
  esNombreVarianteUnica,
  type VarianteParaIngreso,
} from './helpers';

export type StockListadoFila = {
  productoId: string;
  productoNombre: string;
  productoActivo: boolean;
  categoriaNombre: string | null;
  varianteId: string;
  varianteNombre: string;
  varianteActiva: boolean;
  stockActual: number;
  sucursalId: string;
};

export type GetStockListadoOpts = {
  q?: string;
  categoriaId?: string;
  sucursalId?: string | null;
  soloStockBajo?: boolean;
  soloStockNegativo?: boolean;
  incluirInactivas?: boolean;
  page: number;
  pageSize: number;
};

export type GetStockListadoResult = {
  filas: StockListadoFila[];
  total: number;
};

export async function getStockListado(
  opts: GetStockListadoOpts,
): Promise<GetStockListadoResult> {
  const {
    q,
    categoriaId,
    sucursalId,
    soloStockBajo,
    soloStockNegativo,
    incluirInactivas,
    page,
    pageSize,
  } = opts;

  const qTrim = q?.trim();
  const where: Prisma.StockWhereInput = {};
  if (sucursalId) where.sucursalId = sucursalId;

  const variante: Prisma.VarianteWhereInput = {};
  if (!incluirInactivas) variante.activa = true;
  if (categoriaId) variante.producto = { categoriaId };
  if (qTrim) {
    variante.OR = [
      { nombre: { contains: qTrim, mode: 'insensitive' } },
      { producto: { nombre: { contains: qTrim, mode: 'insensitive' } } },
    ];
  }
  if (Object.keys(variante).length > 0) where.variante = variante;

  if (soloStockNegativo) where.cantidad = { lt: 0 };
  else if (soloStockBajo) where.cantidad = { lte: 3 };

  const skip = Math.max(0, (page - 1) * pageSize);

  const [total, stocks] = await Promise.all([
    prisma.stock.count({ where }),
    prisma.stock.findMany({
      where,
      orderBy: [
        { variante: { producto: { nombre: 'asc' } } },
        { variante: { nombre: 'asc' } },
      ],
      skip,
      take: pageSize,
      select: {
        cantidad: true,
        sucursalId: true,
        variante: {
          select: {
            id: true,
            nombre: true,
            activa: true,
            producto: {
              select: {
                id: true,
                nombre: true,
                activo: true,
                categoria: { select: { nombre: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const filas: StockListadoFila[] = stocks.map((s) => ({
    productoId: s.variante.producto.id,
    productoNombre: s.variante.producto.nombre,
    productoActivo: s.variante.producto.activo,
    categoriaNombre: s.variante.producto.categoria?.nombre ?? null,
    varianteId: s.variante.id,
    varianteNombre: s.variante.nombre,
    varianteActiva: s.variante.activa,
    stockActual: s.cantidad,
    sucursalId: s.sucursalId,
  }));

  return { filas, total };
}

export type MovimientoVarianteRow = {
  id: string;
  creadoEn: Date;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string | null;
  usuarioNombre: string;
  ventaId: string | null;
  ventaCodigoCorto: string | null;
};

export async function getMovimientosVariante(
  varianteId: string,
  sucursalId: string,
  limit: number = 20,
): Promise<MovimientoVarianteRow[]> {
  const rows = await prisma.movimientoStock.findMany({
    where: { varianteId, sucursalId },
    orderBy: { creadoEn: 'desc' },
    take: limit,
    select: {
      id: true,
      creadoEn: true,
      tipo: true,
      cantidad: true,
      motivo: true,
      ventaId: true,
      usuario: { select: { nombre: true } },
      venta: { select: { codigoCorto: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    creadoEn: r.creadoEn,
    tipo: r.tipo,
    cantidad: r.cantidad,
    motivo: r.motivo,
    usuarioNombre: r.usuario.nombre,
    ventaId: r.ventaId,
    ventaCodigoCorto: r.venta?.codigoCorto ?? null,
  }));
}

export async function buscarVariantesParaIngreso(opts: {
  q: string;
  sucursalId: string;
  limit?: number;
}): Promise<VarianteParaIngreso[]> {
  const q = opts.q.trim();
  const sucursalId = opts.sucursalId;
  const limit = opts.limit ?? 20;
  if (!q) return [];

  const select = {
    id: true,
    nombre: true,
    codigoBarras: true,
    activa: true,
    producto: { select: { nombre: true, activo: true } },
    stocks: {
      where: { sucursalId },
      select: { cantidad: true },
    },
  } satisfies Prisma.VarianteSelect;

  const exact = await prisma.variante.findFirst({
    where: { codigoBarras: q },
    select,
  });

  if (exact) {
    return [mapVarianteParaIngreso(exact)];
  }

  const rows = await prisma.variante.findMany({
    where: {
      OR: [
        { codigoBarras: { contains: q, mode: 'insensitive' } },
        { nombre: { contains: q, mode: 'insensitive' } },
        { producto: { nombre: { contains: q, mode: 'insensitive' } } },
      ],
    },
    orderBy: [
      { producto: { nombre: 'asc' } },
      { nombre: 'asc' },
    ],
    take: limit,
    select,
  });

  return rows.map(mapVarianteParaIngreso);
}

function mapVarianteParaIngreso(r: {
  id: string;
  nombre: string;
  codigoBarras: string | null;
  activa: boolean;
  producto: { nombre: string; activo: boolean };
  stocks: { cantidad: number }[];
}): VarianteParaIngreso {
  return {
    varianteId: r.id,
    productoNombre: r.producto.nombre,
    varianteNombre: r.nombre,
    codigoBarras: r.codigoBarras,
    esVarianteUnicaImplicita: esNombreVarianteUnica(r.nombre),
    varianteActiva: r.activa,
    productoActivo: r.producto.activo,
    stockActual: r.stocks[0]?.cantidad ?? 0,
  };
}
