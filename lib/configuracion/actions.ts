'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { Prisma, Rol } from '@prisma/client';
import { APIError } from 'better-auth/api';
import { auth } from '@/lib/auth/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { CONFIGURACION_ID } from './queries';
import {
  ActualizarConfiguracionSchema,
  CambiarPasswordPropiaSchema,
} from './schemas';

type ActionFail = { ok: false; errores: string[] };
type ActionOk = { ok: true };
type ActionResult<T = unknown> = (ActionOk & T) | ActionFail;

const ERROR_GENERICO =
  'Error inesperado al guardar. Reintentá o contactá al administrador.';

function fail(errores: string[]): ActionFail {
  return { ok: false, errores };
}

export async function actualizarConfiguracion(
  rawInput: unknown,
): Promise<ActionResult> {
  await requireAuth([Rol.ADMIN]);

  const parsed = ActualizarConfiguracionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }
  const input = parsed.data;

  try {
    await prisma.configuracion.upsert({
      where: { id: CONFIGURACION_ID },
      create: {
        id: CONFIGURACION_ID,
        nombreNegocio: input.nombreNegocio,
        direccion: input.direccion,
        telefono: input.telefono,
        cuit: input.cuit,
        markupDefault: new Prisma.Decimal(input.markupDefault),
        descuentoEstandar: new Prisma.Decimal(input.descuentoEstandar),
        diasDevolucion: input.diasDevolucion,
        umbralStockBajo: input.umbralStockBajo,
      },
      update: {
        nombreNegocio: input.nombreNegocio,
        direccion: input.direccion,
        telefono: input.telefono,
        cuit: input.cuit,
        markupDefault: new Prisma.Decimal(input.markupDefault),
        descuentoEstandar: new Prisma.Decimal(input.descuentoEstandar),
        diasDevolucion: input.diasDevolucion,
        umbralStockBajo: input.umbralStockBajo,
      },
    });
  } catch {
    return fail([ERROR_GENERICO]);
  }

  revalidatePath('/configuracion');
  return { ok: true };
}

export async function cambiarPasswordPropia(
  rawInput: unknown,
): Promise<ActionResult> {
  // Cualquier rol logueado puede cambiar SU propia password.
  await requireAuth();

  const parsed = CambiarPasswordPropiaSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }
  const { currentPassword, newPassword } = parsed.data;

  try {
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        // No revocamos otras sesiones: el cambio es voluntario, no un reset por
        // sospecha. El admin-reset (resetUsuarioPassword) sí kickea sesiones.
        revokeOtherSessions: false,
      },
      headers: await headers(),
    });
  } catch (err) {
    if (err instanceof APIError) {
      const status = String(err.status);
      // Better Auth devuelve INVALID_PASSWORD / UNAUTHORIZED cuando la
      // currentPassword no matchea.
      if (status === 'BAD_REQUEST' || status === 'UNAUTHORIZED') {
        return fail(['La contraseña actual es incorrecta.']);
      }
    }
    return fail([ERROR_GENERICO]);
  }

  return { ok: true };
}
