'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth/mock';
import { AjusteSchema, IngresoBulkSchema } from './schemas';
import {
  buscarVariantesParaIngreso,
  getMovimientosVariante,
} from './queries';
import {
  construirMotivoIngreso,
  etiquetaVariante,
  tipoMovimientoLabel,
  type HistorialMovimientoView,
  type VarianteParaIngreso,
} from './helpers';

const ERROR_GENERICO =
  'Error inesperado al registrar el ajuste. Reintentá o contactá al administrador.';

const ERROR_INGRESO_GENERICO =
  'Error inesperado al registrar el ingreso. Reintentá o contactá al administrador.';

export type AjusteResult =
  | {
      ok: true;
      nuevoStock: number;
      movimientoId: string | null;
      sinCambios: boolean;
    }
  | { ok: false; errores: string[] };

export async function registrarAjuste(
  rawInput: unknown,
): Promise<AjusteResult> {
  const user = await requireAuth(['ADMIN']);
  const parsed = AjusteSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      errores: parsed.error.issues.map((i) => i.message),
    };
  }
  const input = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const stock = await tx.stock.findUnique({
        where: {
          varianteId_sucursalId: {
            varianteId: input.varianteId,
            sucursalId: input.sucursalId,
          },
        },
      });
      if (!stock) {
        throw new ActionError([
          'No existe stock para esta variante en la sucursal indicada.',
        ]);
      }

      let delta: number;
      switch (input.tipo) {
        case 'AJUSTE_ROTURA':
        case 'AJUSTE_ROBO':
          delta = -input.cantidadInput;
          break;
        case 'DEVOLUCION':
          delta = input.cantidadInput;
          break;
        case 'AJUSTE_CONTEO':
          delta = input.cantidadInput - stock.cantidad;
          break;
      }

      if (input.tipo === 'AJUSTE_CONTEO' && delta === 0) {
        return {
          nuevoStock: stock.cantidad,
          movimientoId: null as string | null,
          sinCambios: true,
        };
      }

      const motivo = (input.motivo ?? '').trim() || null;
      const movimiento = await tx.movimientoStock.create({
        data: {
          varianteId: input.varianteId,
          sucursalId: input.sucursalId,
          tipo: input.tipo,
          cantidad: delta,
          motivo,
          usuarioId: user.id,
        },
      });
      const nuevoStock = stock.cantidad + delta;
      await tx.stock.update({
        where: { id: stock.id },
        data: { cantidad: nuevoStock },
      });
      return {
        nuevoStock,
        movimientoId: movimiento.id as string | null,
        sinCambios: false,
      };
    });

    revalidatePath('/stock');
    return { ok: true, ...result };
  } catch (err) {
    if (err instanceof ActionError) return { ok: false, errores: err.errores };
    console.error('registrarAjuste error:', err);
    return { ok: false, errores: [ERROR_GENERICO] };
  }
}

export type HistorialResult =
  | { ok: true; items: HistorialMovimientoView[] }
  | { ok: false; error: string };

const FECHA_HORA_FMT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export async function obtenerHistorialVariante(
  varianteId: string,
  sucursalId: string,
): Promise<HistorialResult> {
  await requireAuth(['ADMIN']);
  try {
    const items = await getMovimientosVariante(varianteId, sucursalId, 20);
    return {
      ok: true,
      items: items.map((m) => ({
        id: m.id,
        creadoEnTexto: FECHA_HORA_FMT.format(m.creadoEn),
        tipoLabel: tipoMovimientoLabel(m.tipo),
        cantidad: m.cantidad,
        motivo: m.motivo,
        usuarioNombre: m.usuarioNombre,
        ventaId: m.ventaId,
        ventaCodigoCorto: m.ventaCodigoCorto,
      })),
    };
  } catch (err) {
    console.error('obtenerHistorialVariante error:', err);
    return { ok: false, error: 'No se pudo cargar el historial.' };
  }
}

export type IngresoBulkResult =
  | {
      ok: true;
      lineasProcesadas: number;
      unidadesTotales: number;
      movimientoIds: string[];
    }
  | { ok: false; errores: string[] };

