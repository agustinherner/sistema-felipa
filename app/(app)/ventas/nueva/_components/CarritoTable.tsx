'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ItemCarrito } from './VentaNuevaForm';

type Props = {
  items: ItemCarrito[];
  subtotal: number;
  onCambiarCantidad: (varianteId: string, nuevaCantidad: number) => void;
  onEliminar: (varianteId: string) => void;
};

function formatoPrecio(n: number): string {
  return `$${n.toLocaleString('es-AR')}`;
}

export function CarritoTable({
  items,
  subtotal,
  onCambiarCantidad,
  onEliminar,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Escaneá o buscá un producto para agregar.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead className="text-right">Precio unit.</TableHead>
            <TableHead className="w-32">Cantidad</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
            <TableHead className="text-right">Stock tras venta</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it) => {
            const subtotalLinea = it.precioUnitario * it.cantidad;
            const stockResultante = it.stockActual - it.cantidad;
            const stockNegativo = stockResultante < 0;
            return (
              <TableRow key={it.varianteId}>
                <TableCell className="font-medium">
                  {it.nombreCompleto}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatoPrecio(it.precioUnitario)}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={it.cantidad}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '') {
                        onCambiarCantidad(it.varianteId, 0);
                        return;
                      }
                      const n = parseInt(v, 10);
                      onCambiarCantidad(it.varianteId, n);
                    }}
                    className="h-9 w-20"
                    aria-label={`Cantidad de ${it.nombreCompleto}`}
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatoPrecio(subtotalLinea)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <span
                    className={
                      stockNegativo
                        ? 'inline-flex items-center gap-1 font-medium text-red-600'
                        : ''
                    }
                  >
                    {stockNegativo && <AlertTriangle className="h-4 w-4" />}
                    {stockResultante}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Eliminar ${it.nombreCompleto}`}
                    onClick={() => onEliminar(it.varianteId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="text-right text-muted-foreground">
              Subtotal
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatoPrecio(subtotal)}
            </TableCell>
            <TableCell colSpan={2} />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
