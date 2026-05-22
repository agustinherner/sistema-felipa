import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DesgloseMetodo } from '@/lib/reportes';
import { CardReporte } from './CardReporte';
import { sufijoRango } from './csv';
import { formatEntero, formatMoneda } from './formato';

const METODO_LABEL: Record<DesgloseMetodo['metodo'], string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  debito: 'Débito',
  credito: 'Crédito',
};

type Props = {
  data: DesgloseMetodo[];
  desde: string;
  hasta: string;
};

export function TablaMetodos({ data, desde, hasta }: Props) {
  const totalCantidad = data.reduce((s, r) => s + r.cantidad, 0);
  const totalMonto = data.reduce((s, r) => s + Number(r.monto), 0);

  const filename = `reporte-metodos-pago-${sufijoRango(desde, hasta)}.csv`;
  const header = ['Método', 'Cantidad', 'Monto'];
  const rows = data.map((m) => [METODO_LABEL[m.metodo], m.cantidad, m.monto]);

  return (
    <CardReporte
      titulo="Ventas por método de pago"
      descripcion="Cuántas ventas usaron cada método y la porción cobrada con cada uno."
      csv={{ filename, header, rows }}
    >
      <div className="overflow-x-auto rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Método</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((m) => {
              const monto = Number(m.monto);
              const pct =
                totalMonto > 0 ? Math.round((monto / totalMonto) * 100) : 0;
              return (
                <TableRow key={m.metodo}>
                  <TableCell className="font-medium">
                    {METODO_LABEL[m.metodo]}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEntero(m.cantidad)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoneda(m.monto)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {pct}%
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="border-t-2 bg-muted/40 font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatEntero(totalCantidad)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoneda(totalMonto)}
              </TableCell>
              <TableCell className="text-right" />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </CardReporte>
  );
}
