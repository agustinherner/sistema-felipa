/**
 * Generación y descarga de CSV en el cliente.
 *
 * Reglas de escapado del RFC 4180:
 *  - Si el campo contiene coma, comilla doble o salto de línea, va envuelto
 *    en comillas dobles.
 *  - Las comillas dobles internas se duplican (`"` → `""`).
 *  - Separador de filas: CRLF.
 *
 * Prependemos el BOM UTF-8 para que Excel en Windows abra acentos
 * correctamente (Felipa corre en Windows 10).
 */

export type CsvCell = string | number | null | undefined;

export function escaparCelda(v: CsvCell): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function filasACsv(filas: CsvCell[][]): string {
  return filas.map((f) => f.map(escaparCelda).join(',')).join('\r\n');
}

/**
 * Dispara la descarga del CSV en el navegador.
 * Construye un Blob + URL.createObjectURL + click en un <a download> y limpia.
 */
export function descargarCsv(filename: string, contenido: string): void {
  const BOM = '﻿';
  const blob = new Blob([BOM + contenido], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Liberamos el objectURL en el próximo tick para no abortar la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Sufijo `YYYY-MM-DD_YYYY-MM-DD` a partir del rango civil AR (strings). */
export function sufijoRango(desdeCivil: string, hastaCivil: string): string {
  return `${desdeCivil}_${hastaCivil}`;
}
