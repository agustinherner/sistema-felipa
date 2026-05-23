'use server';

import { revalidatePath } from 'next/cache';
import { Prisma, Rol } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import {
  CrearUsuarioSchema,
  EditarUsuarioSchema,
  ResetPasswordSchema,
  ToggleActivoSchema,
} from './schemas';

type ActionFail = { ok: false; errores: string[] };
type ActionOk = { ok: true };
type ActionResult<T = unknown> = (ActionOk & T) | ActionFail;

const ERROR_GENERICO =
  'Error inesperado al guardar. Reintentá o contactá al administrador.';
const SIN_ADMIN_ACTIVO =
  'No se puede dejar el sistema sin administradores activos.';

function fail(errores: string[]): ActionFail {
  return { ok: false, errores };
}

async function emailParaUsername(username: string): Promise<string> {
  // Email sintético; replica la convención del seed (felipa@felipa.local).
  return `${username}@felipa.local`;
}

async function hayOtroAdminActivoExceptoEste(userId: string): Promise<boolean> {
  const otros = await prisma.user.count({
    where: { rol: Rol.ADMIN, activo: true, id: { not: userId } },
  });
  return otros > 0;
}

export async function crearUsuario(
  rawInput: unknown,
): Promise<ActionResult<{ userId: string }>> {
  await requireAuth([Rol.ADMIN]);

  const parsed = CrearUsuarioSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }
  const input = parsed.data;

  const email = await emailParaUsername(input.username);

  const yaExiste = await prisma.user.findFirst({
    where: { OR: [{ username: input.username }, { email }] },
    select: { id: true },
  });
  if (yaExiste) {
    return fail([`El usuario "${input.username}" ya existe.`]);
  }

  const sucursal = await prisma.sucursal.findUnique({
    where: { id: input.sucursalId },
    select: { id: true, activa: true },
  });
  if (!sucursal || !sucursal.activa) {
    return fail(['La sucursal seleccionada no existe o está inactiva.']);
  }

  // Creamos User + Account directo via Prisma (NO via auth.api.signUpEmail)
  // porque signUpEmail crea una sesion para el usuario nuevo y nextCookies la
  // escribe en la response, pisando la sesion del admin que esta logueado.
  // hashPassword es la MISMA funcion que usa signUpEmail por debajo, asi que
  // el hash es byte-compatible con el flujo de login.
  let nuevoId: string;
  try {
    const hash = await hashPassword(input.password);
    const created = await prisma.user.create({
      data: {
        email,
        nombre: input.nombre,
        username: input.username,
        displayUsername: input.username,
        rol: input.rol,
        activo: true,
        sucursalId: input.sucursalId,
        emailVerified: true,
        accounts: {
          create: {
            // Convencion de Better Auth para credenciales locales:
            // accountId === userId, providerId === 'credential'.
            accountId: '',
            providerId: 'credential',
            password: hash,
          },
        },
      },
      select: { id: true },
    });
    nuevoId = created.id;

    await prisma.account.updateMany({
      where: { userId: nuevoId, providerId: 'credential' },
      data: { accountId: nuevoId },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return fail([`El usuario "${input.username}" ya existe.`]);
    }
    return fail([ERROR_GENERICO]);
  }

  revalidatePath('/usuarios');
  return { ok: true, userId: nuevoId };
}

export async function editarUsuario(
  rawInput: unknown,
): Promise<ActionResult> {
  const session = await requireAuth([Rol.ADMIN]);

  const parsed = EditarUsuarioSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }
  const { userId, nombre, rol, sucursalId } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, rol: true, activo: true },
  });
  if (!target) return fail(['El usuario no existe.']);

  const esYoMismo = session.id === userId;
  if (esYoMismo && rol !== target.rol) {
    return fail(['No podés cambiarte el rol a vos mismo.']);
  }

  // Si bajamos a alguien de ADMIN y estaba activo, validar que quede otro admin activo.
  const dejaDeSerAdmin = target.rol === Rol.ADMIN && rol !== Rol.ADMIN;
  if (dejaDeSerAdmin && target.activo) {
    const hayOtro = await hayOtroAdminActivoExceptoEste(userId);
    if (!hayOtro) return fail([SIN_ADMIN_ACTIVO]);
  }

  const sucursal = await prisma.sucursal.findUnique({
    where: { id: sucursalId },
    select: { activa: true },
  });
  if (!sucursal || !sucursal.activa) {
    return fail(['La sucursal seleccionada no existe o está inactiva.']);
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { nombre, rol, sucursalId },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return fail(['El usuario no existe.']);
    }
    return fail([ERROR_GENERICO]);
  }

  revalidatePath('/usuarios');
  return { ok: true };
}

export async function toggleUsuarioActivo(
  rawInput: unknown,
): Promise<ActionResult> {
  const session = await requireAuth([Rol.ADMIN]);

  const parsed = ToggleActivoSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }
  const { userId, activo } = parsed.data;

  if (session.id === userId && !activo) {
    return fail(['No podés desactivarte a vos mismo.']);
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { rol: true, activo: true },
  });
  if (!target) return fail(['El usuario no existe.']);

  // Si vamos a desactivar a un ADMIN activo, asegurar que quede otro admin activo.
  if (!activo && target.rol === Rol.ADMIN && target.activo) {
    const hayOtro = await hayOtroAdminActivoExceptoEste(userId);
    if (!hayOtro) return fail([SIN_ADMIN_ACTIVO]);
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { activo },
    });
  } catch {
    return fail([ERROR_GENERICO]);
  }

  // Si quedó desactivado, kickear sus sesiones abiertas.
  if (!activo) {
    await prisma.session
      .deleteMany({ where: { userId } })
      .catch(() => null);
  }

  revalidatePath('/usuarios');
  return { ok: true };
}

export async function resetUsuarioPassword(
  rawInput: unknown,
): Promise<ActionResult> {
  await requireAuth([Rol.ADMIN]);

  const parsed = ResetPasswordSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }
  const { userId, password } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!target) return fail(['El usuario no existe.']);

  // Better Auth no expone un endpoint admin-reset en su núcleo (sí en el plugin
  // admin, pero ese plugin agrega columnas role/banned que chocan con nuestro
  // dominio). hashPassword de better-auth/crypto es la MISMA función que usa
  // signUpEmail, así que escribir directo en account.password es byte-compatible
  // con el flujo de login.
  const hash = await hashPassword(password);

  const actualizadas = await prisma.account.updateMany({
    where: { userId, providerId: 'credential' },
    data: { password: hash, updatedAt: new Date() },
  });

  if (actualizadas.count === 0) {
    return fail(['El usuario no tiene credenciales para resetear.']);
  }

  // Revocar sesiones abiertas del usuario afectado: si se filtró la password,
  // queremos kickearlo de cualquier lado donde estuviera logueado.
  await prisma.session
    .deleteMany({ where: { userId } })
    .catch(() => null);

  revalidatePath('/usuarios');
  return { ok: true };
}
