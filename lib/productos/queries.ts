import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { formatearMoneda } from './formato';

export type ProductoListadoItem = {
  id: string;
  nombre: string;
  activo: boolean;
  categoriaNombre: string | null;
  cantidadVariantes: number;
  tieneOverrides: boolean;
  precioBaseFormateado: string;
  costoBaseFormateado: string;
  stockTotal: number;
};

export type GetProductosListadoOpts = {
  q?: string;
  categoriaId?: string;
  sucursalId?: string | null;
  page: number;
  pageSize: number;
};

export type GetProductosListadoResult = {
  productos: ProductoListadoItem[];
  total: number;
};

export async function getProductosListado(
  opts: GetProductosListadoOpts,
): Promise<GetProductosListadoResult> {
  const { q, categoriaId, sucursalId, page, pageSize } = opts;

  const qTrim = q?.trim();
  const where: Prisma.ProductoWhereInput = {};

  if (qTrim) {
    where.OR = [
      { nombre: { contains: qTrim, mode: 'insensitive' } },
      {
        variantes: {
          some: {
            codigoBarras: { contains: qTrim, mode: 'insensitive' },
          },
        },
      },
    ];
  }

  if (categoriaId) {
    where.categoriaId = categoriaId;
  }

  const skip = Math.max(0, (page - 1) * pageSize);

  const [total, productos] = await Promise.all([
    prisma.producto.count({ where }),
    prisma.producto.findMany({
      where,
      orderBy: [{ nombre: 'asc' }],
      skip,
      take: pageSize,
      select: {
        id: true,
        nombre: true,
        activo: true,
        precioBase: true,
        costoBase: true,
        categoria: { select: { nombre: true } },
        variantes: {
          where: { activa: true },
          select: {
            id: true,
            precio: true,
            costo: true,
            stocks: sucursalId
              ? {
                  where: { sucursalId },
                  select: { cantidad: true },
                }
              : { select: { cantidad: true } },
          },
        },
      },
    }),
  ]);

  const items: ProductoListadoItem[] = productos.map((p) => {
    let stockTotal = 0;
    let tieneOverrides = false;
    for (const v of p.variantes) {
      if (v.precio !== null || v.costo !== null) tieneOverrides = true;
      for (const s of v.stocks) stockTotal += s.cantidad;
    }
    return {
      id: p.id,
      nombre: p.nombre,
      activo: p.activo,
      categoriaNombre: p.categoria?.nombre ?? null,
      cantidadVariantes: p.variantes.length,
      tieneOverrides,
      precioBaseFormateado: formatearMoneda(p.precioBase),
      costoBaseFormateado: formatearMoneda(p.costoBase),
      stockTotal,
    };
  });

  return { productos: items, total };
}

export type CategoriaListado = { id: string; nombre: string };

export async function getCategorias(): Promise<CategoriaListado[]> {
  return prisma.categoria.findMany({
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  });
}
