'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ItemCarrito, MetodoPagoEntry } from './VentaNuevaForm';

type Props = {
  abierto: boolean;
  items: ItemCarrito[];
  metodosPago: MetodoPagoEntry[];
  subtotal: number;
  descuento: number;
  total: number;
  cobrando: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
};

const LABEL_METODO: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
};

function formatoPrecio(n: number): string {
  return `$${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

export function ModalCobro({
  abierto,
  items,
  metodosPago,
  subtotal,
  descuento,
  total,
  cobrando,
  onConfirmar,
  onCancelar,
}: Props) {
  const aplicaDescuento = descuento > 0;
  const warningsStock = items.filter(
    (it) => it.stockActual - it.cantidad < 0,
  );

  function handleOpenChange(open: boolean) {
    if (cobrando) return; // bloqueado durante el request
    if (!open) onCancelar();
  }

  return (
    <Dialog open={abierto} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => {
          if (cobrando) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (cobrando) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Confirmar cobro</DialogTitle>
        </DialogHeader>

        {warningsStock.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="mb-1 flex items-center gap-1.5 font-medium">
              <AlertTriangle className="h-4 w-4" />
              Atención con el stock
            </div>
            <ul className="space-y-1 pl-1">
              {warningsStock.map((it) => {
                const restante = it.stockActual - it.cantidad;
                return (
                  <li key={it.varianteId}>
                    {it.nombreCompleto} quedaría con stock negativo (
                    {restante} unidades).
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="space-y-3">
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Producto</th>
                  <th className="px-3 py-2 text-right font-medium">Cant.</th>
                  <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.varianteId} className="border-t">
                    <td className="px-3 py-2">{it.nombreCompleto}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {it.cantidad}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatoPrecio(it.precioUnitario * it.cantidad)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatoPrecio(subtotal)}</span>
            </div>
            {aplicaDescuento && (
              <div className="flex justify-between text-emerald-700">
                <span>Descuento 10%</span>
                <span className="tabular-nums">
                  -{formatoPrecio(descuento)}
                </span>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t pt-2">
              <span className="text-sm font-semibold uppercase tracking-wide">
                Total
              </span>
              <span className="text-xl font-bold tabular-nums">
                {formatoPrecio(total)}
              </span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Métodos de cobro
            </p>
            <div className="flex flex-wrap gap-2">
              {metodosPago.map((m) => {
                const monto = parseFloat(m.monto) || 0;
                return (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1 text-sm"
                  >
                    <span className="font-medium">
                      {LABEL_METODO[m.metodo] ?? m.metodo}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatoPrecio(monto)}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancelar}
            disabled={cobrando}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirmar} disabled={cobrando}>
            {cobrando && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar cobro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
