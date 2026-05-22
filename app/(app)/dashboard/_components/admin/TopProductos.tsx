import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProductoVendido } from '@/lib/reportes';
import { formatMoneda } from './formato';

export function TopProductos({
  data,
  nombreMes,
}: {
  data: ProductoVendido[];
  nombreMes: string;
}) {
  return (
    <Card>
      <CardHeader className="space-y-1 pb-3">
        <h3 className="text-base font-semibold">
          Top productos de {nombreMes}
        </h3>
        <p className="text-xs text-muted-foreground">
          Cantidades netas de devoluciones.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin ventas en el mes todavía.
          </p>
        ) : (
          <div className="rounded-md border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="w-[80px] text-right">Cant.</TableHead>
                  <TableHead className="w-[110px] text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((p, i) => (
                  <TableRow key={p.productoId}>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.cantidad}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoneda(p.monto)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
