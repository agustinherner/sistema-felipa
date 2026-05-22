'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getCurrentUser, requireAuth } from '@/lib/auth/session';
import { getTurnoAbierto } from '@/lib/turnos/queries';
import {
  buscarProductoOVariante,
  obtenerVentaDetalle,
  type VentaDetalle,
} from './queries';
import { crearVentaCore } from './core';
import { fail, type ActionResult } from './types';

export type ResultadoBusqueda = {
  varianteId: string;
  nombreCompleto: string;
  precioEfectivo: number;
  stockActual: number;
  tieneStock: boolean;
  esNuevo?: boolean;
};

const TerminoSchema = z
  .string()
  .trim()
  .min(1, 'Ingresá al menos un carácter')
  .max(100, 'El término es demasiado largo');

export async function buscarProducto(
  rawTermino: unknown,
): Promise<ActionResult<{ resultados: ResultadoBusqueda[] }>> {
  const user = await getCurrentUser();
  if (!user) return fail(['No autenticado']);
  if (!user.sucursalId) {
    return fail(['Tu usuario no tiene sucursal asignada.']);
  }

  const parsed = TerminoSchema.safeParse(rawTermino);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }

  const rows = await buscarProductoOVariante(parsed.data, user.sucursalId, 8);
  const resultados: ResultadoBusqueda[] = rows.map((r) => ({
    varianteId: r.varianteId,
    nombreCompleto: r.nombreCompleto,
    precioEfectivo: r.precioEfectivo.toNumber(),
    stockActual: r.stockActual,
    tieneStock: r.tieneStock,
  }));
  return { ok: true, resultados };
}

export async function crearVenta(
  rawInput: unknown,
): Promise<ActionResult<{ ventaId: string; codigoCorto: string }>> {
  const user = await requireAuth(['ADMIN', 'VENDEDOR']);

  if (!user.sucursalId) {
    return fail(['Tu usuario no tiene sucursal asignada. Pedile a un admin que te la asigne.']);
  }

  const turno = await getTurnoAbierto(user.id);
  if (!turno) {
    return fail(['Necesitás un turno abierto para registrar una venta.']);
  }

  const result = await crearVentaCore(rawInput, {
    userId: user.id,
    sucursalId: user.sucursalId,
    turnoId: turno.id,
  });

  if (result.ok) {
    revalidatePath('/ventas');
    revalidatePath('/stock');
  }
  return result;
}

const DetalleVentaSchema = z.object({
  ventaId: z.string().min(1, 'ventaId requerido'),
});

export async function obtenerDetalleVentaAction(
  rawInput: unknown,
): Promise<ActionResult<{ venta: VentaDetalle }>> {
  const user = await requireAuth(['ADMIN', 'VENDEDOR']);

  const parsed = DetalleVentaSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }

  const venta = await obtenerVentaDetalle(parsed.data.ventaId);
  if (!venta) return fail(['Venta no encontrada']);

  const esAdmin = user.role === 'admin';
  if (!esAdmin && venta.usuarioId !== user.id) {
    return fail(['No autorizado']);
  }

  return { ok: true, venta };
}

const AnularVentaSchema = z.object({
  ventaId: z.string().min(1, 'ventaId requerido'),
  motivo: z
    .string()
    .trim()
    .min(3, 'El motivo debe tener al menos 3 caracteres')
    .max(500, 'El motivo es demasiado largo'),
});

export async function anularVenta(
  rawInput: unknown,
): Promise<ActionResult<{ ventaId: string; codigoCorto: string }>> {
  const user = await requireAuth(['ADMIN', 'VENDEDOR']);

  const parsed = AnularVentaSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }
  const { ventaId, motivo } = parsed.data;

  const venta = await prisma.venta.findUnique({
    where: { id: ventaId },
    select: {
      id: true,
      codigoCorto: true,
      sucursalId: true,
      usuarioId: true,
      anuladaEn: true,
      turno: { select: { id: true, cierreEn: true } },
      items: { select: { varianteId: true, cantidad: true } },
    },
  });

  if (!venta) return fail(['Venta no encontrada.']);
  if (venta.anuladaEn) return fail(['La venta ya está anulada.']);
  if (!venta.turno) {
    return fail(['La venta no tiene turno asociado, no se puede anular.']);
  }
  if (venta.turno.cierreEn) {
    return fail([
      'No se puede anular una venta de un turno cerrado. Usá devolución.',
    ]);
  }

  const esAdmin = user.role === 'admin';
  if (!esAdmin && venta.usuarioId !== user.id) {
    return fail(['Solo podés anular tus propias ventas.']);
  }

  await prisma.$transaction(async (tx) => {
    const upd = await tx.venta.updateMany({
      where: { id: venta.id, anuladaEn: null },
      data: {
        anuladaEn: new Date(),
        anuladaPorId: user.id,
        motivoAnulacion: motivo,
      },
    });
    if (upd.count !== 1) {
      throw new Error('La venta ya fue anulada por otra sesión.');
    }

    for (const it of venta.items) {
      await tx.movimientoStock.create({
        data: {
          varianteId: it.varianteId,
          sucursalId: venta.sucursalId,
          tipo: 'ANULACION_VENTA',
          cantidad: it.cantidad,
          motivo,
          usuarioId: user.id,
          ventaId: venta.id,
        },
      });
      await tx.stock.upsert({
        where: {
          varianteId_sucursalId: {
            varianteId: it.varianteId,
            sucursalId: venta.sucursalId,
          },
        },
        update: { cantidad: { increment: it.cantidad } },
        create: {
          varianteId: it.varianteId,
          sucursalId: venta.sucursalId,
          cantidad: it.cantidad,
        },
      });
    }
  });

  revalidatePath('/ventas');
  revalidatePath('/stock');
  revalidatePath('/');
  return { ok: true, ventaId: venta.id, codigoCorto: venta.codigoCorto };
}
