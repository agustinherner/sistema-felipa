'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth/mock';
import { AjusteSchema } from './schemas';
import { getMovimientosVariante } from './queries';
import {
  tipoMovimientoLabel,
  type HistorialMovimientoView,
} from './helpers';

const ERROR_GENERICO =
  'Error inesperado al registrar el ajuste. Reintentá o contactá al administrador.';

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

class ActionError extends Error {
  errores: string[];
  constructor(errores: string[]) {
    super(errores.join(' | '));
    this.errores = errores;
  }
}
