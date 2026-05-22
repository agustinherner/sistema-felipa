import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { precioEfectivo } from '@/lib/db/precio';

export const VENTAS_PAGE_SIZE = 50;

export type MetodoPagoVenta = 'EFECTIVO' | 'TRANSFERENCIA' | 'DEBITO' | 'CREDITO';

export type MetodoPagoItem = {
  metodo: MetodoPagoVenta;
  monto: number;
};

export type DescuentoTipo = 'PORCENTAJE' | 'MONTO';

export type VentaListItem = {
  id: string;
  codigoCorto: string;
  creadaEn: string;
  usuarioId: string;
  usuarioNombre: string;
  metodosPago: MetodoPagoItem[];
  subtotal: number;
  descuentoTotal: number;
  descuentoTipo: DescuentoTipo | null;
  descuentoValor: number | null;
  total: number;
  aplicaDescuento: boolean;
  anulada: boolean;
};

export type ListarVentasParams = {
  sucursalId: string;
  usuarioId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  metodoPago?: MetodoPagoVenta;
  incluirAnuladas: boolean;
  page: number;
};

export type ListarVentasResult = {
  ventas: VentaListItem[];
  hayMas: boolean;
};

function normalizarDescuentoTipo(value: string | null): DescuentoTipo | null {
  if (value === 'PORCENTAJE' || value === 'MONTO') return value;
  return null;
}

function parseMetodosPago(value: unknown): MetodoPagoItem[] {
  if (!Array.isArray(value)) return [];
  const out: MetodoPagoItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as { metodo?: unknown; monto?: unknown };
    const metodo = r.metodo;
    const monto = r.monto;
    if (
      (metodo === 'EFECTIVO' ||
        metodo === 'TRANSFERENCIA' ||
        metodo === 'DEBITO' ||
        metodo === 'CREDITO') &&
      (typeof monto === 'number' || typeof monto === 'string')
    ) {
      const n = typeof monto === 'number' ? monto : Number(monto);
      if (Number.isFinite(n)) out.push({ metodo, monto: n });
    }
  }
  return out;
}

export async function listarVentas(
  params: ListarVentasParams,
): Promise<ListarVentasResult> {
  const {
    sucursalId,
    usuarioId,
    fechaDesde,
    fechaHasta,
    metodoPago,
    incluirAnuladas,
    page,
  } = params;

  const pageNum = Math.max(1, Math.floor(page) || 1);
  const take = VENTAS_PAGE_SIZE + 1;
  const skip = (pageNum - 1) * VENTAS_PAGE_SIZE;

  const where: Prisma.VentaWhereInput = { sucursalId };
  if (usuarioId) where.usuarioId = usuarioId;
  if (fechaDesde || fechaHasta) {
    where.creadaEn = {};
    if (fechaDesde) where.creadaEn.gte = fechaDesde;
    if (fechaHasta) where.creadaEn.lte = fechaHasta;
  }
  if (metodoPago) {
    where.metodosPago = {
      array_contains: [{ metodo: metodoPago }],
    };
  }
  if (!incluirAnuladas) {
    where.anuladaEn = null;
  }

  const rows = await prisma.venta.findMany({
    where,
    orderBy: { creadaEn: 'desc' },
    take,
    skip,
    select: {
      id: true,
      codigoCorto: true,
      creadaEn: true,
      usuarioId: true,
      subtotal: true,
      descuentoTotal: true,
      descuentoTipo: true,
      descuentoValor: true,
      total: true,
      aplicaDescuento: true,
      metodosPago: true,
      anuladaEn: true,
      usuario: { select: { nombre: true } },
    },
  });

  const hayMas = rows.length > VENTAS_PAGE_SIZE;
  const sliced = hayMas ? rows.slice(0, VENTAS_PAGE_SIZE) : rows;

  const ventas: VentaListItem[] = sliced.map((v) => ({
    id: v.id,
    codigoCorto: v.codigoCorto,
    creadaEn: v.creadaEn.toISOString(),
    usuarioId: v.usuarioId,
    usuarioNombre: v.usuario.nombre,
    metodosPago: parseMetodosPago(v.metodosPago),
    subtotal: Number(v.subtotal),
    descuentoTotal: Number(v.descuentoTotal),
    descuentoTipo: normalizarDescuentoTipo(v.descuentoTipo),
    descuentoValor: v.descuentoValor !== null ? Number(v.descuentoValor) : null,
    total: Number(v.total),
    aplicaDescuento: v.aplicaDescuento,
    anulada: v.anuladaEn !== null,
  }));

  return { ventas, hayMas };
}

