import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { VentasPorVendedorFila } from '@/lib/reportes';
import { CardReporte } from './CardReporte';
import { sufijoRango } from './csv';
import { formatEntero, formatMoneda } from './formato';

type Props = {
  data: VentasPorVendedorFila[];
  desde: string;
  hasta: string;
};

export function TablaVendedores({ data, desde, hasta }: Props) {
  const totalCantidad = data.reduce((s, r) => s + r.cantidad, 0);
  const totalMonto = data.reduce((s, r) => s + Number(r.monto), 0);

  const filename = `reporte-vendedores-${sufijoRango(desde, hasta)}.csv`;
  const header = ['Vendedor', 'Cantidad', 'Monto'];
  const rows = data.map((v) => [v.vendedor, v.cantidad, v.monto]);

  return (
    <CardReporte
      titulo="Ventas por vendedor"
      descripcion="Resuelto por el usuario que registró cada venta (Venta.usuarioId)."
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
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((v) => (
                <TableRow key={v.usuarioId}>
                  <TableCell className="font-medium">{v.vendedor}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEntero(v.cantidad)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoneda(v.monto)}
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
