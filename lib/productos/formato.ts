import { Prisma } from '@prisma/client';

const FORMATTER = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatearMoneda(
  valor: Prisma.Decimal | number | string,
): string {
  const num =
    typeof valor === 'number' ? valor : Number(valor.toString());
  return FORMATTER.format(num);
}
