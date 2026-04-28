import { Prisma, type TipoMovimiento } from '@prisma/client';
import { prisma } from '@/lib/db';
import {
  esNombreVarianteUnica,
  type VarianteParaIngreso,
} from './helpers';

const DIA_MS = 24 * 60 * 60 * 1000;

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

export type MovimientoListadoFila = {
  id: string;
  creadoEn: Date;
  tipo: TipoMovimiento;
  cantidad: number;
  stockResultante: number;
  motivo: string | null;
  productoNombre: string;
  varianteNombre: string;
  esVarianteUnicaImplicita: boolean;
  varianteId: string;
  usuarioId: string;
  usuarioNombre: string;
  ventaId: string | null;
  ventaCodigoCorto: string | null;
};

export type GetMovimientosListadoOpts = {
  desde?: Date;
  hasta?: Date;
  tipo?: TipoMovimiento;
  varianteId?: string;
  usuarioId?: string;
  motivo?: string;
  sucursalId: string;
  page: number;
  pageSize: number;
};

export type GetMovimientosListadoResult = {
  filas: MovimientoListadoFila[];
  total: number;
  desdeAplicado: Date;
  hastaAplicado: Date;
};

export function rangoDefault(): { desde: Date; hasta: Date } {
  const ahora = new Date();
  const hasta = new Date(ahora);
  hasta.setHours(23, 59, 59, 999);
  const desde = new Date(ahora.getTime() - 30 * DIA_MS);
  desde.setHours(0, 0, 0, 0);
  return { desde, hasta };
}

export function inicioDelDia(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function finDelDia(d: Date): Date {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}

type RawMovimientoRow = {
  id: string;
  creadoEn: Date;
  tipo: TipoMovimiento;
  cantidad: number;
  stockResultante: bigint | number | string;
  motivo: string | null;
  varianteId: string;
  usuarioId: string;
  ventaId: string | null;
  varianteNombre: string;
  productoNombre: string;
  usuarioNombre: string;
  ventaCodigoCorto: string | null;
};

export async function getMovimientosListado(
  opts: GetMovimientosListadoOpts,
): Promise<GetMovimientosListadoResult> {
  const {
    desde,
    hasta,
    tipo,
    varianteId,
    usuarioId,
    motivo,
    sucursalId,
    page,
    pageSize,
  } = opts;

  const def = rangoDefault();
  const desdeAplicado = desde ? inicioDelDia(desde) : def.desde;
  const hastaAplicado = hasta ? finDelDia(hasta) : def.hasta;

  const filterClauses: Prisma.Sql[] = [
    Prisma.sql`movs."sucursalId" = ${sucursalId}`,
    Prisma.sql`movs."creadoEn" >= ${desdeAplicado}`,
    Prisma.sql`movs."creadoEn" <= ${hastaAplicado}`,
  ];
  if (tipo) {
    filterClauses.push(Prisma.sql`movs.tipo::text = ${tipo}`);
  }
  if (varianteId) {
    filterClauses.push(Prisma.sql`movs."varianteId" = ${varianteId}`);
  }
  if (usuarioId) {
    filterClauses.push(Prisma.sql`movs."usuarioId" = ${usuarioId}`);
  }
  const motivoTrim = motivo?.trim();
  if (motivoTrim) {
    filterClauses.push(
      Prisma.sql`movs.motivo ILIKE ${'%' + motivoTrim + '%'}`,
    );
  }

  const filterSql = Prisma.join(filterClauses, ' AND ');
  const offset = Math.max(0, (page - 1) * pageSize);

  const whereCount: Prisma.MovimientoStockWhereInput = {
    sucursalId,
    creadoEn: { gte: desdeAplicado, lte: hastaAplicado },
  };
  if (tipo) whereCount.tipo = tipo;
  if (varianteId) whereCount.varianteId = varianteId;
  if (usuarioId) whereCount.usuarioId = usuarioId;
  if (motivoTrim) {
    whereCount.motivo = { contains: motivoTrim, mode: 'insensitive' };
  }

  const [rows, total] = await Promise.all([
    prisma.$queryRaw<RawMovimientoRow[]>`
      WITH movs AS (
        SELECT
          m.id,
          m."creadoEn",
          m.tipo,
          m.cantidad,
          m.motivo,
          m."varianteId",
          m."sucursalId",
          m."usuarioId",
          m."ventaId",
          SUM(m.cantidad) OVER (
            PARTITION BY m."varianteId", m."sucursalId"
            ORDER BY m."creadoEn", m.id
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
          ) AS "stockResultante"
        FROM "MovimientoStock" m
        WHERE m."sucursalId" = ${sucursalId}
      )
      SELECT
        movs.id,
        movs."creadoEn",
        movs.tipo,
        movs.cantidad,
        movs.motivo,
        movs."varianteId",
        movs."usuarioId",
        movs."ventaId",
        movs."stockResultante",
        v.nombre AS "varianteNombre",
        p.nombre AS "productoNombre",
        u.nombre AS "usuarioNombre",
        vt."codigoCorto" AS "ventaCodigoCorto"
      FROM movs
      JOIN "Variante" v ON v.id = movs."varianteId"
      JOIN "Producto" p ON p.id = v."productoId"
      JOIN "Usuario" u ON u.id = movs."usuarioId"
      LEFT JOIN "Venta" vt ON vt.id = movs."ventaId"
      WHERE ${filterSql}
      ORDER BY movs."creadoEn" DESC, movs.id DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `,
    prisma.movimientoStock.count({ where: whereCount }),
  ]);

  const filas: MovimientoListadoFila[] = rows.map((r) => ({
    id: r.id,
    creadoEn: r.creadoEn,
    tipo: r.tipo,
    cantidad: r.cantidad,
    stockResultante: Number(r.stockResultante),
    motivo: r.motivo,
    productoNombre: r.productoNombre,
    varianteNombre: r.varianteNombre,
    esVarianteUnicaImplicita: esNombreVarianteUnica(r.varianteNombre),
    varianteId: r.varianteId,
    usuarioId: r.usuarioId,
    usuarioNombre: r.usuarioNombre,
    ventaId: r.ventaId,
    ventaCodigoCorto: r.ventaCodigoCorto,
  }));

  return { filas, total, desdeAplicado, hastaAplicado };
}

export async function getVarianteEtiqueta(
  varianteId: string,
): Promise<{ id: string; label: string } | null> {
  const v = await prisma.variante.findUnique({
    where: { id: varianteId },
    select: {
      id: true,
      nombre: true,
      producto: { select: { nombre: true } },
    },
  });
  if (!v) return null;
  const esUnica = esNombreVarianteUnica(v.nombre);
  const label = esUnica ? v.producto.nombre : `${v.producto.nombre} · ${v.nombre}`;
  return { id: v.id, label };
}

export async function getUsuariosActivos(): Promise<
  { id: string; nombre: string }[]
> {
  return prisma.usuario.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true },
  });
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