export type VentaDetalleItem = {
  id: string;
  varianteId: string;
  productoNombre: string;
  varianteNombre: string;
  esVarianteUnicaImplicita: boolean;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export type VentaAnulacionInfo = {
  anuladaEn: string;
  anuladaPorNombre: string | null;
  motivo: string | null;
};

export type VentaDetalle = {
  id: string;
  codigoCorto: string;
  creadaEn: string;
  usuarioId: string;
  usuarioNombre: string;
  subtotal: number;
  descuentoTotal: number;
  descuentoTipo: DescuentoTipo | null;
  descuentoValor: number | null;
  total: number;
  aplicaDescuento: boolean;
  metodosPago: MetodoPagoItem[];
  whatsappCliente: string | null;
  turno: { aperturaEn: string; cierreEn: string | null } | null;
  items: VentaDetalleItem[];
  anulacion: VentaAnulacionInfo | null;
};

function esNombreVarianteUnica(nombre: string): boolean {
  return nombre === 'Única' || nombre === 'Único';
}

export async function obtenerVentaDetalle(
  ventaId: string,
): Promise<VentaDetalle | null> {
  const v = await prisma.venta.findUnique({
    where: { id: ventaId },
    select: {
      id: true,
      codigoCorto: true,
      creadaEn: true,
      usuarioId: true,
      subtotal: true,
      descuentoTotal: true,
      descuentoTipo: true,
      descuentoValor: true,
      total: true,
      aplicaDescuento: true,
      metodosPago: true,
      whatsappCliente: true,
      turnoId: true,
      anuladaEn: true,
      motivoAnulacion: true,
      usuario: { select: { nombre: true } },
      anuladaPor: { select: { nombre: true } },
      turno: { select: { aperturaEn: true, cierreEn: true } },
      items: {
        select: {
          id: true,
          varianteId: true,
          cantidad: true,
          precioUnitario: true,
          subtotal: true,
          variante: {
            select: {
              nombre: true,
              producto: { select: { nombre: true } },
            },
          },
        },
      },
    },
  });
  if (!v) return null;

  return {
    id: v.id,
    codigoCorto: v.codigoCorto,
    creadaEn: v.creadaEn.toISOString(),
    usuarioId: v.usuarioId,
    usuarioNombre: v.usuario.nombre,
    subtotal: Number(v.subtotal),
    descuentoTotal: Number(v.descuentoTotal),
    descuentoTipo: normalizarDescuentoTipo(v.descuentoTipo),
    descuentoValor: v.descuentoValor !== null ? Number(v.descuentoValor) : null,
    total: Number(v.total),
    aplicaDescuento: v.aplicaDescuento,
    metodosPago: parseMetodosPago(v.metodosPago),
    whatsappCliente: v.whatsappCliente,
    turno: v.turno
      ? {
          aperturaEn: v.turno.aperturaEn.toISOString(),
          cierreEn: v.turno.cierreEn ? v.turno.cierreEn.toISOString() : null,
        }
      : null,
    items: v.items.map((i) => ({
      id: i.id,
      varianteId: i.varianteId,
      productoNombre: i.variante.producto.nombre,
      varianteNombre: i.variante.nombre,
      esVarianteUnicaImplicita: esNombreVarianteUnica(i.variante.nombre),
      cantidad: i.cantidad,
      precioUnitario: Number(i.precioUnitario),
      subtotal: Number(i.subtotal),
    })),
    anulacion: v.anuladaEn
      ? {
          anuladaEn: v.anuladaEn.toISOString(),
          anuladaPorNombre: v.anuladaPor?.nombre ?? null,
          motivo: v.motivoAnulacion,
        }
      : null,
  };
}

export async function listarUsuariosDeSucursal(
  sucursalId: string,
): Promise<{ id: string; nombre: string }[]> {
  return prisma.user.findMany({
    where: { sucursalId },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true },
  });
}

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
