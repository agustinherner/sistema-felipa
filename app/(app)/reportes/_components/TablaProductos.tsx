import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProductoVendido } from '@/lib/reportes';
import { CardReporte } from './CardReporte';
import { sufijoRango } from './csv';
import { formatEntero, formatMoneda } from './formato';

type Props = {
  data: ProductoVendido[];
  desde: string;
  hasta: string;
};

export function TablaProductos({ data, desde, hasta }: Props) {
  const filename = `reporte-productos-${sufijoRango(desde, hasta)}.csv`;
  const header = ['Posición', 'Producto', 'Cantidad', 'Monto'];
  const rows = data.map((p, i) => [i + 1, p.nombre, p.cantidad, p.monto]);

  return (
    <CardReporte
      titulo="Productos más vendidos"
      descripcion="Cantidades netas de devoluciones, ordenadas por cantidad descendente."
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
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p, i) => (
                <TableRow key={p.productoId}>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEntero(p.cantidad)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoneda(p.monto)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </CardReporte>
  );
}
