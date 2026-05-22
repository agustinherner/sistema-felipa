import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { type RangoFechas, serializarDecimal } from './types';

const MS_POR_HORA = 1000 * 60 * 60;

export type VentasPorVendedorFila = {
  usuarioId: string;
  vendedor: string;
  cantidad: number;
  monto: string;
};

/**
 * Cantidad y monto de ventas no anuladas por vendedor en el rango.
 *
 * El "vendedor" de una venta se resuelve por `Venta.usuarioId` (el campo
 * directo del schema, set por `crearVenta` con el id del usuario logueado).
 * No usamos `Venta.turnoId → Turno.userId` porque en la operación normal son
 * el mismo usuario, y `usuarioId` es el dato canónico de la venta.
 */
export async function ventasPorVendedor({
  desde,
  hasta,
}: RangoFechas): Promise<VentasPorVendedorFila[]> {
  const ventas = await prisma.venta.findMany({
    where: {
      anuladaEn: null,
      creadaEn: { gte: desde, lte: hasta },
    },
    select: {
      total: true,
      usuarioId: true,
      usuario: { select: { nombre: true } },
    },
  });

  type Acc = { vendedor: string; cantidad: number; monto: Prisma.Decimal };
  const por: Map<string, Acc> = new Map();
  for (const v of ventas) {
    const cur = por.get(v.usuarioId);
    if (cur) {
      cur.cantidad += 1;
      cur.monto = cur.monto.add(v.total);
    } else {
      por.set(v.usuarioId, {
        vendedor: v.usuario.nombre,
        cantidad: 1,
        monto: new Prisma.Decimal(v.total),
      });
    }
  }

  const filas: VentasPorVendedorFila[] = [];
  por.forEach((acc, usuarioId) => {
    filas.push({
      usuarioId,
      vendedor: acc.vendedor,
      cantidad: acc.cantidad,
      monto: serializarDecimal(acc.monto),
    });
  });

  filas.sort((a, b) => Number(b.monto) - Number(a.monto));
  return filas;
}

export type HorasPorVendedorFila = {
  usuarioId: string;
  vendedor: string;
  /** Cantidad de turnos cerrados del usuario que cayeron en el rango. */
  cantidadTurnos: number;
  /** Suma de (cierreEn − aperturaEn) en horas, con un decimal. */
  horasTotales: string;
  /** Promedio horas por turno (horasTotales / cantidadTurnos) con un decimal. */
  promedioHoras: string;
};

/**
 * Horas trabajadas por vendedor en el rango. SOLO turnos cerrados
 * (`cierreEn` no null) y que cierran dentro del rango — alineado con el
 * criterio que ya usa `cajaDelDia` para "cierres del día".
 *
 * `aperturaEn`/`cierreEn` son timestamps UTC. La duración (resta) es
 * timezone-independent, así que no hace falta convertir a hora civil AR.
 */
export async function horasPorVendedor({
  desde,
  hasta,
}: RangoFechas): Promise<HorasPorVendedorFila[]> {
  const turnos = await prisma.turno.findMany({
    where: {
      cierreEn: { not: null, gte: desde, lte: hasta },
    },
    select: {
      userId: true,
      aperturaEn: true,
      cierreEn: true,
      user: { select: { nombre: true } },
    },
  });

  type Acc = { vendedor: string; cantidadTurnos: number; horas: number };
  const por: Map<string, Acc> = new Map();
  for (const t of turnos) {
    const cierre = t.cierreEn as Date; // filtrado a no-null arriba
    const horas = (cierre.getTime() - t.aperturaEn.getTime()) / MS_POR_HORA;
    if (horas < 0) continue; // defensivo: cierre antes que apertura nunca debería pasar
    const cur = por.get(t.userId);
    if (cur) {
      cur.cantidadTurnos += 1;
      cur.horas += horas;
    } else {
      por.set(t.userId, {
        vendedor: t.user.nombre,
        cantidadTurnos: 1,
        horas,
      });
    }
  }

  const filas: HorasPorVendedorFila[] = [];
  por.forEach((acc, usuarioId) => {
    const promedio =
      acc.cantidadTurnos > 0 ? acc.horas / acc.cantidadTurnos : 0;
    filas.push({
      usuarioId,
      vendedor: acc.vendedor,
      cantidadTurnos: acc.cantidadTurnos,
      horasTotales: acc.horas.toFixed(1),
      promedioHoras: promedio.toFixed(1),
    });
  });

  filas.sort((a, b) => Number(b.horasTotales) - Number(a.horasTotales));
  return filas;
}