export async function registrarIngresoBulk(
  rawInput: unknown,
): Promise<IngresoBulkResult> {
  const user = await requireAuth(['ADMIN']);
  const parsed = IngresoBulkSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      errores: parsed.error.issues.map((i) => i.message),
    };
  }
  const input = parsed.data;

  const cantidadesPorVariante = new Map<string, number>();
  for (const linea of input.lineas) {
    cantidadesPorVariante.set(
      linea.varianteId,
      (cantidadesPorVariante.get(linea.varianteId) ?? 0) + linea.cantidad,
    );
  }

  const motivo = construirMotivoIngreso({
    identificador: input.identificador,
    proveedor: input.proveedor,
    observaciones: input.observaciones,
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sucursal = await tx.sucursal.findUnique({
        where: { id: input.sucursalId },
        select: { id: true, activa: true },
      });
      if (!sucursal || !sucursal.activa) {
        throw new ActionError(['Sucursal inválida o inactiva.']);
      }

      const variantes = await tx.variante.findMany({
        where: { id: { in: Array.from(cantidadesPorVariante.keys()) } },
        select: {
          id: true,
          activa: true,
          nombre: true,
          producto: { select: { nombre: true, activo: true } },
        },
      });

      if (variantes.length !== cantidadesPorVariante.size) {
        const encontradas = new Set(variantes.map((v) => v.id));
        const faltantes = Array.from(cantidadesPorVariante.keys()).filter(
          (id) => !encontradas.has(id),
        );
        throw new ActionError([
          `No se encontraron ${faltantes.length} variante(s) seleccionada(s). Refrescá la página y reintentá.`,
        ]);
      }

      const inactivas = variantes.filter(
        (v) => !v.activa || !v.producto.activo,
      );
      if (inactivas.length > 0) {
        const nombres = inactivas
          .map((v) =>
            etiquetaVariante({
              productoNombre: v.producto.nombre,
              varianteNombre: v.nombre,
              esVarianteUnicaImplicita: false,
            }),
          )
          .join(', ');
        throw new ActionError([
          `Hay variantes o productos inactivos en el lote: ${nombres}. Reactivalos desde Productos antes de ingresar stock.`,
        ]);
      }

      const movimientoIds: string[] = [];
      let unidadesTotales = 0;

      const entradas = Array.from(cantidadesPorVariante.entries());
      for (const [varianteId, cantidad] of entradas) {
        const movimiento = await tx.movimientoStock.create({
          data: {
            varianteId,
            sucursalId: input.sucursalId,
            tipo: 'INGRESO',
            cantidad,
            motivo,
            usuarioId: user.id,
          },
        });
        movimientoIds.push(movimiento.id);

        await tx.stock.upsert({
          where: {
            varianteId_sucursalId: {
              varianteId,
              sucursalId: input.sucursalId,
            },
          },
          update: {
            cantidad: { increment: cantidad },
          },
          create: {
            varianteId,
            sucursalId: input.sucursalId,
            cantidad,
          },
        });

        unidadesTotales += cantidad;
      }

      return {
        lineasProcesadas: cantidadesPorVariante.size,
        unidadesTotales,
        movimientoIds,
      };
    });

    revalidatePath('/stock');
    revalidatePath('/stock/ingreso');
    return { ok: true, ...result };
  } catch (err) {
    if (err instanceof ActionError) return { ok: false, errores: err.errores };
    console.error('registrarIngresoBulk error:', err);
    return { ok: false, errores: [ERROR_INGRESO_GENERICO] };
  }
}

export type BuscarVariantesResult =
  | { ok: true; items: VarianteParaIngreso[] }
  | { ok: false; error: string };

export async function buscarVariantesIngresoAction(
  q: string,
  sucursalId: string,
): Promise<BuscarVariantesResult> {
  await requireAuth(['ADMIN']);
  try {
    const items = await buscarVariantesParaIngreso({
      q,
      sucursalId,
      limit: 20,
    });
    return { ok: true, items };
  } catch (err) {
    console.error('buscarVariantesIngresoAction error:', err);
    return { ok: false, error: 'Error al buscar variantes.' };
  }
}

class ActionError extends Error {
  errores: string[];
  constructor(errores: string[]) {
    super(errores.join(' | '));
    this.errores = errores;
  }
}
