'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
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
