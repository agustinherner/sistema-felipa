'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/session';
import { getTurnoAbierto } from '@/lib/turnos/queries';
import { crearVentaCore } from './core';
import { fail, type ActionResult } from './types';

export async function crearVenta(
  rawInput: unknown,
): Promise<ActionResult<{ ventaId: string; idCorto: string }>> {
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
