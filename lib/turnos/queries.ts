import { z } from 'zod';
import { prisma } from '@/lib/db';
import type { Turno } from '@prisma/client';

const TURNO_OLVIDADO_HORAS = 12;

const MetodoPagoItemSchema = z.object({
  metodo: z.string(),
  monto: z.number(),
});
const MetodosPagoSchema = z.array(MetodoPagoItemSchema);

/** Devuelve el turno abierto del user, o null si no tiene. */
export async function getTurnoAbierto(userId: string): Promise<Turno | null> {
  return prisma.turno.findFirst({
    where: { userId, cierreEn: null },
  });
}

/**
 * Devuelve el turno si está abierto Y la apertura fue hace más de 12 horas.
 * Se considera "olvidado" y dispara redirect forzado a /turno/cerrar.
 */
export async function getTurnoOlvidado(userId: string): Promise<Turno | null> {
  const turno = await getTurnoAbierto(userId);
  if (!turno) return null;

  const horasAbierto =
    (Date.now() - turno.aperturaEn.getTime()) / (1000 * 60 * 60);
  return horasAbierto > TURNO_OLVIDADO_HORAS ? turno : null;
}

/**
 * Suma el monto en efectivo de todas las ventas del turno.
 * Usado en el cierre para calcular efectivoEsperadoCierre.
 *
 * Estructura de Venta.metodosPago (ver prisma/seed.ts):
 *   [{ metodo: 'efectivo' | 'transferencia' | 'débito' | 'crédito', monto: number }]
 * Si una venta no tiene un item con metodo === 'efectivo', suma 0.
 * Si el JSON no matchea la forma esperada (caso raro de data corrupta), suma 0
 * para esa venta — no rompe el cierre.
 */
export async function calcularEfectivoVendidoEnTurno(
  turnoId: string,
): Promise<number> {
  const ventas = await prisma.venta.findMany({
    where: { turnoId },
    select: { metodosPago: true },
  });

  return ventas.reduce((acc, venta) => {
    const parsed = MetodosPagoSchema.safeParse(venta.metodosPago);
    if (!parsed.success) return acc;
    const enEfectivo = parsed.data
      .filter((m) => m.metodo === 'efectivo')
      .reduce((s, m) => s + m.monto, 0);
    return acc + enEfectivo;
  }, 0);
}
