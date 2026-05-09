'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth/session';
import { getTurnoAbierto, calcularEfectivoVendidoEnTurno } from './queries';

type ActionFail = { ok: false; errores: string[] };
type ActionResult<T = unknown> = ({ ok: true } & T) | ActionFail;

function fail(errores: string[]): ActionFail {
  return { ok: false, errores };
}

const AbrirTurnoSchema = z.object({
  efectivoInicial: z
    .number()
    .min(0, 'El efectivo inicial no puede ser negativo'),
});

const CerrarTurnoSchema = z.object({
  efectivoContado: z
    .number()
    .min(0, 'El efectivo contado no puede ser negativo'),
  observaciones: z.string().trim().max(500).optional(),
  // Override opcional para casos de turno olvidado.
  // Si viene, tiene que ser >= aperturaEn y <= now().
  cierreEnOverride: z.date().optional(),
});

export async function abrirTurno(
  rawInput: unknown,
): Promise<ActionResult<{ turnoId: string }>> {
  const user = await requireAuth();

  const parsed = AbrirTurnoSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }

  // Defensa en profundidad — el partial unique index ya cubre esto a nivel DB.
  const yaAbierto = await getTurnoAbierto(user.id);
  if (yaAbierto) {
    return fail([
      'Ya tenés un turno abierto. Cerralo antes de abrir uno nuevo.',
    ]);
  }

  try {
    const turno = await prisma.turno.create({
      data: {
        userId: user.id,
        efectivoInicialDeclarado: new Prisma.Decimal(parsed.data.efectivoInicial),
      },
    });

    revalidatePath('/');
    return { ok: true, turnoId: turno.id };
  } catch (error) {
    // Race con el unique index (otra request creó un turno entre la verificación y el create).
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return fail([
        'Ya tenés un turno abierto. Cerralo antes de abrir uno nuevo.',
      ]);
    }
    throw error;
  }
}

export async function cerrarTurno(
  rawInput: unknown,
): Promise<ActionResult<{ turnoId: string }>> {
  const user = await requireAuth();

  const parsed = CerrarTurnoSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }

  const turno = await getTurnoAbierto(user.id);
  if (!turno) {
    return fail(['No tenés un turno abierto para cerrar.']);
  }

  const ahora = new Date();
  const cierreEn = parsed.data.cierreEnOverride ?? ahora;
  if (cierreEn < turno.aperturaEn) {
    return fail(['La fecha de cierre no puede ser anterior a la apertura.']);
  }
  if (cierreEn > ahora) {
    return fail(['La fecha de cierre no puede ser futura.']);
  }

  const efectivoVendido = await calcularEfectivoVendidoEnTurno(turno.id);
  const efectivoEsperado =
    Number(turno.efectivoInicialDeclarado) + efectivoVendido;
  const diferencia = parsed.data.efectivoContado - efectivoEsperado;

  await prisma.turno.update({
    where: { id: turno.id },
    data: {
      cierreEn,
      efectivoContadoCierre: new Prisma.Decimal(parsed.data.efectivoContado),
      efectivoEsperadoCierre: new Prisma.Decimal(efectivoEsperado),
      diferencia: new Prisma.Decimal(diferencia),
      observacionesCierre: parsed.data.observaciones || null,
    },
  });

  revalidatePath('/');
  return { ok: true, turnoId: turno.id };
}
