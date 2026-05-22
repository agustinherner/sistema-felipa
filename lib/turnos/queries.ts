import { z } from 'zod';
import { prisma } from '@/lib/db';
import type { Turno } from '@prisma/client';

const TURNO_OLVIDADO_HORAS = 12;

const MetodoPagoItemSchema = z.object({
  metodo: z.string(),
  monto: z.number(),
});
const MetodosPagoSchema = z.array(MetodoPagoItemSchema);

type MetodoCanonico = 'efectivo' | 'transferencia' | 'debito' | 'credito';

function metodoCanonico(raw: string): MetodoCanonico | null {
  const s = raw.toLowerCase();
  if (s === 'efectivo') return 'efectivo';
  if (s === 'transferencia') return 'transferencia';
  if (s === 'debito' || s === 'débito') return 'debito';
  if (s === 'credito' || s === 'crédito') return 'credito';
  return null;
}

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
 * Estructura de Venta.metodosPago:
 *   - Sprint 6.0 (seed): [{ metodo: 'efectivo' | 'transferencia' | ..., monto }]
 *   - Sprint 6.1 (nueva venta): [{ metodo: 'EFECTIVO' | 'TRANSFERENCIA' | ..., monto }]
 * Comparamos case-insensitive para soportar ambas formas hasta que se migren
 * los datos viejos. Si el JSON no matchea la forma esperada, suma 0 — no rompe
 * el cierre.
 */
export async function calcularEfectivoVendidoEnTurno(
  turnoId: string,
): Promise<number> {
  const ventas = await prisma.venta.findMany({
    where: { turnoId, anuladaEn: null },
    select: { metodosPago: true },
  });

  return ventas.reduce((acc, venta) => {
    const parsed = MetodosPagoSchema.safeParse(venta.metodosPago);
    if (!parsed.success) return acc;
    const enEfectivo = parsed.data
      .filter((m) => m.metodo.toLowerCase() === 'efectivo')
      .reduce((s, m) => s + m.monto, 0);
    return acc + enEfectivo;
  }, 0);
}

/**
 * Suma el monto total de los retiros de caja del turno.
 * Usado en el cierre para descontar del efectivo esperado.
 */
export async function calcularRetirosEnTurno(
  turnoId: string,
): Promise<number> {
  const agg = await prisma.movimientoCaja.aggregate({
    where: { turnoId, tipo: 'RETIRO' },
    _sum: { monto: true },
  });
  return Number(agg._sum.monto ?? 0);
}

export type RetiroTurno = {
  id: string;
  monto: number;
  motivo: string;
  creadoEn: string;
  usuarioNombre: string;
};

/** Lista los retiros de caja del turno, ordenados por creadoEn ascendente. */
export async function obtenerRetirosTurno(
  turnoId: string,
): Promise<RetiroTurno[]> {
  const movs = await prisma.movimientoCaja.findMany({
    where: { turnoId, tipo: 'RETIRO' },
    orderBy: { creadoEn: 'asc' },
    select: {
      id: true,
      monto: true,
      motivo: true,
      creadoEn: true,
      usuario: { select: { nombre: true } },
    },
  });
  return movs.map((m) => ({
    id: m.id,
    monto: Number(m.monto),
    motivo: m.motivo,
    creadoEn: m.creadoEn.toISOString(),
    usuarioNombre: m.usuario.nombre,
  }));
}

export type ResumenTurnoAbierto = {
  id: string;
  aperturaEn: string;
  efectivoInicialDeclarado: number;
  cantidadVentas: number;
  totalVendido: number;
  ventasPorMetodo: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
  };
  totalRetiros: number;
  efectivoEsperado: number;
};

/**
 * Devuelve el resumen del turno abierto del usuario, o null si no hay.
 * Calcula totales agregando las ventas asociadas al turno.
 */
export async function obtenerResumenTurnoAbierto(
  userId: string,
): Promise<ResumenTurnoAbierto | null> {
  const turno = await prisma.turno.findFirst({
    where: { userId, cierreEn: null },
    select: {
      id: true,
      aperturaEn: true,
      efectivoInicialDeclarado: true,
    },
  });
  if (!turno) return null;

  const ventas = await prisma.venta.findMany({
    where: { turnoId: turno.id, anuladaEn: null },
    select: { total: true, metodosPago: true },
  });

  const ventasPorMetodo = {
    efectivo: 0,
    transferencia: 0,
    debito: 0,
    credito: 0,
  };
  let totalVendido = 0;

  for (const venta of ventas) {
    totalVendido += Number(venta.total);
    const parsed = MetodosPagoSchema.safeParse(venta.metodosPago);
    if (!parsed.success) continue;
    for (const m of parsed.data) {
      const canonico = metodoCanonico(m.metodo);
      if (canonico) ventasPorMetodo[canonico] += m.monto;
    }
  }

  const efectivoInicial = Number(turno.efectivoInicialDeclarado);
  const totalRetiros = await calcularRetirosEnTurno(turno.id);

  return {
    id: turno.id,
    aperturaEn: turno.aperturaEn.toISOString(),
    efectivoInicialDeclarado: efectivoInicial,
    cantidadVentas: ventas.length,
    totalVendido,
    ventasPorMetodo,
    totalRetiros,
    efectivoEsperado:
      efectivoInicial + ventasPorMetodo.efectivo - totalRetiros,
  };
}

export type TurnoMesItem = {
  id: string;
  aperturaEn: string;
  cierreEn: string;
  efectivoInicialDeclarado: number;
  efectivoEsperadoCierre: number | null;
  efectivoContadoCierre: number | null;
  diferencia: number | null;
  cantidadVentas: number;
  totalVendido: number;
};

/**
 * Lista turnos cerrados del usuario en el mes indicado.
 * `mes` es 1-indexado (1 = enero, 12 = diciembre).
 */
export async function listarTurnosDelMes(
  userId: string,
  anio: number,
  mes: number,
): Promise<TurnoMesItem[]> {
  const inicio = new Date(anio, mes - 1, 1, 0, 0, 0, 0);
  const fin = new Date(anio, mes, 1, 0, 0, 0, 0);

  const turnos = await prisma.turno.findMany({
    where: {
      userId,
      cierreEn: { not: null },
      aperturaEn: { gte: inicio, lt: fin },
    },
    orderBy: { aperturaEn: 'desc' },
    select: {
      id: true,
      aperturaEn: true,
      cierreEn: true,
      efectivoInicialDeclarado: true,
      efectivoEsperadoCierre: true,
      efectivoContadoCierre: true,
      diferencia: true,
      ventas: {
        where: { anuladaEn: null },
        select: { total: true },
      },
    },
  });

  return turnos.map((t) => {
    const totalVendido = t.ventas.reduce((s, v) => s + Number(v.total), 0);
    return {
      id: t.id,
      aperturaEn: t.aperturaEn.toISOString(),
      cierreEn: (t.cierreEn as Date).toISOString(),
      efectivoInicialDeclarado: Number(t.efectivoInicialDeclarado),
      efectivoEsperadoCierre:
        t.efectivoEsperadoCierre !== null
          ? Number(t.efectivoEsperadoCierre)
          : null,
      efectivoContadoCierre:
        t.efectivoContadoCierre !== null
          ? Number(t.efectivoContadoCierre)
          : null,
      diferencia: t.diferencia !== null ? Number(t.diferencia) : null,
      cantidadVentas: t.ventas.length,
      totalVendido,
    };
  });
}
