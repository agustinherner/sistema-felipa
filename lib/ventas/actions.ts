'use server';

import { z } from 'zod';
import { Prisma } from '@prisma/client';
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

const DIAS_LIMITE_DEVOLUCION = 30;

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

const ItemDevolucionInput = z.object({
  itemVentaId: z.string().min(1, 'itemVentaId requerido'),
  cantidad: z.number().int('La cantidad debe ser entera').min(1, 'La cantidad debe ser >= 1'),
});

const CrearDevolucionSchema = z
  .object({
    ventaId: z.string().min(1, 'ventaId requerido'),
    motivo: z
      .string()
      .trim()
      .min(3, 'El motivo debe tener al menos 3 caracteres')
      .max(500, 'El motivo es demasiado largo'),
    items: z.array(ItemDevolucionInput).min(1, 'Tenés que devolver al menos un ítem'),
  })
  .refine(
    (data) =>
      new Set(data.items.map((i) => i.itemVentaId)).size === data.items.length,
    { message: 'Hay items repetidos en la devolución', path: ['items'] },
  );

export async function crearDevolucion(
  rawInput: unknown,
): Promise<ActionResult<{ devolucionId: string; montoTotal: number }>> {
  const user = await requireAuth(['ADMIN', 'VENDEDOR']);

  const parsed = CrearDevolucionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }
  const { ventaId, motivo, items: itemsInput } = parsed.data;

  const venta = await prisma.venta.findUnique({
    where: { id: ventaId },
    select: {
      id: true,
      sucursalId: true,
      creadaEn: true,
      anuladaEn: true,
      items: {
        select: {
          id: true,
          varianteId: true,
          cantidad: true,
          precioUnitario: true,
        },
      },
      devoluciones: {
        select: {
          items: {
            select: { itemVentaId: true, cantidad: true },
          },
        },
      },
    },
  });

  if (!venta) return fail(['Venta no encontrada.']);
  if (venta.anuladaEn) {
    return fail(['No se puede devolver una venta anulada.']);
  }

  const diasDesdeVenta =
    (Date.now() - venta.creadaEn.getTime()) / (1000 * 60 * 60 * 24);
  if (diasDesdeVenta > DIAS_LIMITE_DEVOLUCION) {
    return fail([
      `No se puede devolver una venta de más de ${DIAS_LIMITE_DEVOLUCION} días.`,
    ]);
  }

  const yaDevuelto = new Map<string, number>();
  for (const dev of venta.devoluciones) {
    for (const it of dev.items) {
      yaDevuelto.set(
        it.itemVentaId,
        (yaDevuelto.get(it.itemVentaId) ?? 0) + it.cantidad,
      );
    }
  }

  const itemsVenta = new Map(venta.items.map((it) => [it.id, it]));

  type Plan = {
    itemVentaId: string;
    varianteId: string;
    cantidad: number;
    precioUnitario: Prisma.Decimal;
    subtotal: Prisma.Decimal;
  };
  const plan: Plan[] = [];
  let montoTotal = new Prisma.Decimal(0);

  for (const itemIn of itemsInput) {
    const original = itemsVenta.get(itemIn.itemVentaId);
    if (!original) {
      return fail([`Item ${itemIn.itemVentaId} no pertenece a esta venta.`]);
    }
    const yaDev = yaDevuelto.get(itemIn.itemVentaId) ?? 0;
    const disponible = original.cantidad - yaDev;
    if (itemIn.cantidad > disponible) {
      return fail([
        `No podés devolver ${itemIn.cantidad} unidades; quedan ${disponible} disponibles.`,
      ]);
    }
    const subtotal = original.precioUnitario.mul(itemIn.cantidad);
    montoTotal = montoTotal.add(subtotal);
    plan.push({
      itemVentaId: original.id,
      varianteId: original.varianteId,
      cantidad: itemIn.cantidad,
      precioUnitario: original.precioUnitario,
      subtotal,
    });
  }

  const devolucion = await prisma.$transaction(async (tx) => {
    const dev = await tx.devolucion.create({
      data: {
        ventaId: venta.id,
        usuarioId: user.id,
        motivo,
        montoTotal,
        items: {
          create: plan.map((p) => ({
            itemVentaId: p.itemVentaId,
            varianteId: p.varianteId,
            cantidad: p.cantidad,
            precioUnitario: p.precioUnitario,
            subtotal: p.subtotal,
          })),
        },
      },
      select: { id: true },
    });

    for (const p of plan) {
      await tx.movimientoStock.create({
        data: {
          varianteId: p.varianteId,
          sucursalId: venta.sucursalId,
          tipo: 'DEVOLUCION',
          cantidad: p.cantidad,
          motivo,
          usuarioId: user.id,
          ventaId: venta.id,
        },
      });
      await tx.stock.upsert({
        where: {
          varianteId_sucursalId: {
            varianteId: p.varianteId,
            sucursalId: venta.sucursalId,
          },
        },
        update: { cantidad: { increment: p.cantidad } },
        create: {
          varianteId: p.varianteId,
          sucursalId: venta.sucursalId,
          cantidad: p.cantidad,
        },
      });
    }

    return dev;
  });

  revalidatePath('/ventas');
  revalidatePath('/stock');
  return {
    ok: true,
    devolucionId: devolucion.id,
    montoTotal: Number(montoTotal),
  };
}
