import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { precioEfectivo } from '@/lib/db/precio';
import { generarCodigoCortoVenta } from './idCorto';
import { fail, type ActionResult, type CrearVentaContexto } from './types';

const MetodoPagoEnum = z.enum(['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO']);
type MetodoPago = z.infer<typeof MetodoPagoEnum>;

const ItemSchema = z.object({
  varianteId: z.string().min(1),
  cantidad: z.number().int('La cantidad debe ser entera').min(1, 'La cantidad debe ser >= 1'),
});

const MetodoPagoSchema = z.object({
  metodo: MetodoPagoEnum,
  monto: z.number().positive('El monto debe ser mayor a 0'),
});

export const CrearVentaSchema = z
  .object({
    items: z.array(ItemSchema).min(1, 'La venta tiene que tener al menos un ítem'),
    metodosPago: z.array(MetodoPagoSchema).min(1, 'Tiene que haber al menos un método de pago'),
  })
  .refine(
    (data) =>
      new Set(data.metodosPago.map((m) => m.metodo)).size === data.metodosPago.length,
    { message: 'No se puede repetir un método de pago', path: ['metodosPago'] },
  )
  .refine(
    (data) => new Set(data.items.map((i) => i.varianteId)).size === data.items.length,
    { message: 'Hay variantes repetidas en los ítems (agrupar antes de enviar)', path: ['items'] },
  );

const TOLERANCIA_FLOAT = 0.01;
const PORCENTAJE_DESCUENTO = new Prisma.Decimal('0.10');
const MAX_RETRIES_CODIGO = 3;

function aplicaDescuentoMetodos(metodos: { metodo: MetodoPago }[]): boolean {
  return metodos.every(
    (m) => m.metodo === 'EFECTIVO' || m.metodo === 'TRANSFERENCIA',
  );
}

function redondearADosDecimales(d: Prisma.Decimal): Prisma.Decimal {
  return d.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

/**
 * Core de la creación de venta. Asume que ya se resolvió auth + turno abierto
 * y se pasa el contexto explícito. La server action `crearVenta` resuelve la
 * sesión y delega acá.
 *
 * Vive fuera de 'use server' para poder ser ejercitado desde scripts (smoke).
 */
export async function crearVentaCore(
  rawInput: unknown,
  ctx: CrearVentaContexto,
): Promise<ActionResult<{ ventaId: string; idCorto: string }>> {
  const parsed = CrearVentaSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }
  const { items, metodosPago } = parsed.data;

  const variantes = await prisma.variante.findMany({
    where: { id: { in: items.map((i) => i.varianteId) } },
    select: {
      id: true,
      activa: true,
      precio: true,
      producto: { select: { id: true, activo: true, precioBase: true } },
    },
  });

  const varianteById = new Map(variantes.map((v) => [v.id, v]));
  const inactivasOInexistentes: string[] = [];
  for (const item of items) {
    const v = varianteById.get(item.varianteId);
    if (!v) {
      inactivasOInexistentes.push(`Variante ${item.varianteId} no existe`);
      continue;
    }
    if (!v.activa || !v.producto.activo) {
      inactivasOInexistentes.push(`Variante ${item.varianteId} está inactiva`);
    }
  }
  if (inactivasOInexistentes.length > 0) {
    return fail(inactivasOInexistentes);
  }

  let subtotal = new Prisma.Decimal(0);
  const itemsConPrecio = items.map((item) => {
    const v = varianteById.get(item.varianteId)!;
    const precio = precioEfectivo(v, v.producto);
    const lineaSubtotal = precio.mul(item.cantidad);
    subtotal = subtotal.add(lineaSubtotal);
    return {
      varianteId: item.varianteId,
      cantidad: item.cantidad,
      precioUnitario: precio,
      subtotal: lineaSubtotal,
    };
  });
  subtotal = redondearADosDecimales(subtotal);

  const aplicaDescuento = aplicaDescuentoMetodos(metodosPago);
  const descuento = aplicaDescuento
    ? redondearADosDecimales(subtotal.mul(PORCENTAJE_DESCUENTO))
    : new Prisma.Decimal(0);
  const total = subtotal.sub(descuento);

  const sumaMetodos = metodosPago.reduce((acc, m) => acc + m.monto, 0);
  if (Math.abs(sumaMetodos - total.toNumber()) >= TOLERANCIA_FLOAT) {
    return fail([
      `El total cobrado no coincide con el total de la venta (cobrado: ${sumaMetodos.toFixed(2)}, total: ${total.toFixed(2)})`,
    ]);
  }

  // metodosPago se guarda como JSON con la forma { metodo, monto } en uppercase
  // (alineado con el contrato de Sprint 6.1 y los enums del schema).
  // calcularEfectivoVendidoEnTurno (lib/turnos/queries.ts) acepta ambas formas
  // por compat con ventas seedeadas en lowercase.
  const { sucursalId, userId, turnoId } = ctx;

  for (let intento = 1; intento <= MAX_RETRIES_CODIGO; intento += 1) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const codigoCorto = await generarCodigoCortoVenta(
          sucursalId,
          new Date(),
          tx,
        );

        const venta = await tx.venta.create({
          data: {
            codigoCorto,
            sucursalId,
            usuarioId: userId,
            turnoId,
            subtotal,
            descuentoTotal: descuento,
            total,
            aplicaDescuento,
            metodosPago: metodosPago.map((m) => ({
              metodo: m.metodo,
              monto: m.monto,
            })),
            items: {
              create: itemsConPrecio.map((it) => ({
                varianteId: it.varianteId,
                cantidad: it.cantidad,
                precioUnitario: it.precioUnitario,
                subtotal: it.subtotal,
              })),
            },
          },
          select: { id: true, codigoCorto: true },
        });

        await Promise.all(
          itemsConPrecio.flatMap((it) => [
            tx.movimientoStock.create({
              data: {
                varianteId: it.varianteId,
                sucursalId,
                tipo: 'VENTA',
                cantidad: -it.cantidad,
                motivo: null,
                usuarioId: userId,
                ventaId: venta.id,
              },
            }),
            tx.stock.upsert({
              where: {
                varianteId_sucursalId: {
                  varianteId: it.varianteId,
                  sucursalId,
                },
              },
              update: { cantidad: { decrement: it.cantidad } },
              create: {
                varianteId: it.varianteId,
                sucursalId,
                cantidad: -it.cantidad,
              },
            }),
          ]),
        );

        return venta;
      });

      return { ok: true, ventaId: result.id, idCorto: result.codigoCorto };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        Array.isArray(error.meta?.target) &&
        (error.meta?.target as string[]).includes('codigoCorto') &&
        intento < MAX_RETRIES_CODIGO
      ) {
        continue;
      }
      throw error;
    }
  }

  return fail(['No se pudo generar un código corto único después de varios intentos.']);
}
