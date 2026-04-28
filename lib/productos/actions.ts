'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth/mock';
import {
  CategoriaInputSchema,
  ProductoInputSchema,
  type CategoriaInput,
  type ProductoInput,
} from './schemas';

type ActionFail = { ok: false; errores: string[] };
type ActionOk = { ok: true };
type ActionResult<T = unknown> = ({ ok: true } & T) | ActionFail;

function toDecimalOrZero(value: number | null | undefined): Prisma.Decimal {
  if (value == null) return new Prisma.Decimal(0);
  return new Prisma.Decimal(value);
}

function toDecimalOrNull(
  value: number | null | undefined,
): Prisma.Decimal | null {
  if (value == null) return null;
  return new Prisma.Decimal(value);
}

async function resolveSucursalId(userSucursalId: string | null): Promise<string | null> {
  if (userSucursalId) return userSucursalId;
  const fallback = await prisma.sucursal.findFirst({
    where: { activa: true },
    orderBy: { creadaEn: 'asc' },
    select: { id: true },
  });
  return fallback?.id ?? null;
}

function dedupeBarcodesInInput(input: ProductoInput): string[] {
  const errores: string[] = [];
  const seen = new Map<string, number>();
  input.variantes.forEach((v, idx) => {
    const code = v.codigoBarras?.trim();
    if (!code) return;
    if (seen.has(code)) {
      errores.push(
        `Código de barras duplicado entre variantes: "${code}" (variantes ${seen.get(code)! + 1} y ${idx + 1}).`,
      );
    } else {
      seen.set(code, idx);
    }
  });
  return errores;
}

async function validarCodigosUnicosVsDb(
  variantes: { id?: string; codigoBarras?: string | null }[],
  productoIdEnEdicion: string | null,
): Promise<string[]> {
  const codes = variantes
    .map((v) => v.codigoBarras?.trim())
    .filter((c): c is string => !!c);
  if (codes.length === 0) return [];

  const existentes = await prisma.variante.findMany({
    where: {
      codigoBarras: { in: codes },
      ...(productoIdEnEdicion
        ? { productoId: { not: productoIdEnEdicion } }
        : {}),
    },
    select: {
      id: true,
      codigoBarras: true,
      producto: { select: { nombre: true } },
    },
  });

  const errores: string[] = [];
  for (const ex of existentes) {
    if (!ex.codigoBarras) continue;
    errores.push(
      `El código de barras "${ex.codigoBarras}" ya está usado por otro producto: "${ex.producto.nombre}".`,
    );
  }
  return errores;
}

const ERROR_GENERICO = 'Error inesperado al guardar. Reintentá o contactá al administrador.';

export async function crearProducto(
  rawInput: unknown,
): Promise<ActionResult<{ productoId: string }>> {
  const user = await requireAuth(['ADMIN']);

  const parsed = ProductoInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      errores: parsed.error.issues.map((i) => i.message),
    };
  }
  const input = parsed.data;

  const erroresDup = dedupeBarcodesInInput(input);
  if (erroresDup.length > 0) return { ok: false, errores: erroresDup };

  const erroresDb = await validarCodigosUnicosVsDb(input.variantes, null);
  if (erroresDb.length > 0) return { ok: false, errores: erroresDb };

  const sucursalId = await resolveSucursalId(user.sucursalId);
  if (!sucursalId) {
    return {
      ok: false,
      errores: ['No hay sucursales activas para asignar el stock inicial.'],
    };
  }

  try {
    const productoId = await prisma.$transaction(async (tx) => {
      if (input.categoriaId) {
        const cat = await tx.categoria.findUnique({
          where: { id: input.categoriaId },
          select: { id: true },
        });
        if (!cat) throw new ActionError(['La categoría seleccionada no existe.']);
      }

      const producto = await tx.producto.create({
        data: {
          nombre: input.nombre,
          descripcion: input.descripcion ?? null,
          categoriaId: input.categoriaId ?? null,
          precioBase: toDecimalOrZero(input.precioBase),
          costoBase: toDecimalOrZero(input.costoBase),
          activo: true,
        },
      });

      for (const v of input.variantes) {
        const variante = await tx.variante.create({
          data: {
            productoId: producto.id,
            nombre: v.nombre,
            codigoBarras: v.codigoBarras?.trim() || null,
            precio: input.tieneVariantes ? toDecimalOrNull(v.precio) : null,
            costo: input.tieneVariantes ? toDecimalOrNull(v.costo) : null,
            atributos: Prisma.JsonNull,
            activa: true,
          },
        });

        const cantidadInicial = v.stockInicial ?? 0;
        await tx.stock.create({
          data: {
            varianteId: variante.id,
            sucursalId,
            cantidad: cantidadInicial,
          },
        });

        if (cantidadInicial > 0) {
          await tx.movimientoStock.create({
            data: {
              varianteId: variante.id,
              sucursalId,
              tipo: 'INGRESO',
              cantidad: cantidadInicial,
              motivo: 'Stock inicial al crear producto',
              usuarioId: user.id,
            },
          });
        }
      }

      return producto.id;
    });

    revalidatePath('/productos');
    return { ok: true, productoId };
  } catch (err) {
    if (err instanceof ActionError) return { ok: false, errores: err.errores };
    console.error('crearProducto error:', err);
    return { ok: false, errores: [ERROR_GENERICO] };
  }
}

