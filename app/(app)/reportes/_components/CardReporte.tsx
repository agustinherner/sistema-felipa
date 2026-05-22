import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { type CsvCell } from './csv';
import { BotonExportCsv } from './BotonExportCsv';

type Props = {
  titulo: string;
  descripcion?: string;
  csv: {
    filename: string;
    header: string[];
    rows: CsvCell[][];
  };
  children: React.ReactNode;
};

/**
 * Wrapper estándar de un reporte: card con header (título + descripción +
 * botón Exportar CSV) y body con la tabla.
 *
 * El botón Exportar recibe los datos del CSV ya preparados — cada tabla los
 * genera a su forma porque la columna `monto` se exporta como número crudo,
 * no como string formateado.
 */
export function CardReporte({ titulo, descripcion, csv, children }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{titulo}</h3>
          {descripcion && (
            <p className="text-xs text-muted-foreground">{descripcion}</p>
          )}
        </div>
        <BotonExportCsv
          filename={csv.filename}
          header={csv.header}
          rows={csv.rows}
        />
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
