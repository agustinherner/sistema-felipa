/**
 * Formateadores compartidos por los componentes admin del dashboard.
 * Las funciones aceptan string (Decimal serializado) o number — los reportes
 * devuelven string, pero algunos campos derivados son números puros.
 */

export function formatMoneda(v: string | number): string {
  const n = typeof v === 'string' ? Number(v) : v;
  if (!Number.isFinite(n)) return '$0';
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

export function formatMonedaConSigno(v: string | number): string {
  const n = typeof v === 'string' ? Number(v) : v;
  if (!Number.isFinite(n) || n === 0) return formatMoneda(0);
  if (n > 0) return `+${formatMoneda(n)}`;
  return `−${formatMoneda(Math.abs(n))}`;
}

export const HORA_FMT = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/Argentina/Buenos_Aires',
});

export const FECHA_FMT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'America/Argentina/Buenos_Aires',
});

export const METODO_COLOR = {
  efectivo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  transferencia: 'border-sky-200 bg-sky-50 text-sky-700',
  debito: 'border-violet-200 bg-violet-50 text-violet-700',
  credito: 'border-amber-200 bg-amber-50 text-amber-800',
} as const;

export const METODO_LABEL = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  debito: 'Débito',
  credito: 'Crédito',
} as const;