export async function editarProducto(
  id: string,
  rawInput: unknown,
): Promise<ActionOk | ActionFail> {
  await requireAuth(['ADMIN']);

  const parsed = ProductoInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      errores: parsed.error.issues.map((i) => i.message),
    };
  }
  const input = parsed.data;

  const erroresDup = dedupeBarcodesInInput(input);
  if (erroresDup.length > 0) return { ok: false, errores: erroresDup };

  const erroresDb = await validarCodigosUnicosVsDb(input.variantes, id);
  if (erroresDb.length > 0) return { ok: false, errores: erroresDb };

  try {
    await prisma.$transaction(async (tx) => {
      const productoActual = await tx.producto.findUnique({
        where: { id },
        select: {
          id: true,
          variantes: {
            select: { id: true },
          },
        },
      });
      if (!productoActual) {
        throw new ActionError(['El producto no existe.']);
      }

      if (input.categoriaId) {
        const cat = await tx.categoria.findUnique({
          where: { id: input.categoriaId },
          select: { id: true },
        });
        if (!cat) throw new ActionError(['La categoría seleccionada no existe.']);
      }

      await tx.producto.update({
        where: { id },
        data: {
          nombre: input.nombre,
          descripcion: input.descripcion ?? null,
          categoriaId: input.categoriaId ?? null,
          precioBase: toDecimalOrZero(input.precioBase),
          costoBase: toDecimalOrZero(input.costoBase),
        },
      });

      const idsEnInput = new Set(
        input.variantes.map((v) => v.id).filter((x): x is string => !!x),
      );
      const idsActuales = productoActual.variantes.map((v) => v.id);
      const idsAEliminar = idsActuales.filter((vid) => !idsEnInput.has(vid));

      for (const varianteId of idsAEliminar) {
        const tieneVentas = await tx.itemVenta.findFirst({
          where: { varianteId },
          select: { id: true },
        });
        const tieneMovimientos = await tx.movimientoStock.findFirst({
          where: { varianteId },
          select: { id: true },
        });
        if (tieneVentas || tieneMovimientos) {
          await tx.variante.update({
            where: { id: varianteId },
            data: { activa: false },
          });
        } else {
          await tx.stock.deleteMany({ where: { varianteId } });
          await tx.variante.delete({ where: { id: varianteId } });
        }
      }

      for (const v of input.variantes) {
        const data = {
          nombre: v.nombre,
          codigoBarras: v.codigoBarras?.trim() || null,
          precio: input.tieneVariantes ? toDecimalOrNull(v.precio) : null,
          costo: input.tieneVariantes ? toDecimalOrNull(v.costo) : null,
        };

        if (v.id && idsActuales.includes(v.id)) {
          await tx.variante.update({
            where: { id: v.id },
            data: { ...data, activa: true },
          });
        } else {
          const sucursalId = await resolveSucursalId(null);
          const variante = await tx.variante.create({
            data: {
              productoId: id,
              ...data,
              atributos: Prisma.JsonNull,
              activa: true,
            },
          });
          if (sucursalId) {
            await tx.stock.create({
              data: {
                varianteId: variante.id,
                sucursalId,
                cantidad: 0,
              },
            });
          }
        }
      }
    });

    revalidatePath('/productos');
    revalidatePath(`/productos/${id}/editar`);
    return { ok: true };
  } catch (err) {
    if (err instanceof ActionError) return { ok: false, errores: err.errores };
    console.error('editarProducto error:', err);
    return { ok: false, errores: [ERROR_GENERICO] };
  }
}

export async function desactivarProducto(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAuth(['ADMIN']);
  try {
    const producto = await prisma.producto.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!producto) return { ok: false, error: 'El producto no existe.' };
    await prisma.producto.update({
      where: { id },
      data: { activo: false },
    });
    revalidatePath('/productos');
    revalidatePath(`/productos/${id}/editar`);
    return { ok: true };
  } catch (err) {
    console.error('desactivarProducto error:', err);
    return { ok: false, error: 'No se pudo desactivar el producto.' };
  }
}

export async function reactivarProducto(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAuth(['ADMIN']);
  try {
    const producto = await prisma.producto.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!producto) return { ok: false, error: 'El producto no existe.' };
    await prisma.producto.update({
      where: { id },
      data: { activo: true },
    });
    revalidatePath('/productos');
    revalidatePath(`/productos/${id}/editar`);
    return { ok: true };
  } catch (err) {
    console.error('reactivarProducto error:', err);
    return { ok: false, error: 'No se pudo reactivar el producto.' };
  }
}

export async function crearCategoria(
  nombre: string,
  descripcion?: string,
): Promise<
  | { ok: true; categoria: { id: string; nombre: string } }
  | { ok: false; error: string }
> {
  await requireAuth(['ADMIN']);
  const parsed = CategoriaInputSchema.safeParse({
    nombre,
    descripcion,
  } satisfies CategoriaInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  }

  try {
    const existente = await prisma.categoria.findUnique({
      where: { nombre: parsed.data.nombre },
      select: { id: true },
    });
    if (existente) {
      return { ok: false, error: 'Ya existe una categoría con ese nombre.' };
    }

    const categoria = await prisma.categoria.create({
      data: {
        nombre: parsed.data.nombre,
        descripcion: parsed.data.descripcion ?? null,
      },
      select: { id: true, nombre: true },
    });
    revalidatePath('/productos');
    return { ok: true, categoria };
  } catch (err) {
    console.error('crearCategoria error:', err);
    return { ok: false, error: 'No se pudo crear la categoría.' };
  }
}

class ActionError extends Error {
  errores: string[];
  constructor(errores: string[]) {
    super(errores.join(' | '));
    this.errores = errores;
  }
}
