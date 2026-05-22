/**
 * Helpers de formato compartidos por las tablas de /reportes.
 *
 * Los Decimals vienen como string desde lib/reportes (para no perder
 * precisión). Acá los renderizamos para humanos (ARS redondeado a peso),
 * pero el CSV exporta el valor crudo (sin formatear), así Excel/Google Sheets
 * pueden hacer aritmética sin parsear.
 */

export function formatMoneda(v: string | number): string {
  const n = typeof v === 'string' ? Number(v) : v;
  if (!Number.isFinite(n)) return '$0';
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

export function formatEntero(n: number): string {
  return n.toLocaleString('es-AR');
}
