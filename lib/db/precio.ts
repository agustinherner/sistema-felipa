import { Prisma } from '@prisma/client';

type VariantePrecio = { precio: Prisma.Decimal | null };
type ProductoPrecio = { precioBase: Prisma.Decimal };
type VarianteCosto = { costo: Prisma.Decimal | null };
type ProductoCosto = { costoBase: Prisma.Decimal };

/**
 * Devuelve el precio efectivo: variante.precio si está definido, sino producto.precioBase.
 */
export function precioEfectivo(
  variante: VariantePrecio,
  producto: ProductoPrecio,
): Prisma.Decimal {
  return variante.precio ?? producto.precioBase;
}

/**
 * Devuelve el costo efectivo: variante.costo si está definido, sino producto.costoBase.
 */
export function costoEfectivo(
  variante: VarianteCosto,
  producto: ProductoCosto,
): Prisma.Decimal {
  return variante.costo ?? producto.costoBase;
}
