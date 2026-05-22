import { Prisma } from '@prisma/client';

/**
 * Rango de fechas en UTC. Se construye con los helpers de `lib/fecha.ts`
 * (`rangoDiaAR`, `rangoMesAR`, `rangoEntreFechasAR`) para asegurar que los
 * cortes caigan en hora argentina aunque el server corra en UTC.
 */
export type RangoFechas = {
  desde: Date;
  hasta: Date;
};

/**
 * Los cuatro métodos canónicos. En la DB conviven seeds en lowercase y
 * ventas nuevas en uppercase (ver `lib/turnos/queries.ts`), por eso siempre
 * normalizamos a estos slugs antes de agregar.
 */
export type MetodoPago = 'efectivo' | 'transferencia' | 'debito' | 'credito';
export const METODOS_PAGO: MetodoPago[] = [
  'efectivo',
  'transferencia',
  'debito',
  'credito',
];

export function metodoCanonico(raw: string): MetodoPago | null {
  const s = raw.toLowerCase();
  if (s === 'efectivo') return 'efectivo';
  if (s === 'transferencia') return 'transferencia';
  if (s === 'debito' || s === 'débito') return 'debito';
  if (s === 'credito' || s === 'crédito') return 'credito';
  return null;
}

/**
 * Convierte un Decimal/number/string a string para cruzar de Server Component
 * a Client. Mantenemos string en el borde para no perder precisión en sumas
 * grandes (caja navideña hasta ~$1.5M) y para no toparnos con el problema
 * conocido de Decimal cruzando como objeto plano vacío.
 */
export function serializarDecimal(
  d: Prisma.Decimal | number | string | null | undefined,
): string {
  if (d === null || d === undefined) return '0';
  if (typeof d === 'string') return d;
  if (typeof d === 'number') return d.toString();
  return d.toString();
}
