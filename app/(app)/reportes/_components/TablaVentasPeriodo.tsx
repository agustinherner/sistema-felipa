import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Granularidad, VentasPeriodoFila } from '@/lib/reportes';
import { CardReporte } from './CardReporte';
import { sufijoRango } from './csv';
import { formatEntero, formatMoneda } from './formato';

const ETIQUETA_GRAN: Record<Granularidad, string> = {
  dia: 'Día',
  semana: 'Semana',
  mes: 'Mes',
};

type Props = {
  data: VentasPeriodoFila[];
  granularidad: Granularidad;
  desde: string;
  hasta: string;
};

export function TablaVentasPeriodo({
  data,
  granularidad,
  desde,
  hasta,
}: Props) {
  const totalCantidad = data.reduce((s, r) => s + r.cantidad, 0);
  const totalMonto = data.reduce((s, r) => s + Number(r.monto), 0);

  const filename = `reporte-ventas-${granularidad}-${sufijoRango(desde, hasta)}.csv`;
  const header = [ETIQUETA_GRAN[granularidad], 'Cantidad', 'Monto'];
  const rows = data.map((r) => [r.etiqueta, r.cantidad, r.monto]);

  return (
    <CardReporte
      titulo={`Ventas por ${ETIQUETA_GRAN[granularidad].toLowerCase()}`}
      descripcion="Cantidad y monto total de ventas no anuladas, agrupadas por período en hora argentina."
      csv={{ filename, header, rows }}
    >
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin ventas en el rango.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{ETIQUETA_GRAN[granularidad]}</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.clave}>
                  <TableCell className="font-medium">{r.etiqueta}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEntero(r.cantidad)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoneda(r.monto)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 bg-muted/40 font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEntero(totalCantidad)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoneda(totalMonto)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </CardReporte>
  );
}
