'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type CsvCell, descargarCsv, filasACsv } from './csv';

type Props = {
  /** Nombre completo del archivo, incluida extensión `.csv`. */
  filename: string;
  /** Header de columnas (primera fila del CSV). */
  header: string[];
  /** Filas de datos. Cada celda string|number|null|undefined. */
  rows: CsvCell[][];
  /** Texto opcional del botón, default "Exportar CSV". */
  label?: string;
  /** Si true, deshabilita el botón (típicamente cuando no hay filas). */
  disabled?: boolean;
};

/**
 * Botón "Exportar CSV" client-side. Construye el CSV en JS (sin endpoint
 * server), aplica escapado RFC-4180 y dispara la descarga vía Blob.
 */
export function BotonExportCsv({
  filename,
  header,
  rows,
  label = 'Exportar CSV',
  disabled,
}: Props) {
  const onClick = () => {
    const contenido = filasACsv([header, ...rows]);
    descargarCsv(filename, contenido);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled || rows.length === 0}
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}
