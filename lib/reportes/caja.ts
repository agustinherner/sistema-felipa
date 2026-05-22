import { prisma } from '@/lib/db';
import { type RangoFechas, serializarDecimal } from './types';
import {
  type DesgloseMetodo,
  ventasPorMetodoPago,
  ventasTotales,
} from './ventas';

const HORAS_TURNO_LARGO = 12;

export type CierreDelDia = {
  turnoId: string;
  vendedor: string;
  aperturaEn: string;
  cierreEn: string;
  totalVendido: string;
  /** Snapshot guardado al cerrar el turno. `null` si nunca se calculó (turnos viejos). */
  diferencia: string | null;
};

export type TurnoAbierto = {
  turnoId: string;
  vendedor: string;
  aperturaEn: string;
  horasAbierto: number;
  /** True si el turno lleva más de 12 h abierto. */
  largo: boolean;
};

export type CajaDelDia = {
  totalVendido: string;
  cantidadVentas: number;
  porMetodo: DesgloseMetodo[];
  cierresHoy: CierreDelDia[];
  turnosAbiertos: TurnoAbierto[];
};

/**
 * Métricas de la caja para el rango (típicamente "hoy" en hora AR).
 *
 * - Total + desglose por método: reusa `ventasTotales` y `ventasPorMetodoPago`.
 * - cierresHoy: turnos con `cierreEn` dentro del rango. Devolvemos el snapshot
 *   `diferencia` ya guardado al cerrar — no recalculamos.
 * - turnosAbiertos: turnos con `cierreEn` null (no se filtran por rango porque
 *   un turno abierto puede haberse abierto ayer y todavía estar vivo).
 */
export async function cajaDelDia({
  desde,
  hasta,
}: RangoFechas): Promise<CajaDelDia> {
  const ahora = new Date();

  const [totales, porMetodo, cierres, abiertos] = await Promise.all([
    ventasTotales({ desde, hasta }),
    ventasPorMetodoPago({ desde, hasta }),
    prisma.turno.findMany({
      where: { cierreEn: { gte: desde, lte: hasta } },
      orderBy: { cierreEn: 'desc' },
      select: {
        id: true,
        aperturaEn: true,
        cierreEn: true,
        diferencia: true,
        user: { select: { nombre: true } },
        ventas: {
          where: { anuladaEn: null },
          select: { total: true },
        },
      },
    }),
    prisma.turno.findMany({
      where: { cierreEn: null },
      orderBy: { aperturaEn: 'asc' },
      select: {
        id: true,
        aperturaEn: true,
        user: { select: { nombre: true } },
      },
    }),
  ]);

  const cierresHoy: CierreDelDia[] = cierres.map((t) => {
    const total = t.ventas.reduce((acc, v) => acc + Number(v.total), 0);
    return {
      turnoId: t.id,
      vendedor: t.user.nombre,
      aperturaEn: t.aperturaEn.toISOString(),
      cierreEn: (t.cierreEn as Date).toISOString(),
      totalVendido: serializarDecimal(total),
      diferencia:
        t.diferencia !== null ? serializarDecimal(t.diferencia) : null,
    };
  });

  const turnosAbiertos: TurnoAbierto[] = abiertos.map((t) => {
    const horas = (ahora.getTime() - t.aperturaEn.getTime()) / (1000 * 60 * 60);
    return {
      turnoId: t.id,
      vendedor: t.user.nombre,
      aperturaEn: t.aperturaEn.toISOString(),
      horasAbierto: horas,
      largo: horas > HORAS_TURNO_LARGO,
    };
  });

  return {
    totalVendido: totales.montoTotal,
    cantidadVentas: totales.cantidad,
    porMetodo,
    cierresHoy,
    turnosAbiertos,
  };
}
