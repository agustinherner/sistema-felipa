'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { obtenerDetalleVentaAction } from '@/lib/ventas/actions';
import type {
  MetodoPagoItem,
  MetodoPagoVenta,
  VentaDetalle,
} from '@/lib/ventas/queries';

const FECHA_HORA_FMT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const FECHA_HORA_CORTA_FMT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const METODO_ABREV: Record<MetodoPagoVenta, string> = {
  EFECTIVO: 'EF',
  TRANSFERENCIA: 'TR',
  DEBITO: 'DE',
  CREDITO: 'CR',
};

const METODO_LABEL: Record<MetodoPagoVenta, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
};

const METODO_COLOR: Record<MetodoPagoVenta, string> = {
  EFECTIVO: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  TRANSFERENCIA: 'border-sky-200 bg-sky-50 text-sky-700',
  DEBITO: 'border-violet-200 bg-violet-50 text-violet-700',
  CREDITO: 'border-amber-200 bg-amber-50 text-amber-800',
};

function formatMoneda(n: number): string {
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

function nombreItem(productoNombre: string, varianteNombre: string, esUnica: boolean): string {
  if (esUnica) return productoNombre;
  return `${productoNombre} (${varianteNombre})`;
}

function PagoChips({ metodos }: { metodos: MetodoPagoItem[] }) {
  if (metodos.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">
        Sin métodos registrados
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {metodos.map((m, i) => (
        <span
          key={`${m.metodo}-${i}`}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm font-medium',
            METODO_COLOR[m.metodo],
          )}
          title={METODO_LABEL[m.metodo]}
        >
          <span className="font-semibold">{METODO_ABREV[m.metodo]}</span>
          <span className="tabular-nums">{formatMoneda(m.monto)}</span>
        </span>
      ))}
    </div>
  );
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; mensaje: string }
  | { status: 'ok'; venta: VentaDetalle };

type Props = {
  ventaId: string | null;
  onClose: () => void;
};

export function DetalleVentaModal({ ventaId, onClose }: Props) {
  const [state, setState] = useState<State>({ status: 'idle' });

  useEffect(() => {
    if (!ventaId) {
      setState({ status: 'idle' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    obtenerDetalleVentaAction({ ventaId })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setState({ status: 'ok', venta: res.venta });
        } else {
          setState({
            status: 'error',
            mensaje: res.errores.join(' · ') || 'Error desconocido',
          });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const mensaje =
          err instanceof Error ? err.message : 'Error al cargar la venta';
        setState({ status: 'error', mensaje });
      });
    return () => {
      cancelled = true;
    };
  }, [ventaId]);

  const open = ventaId !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        {state.status === 'loading' || state.status === 'idle' ? (
          <>
            <DialogHeader>
              <DialogTitle>Detalle de venta</DialogTitle>
              <DialogDescription>Cargando datos…</DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              <span className="sr-only">Cargando…</span>
            </div>
          </>
        ) : state.status === 'error' ? (
          <>
            <DialogHeader>
              <DialogTitle>No se pudo cargar la venta</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-destructive">{state.mensaje}</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <DetalleContenido venta={state.venta} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetalleContenido({
  venta,
  onClose,
}: {
  venta: VentaDetalle;
  onClose: () => void;
}) {
  const fechaCompleta = FECHA_HORA_FMT.format(new Date(venta.creadaEn));

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-mono text-lg">
          {venta.codigoCorto}
        </DialogTitle>
        <DialogDescription>
          {fechaCompleta} · Vendedor: {venta.usuarioNombre}
        </DialogDescription>
      </DialogHeader>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Items
        </h3>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Producto</th>
                <th className="w-[60px] px-3 py-2 text-right font-medium">
                  Cant.
                </th>
                <th className="w-[100px] px-3 py-2 text-right font-medium">
                  P. unit.
                </th>
                <th className="w-[100px] px-3 py-2 text-right font-medium">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {venta.items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="px-3 py-2">
                    {nombreItem(
                      it.productoNombre,
                      it.varianteNombre,
                      it.esVarianteUnicaImplicita,
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {it.cantidad}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatMoneda(it.precioUnitario)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">
                    {formatMoneda(it.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Pago
        </h3>
        <PagoChips metodos={venta.metodosPago} />
      </section>

      <section className="rounded-md border bg-muted/30 p-3">
        {venta.aplicaDescuento ? (
          <dl className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatMoneda(venta.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between text-emerald-700">
              <dt>Descuento 10%</dt>
              <dd className="tabular-nums">
                -{formatMoneda(venta.descuentoTotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t pt-1.5 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoneda(venta.total)}</dd>
            </div>
          </dl>
        ) : (
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatMoneda(venta.total)}</span>
          </div>
        )}
      </section>

      {venta.turno && (
        <section className="text-xs text-muted-foreground">
          Turno abierto:{' '}
          {FECHA_HORA_CORTA_FMT.format(new Date(venta.turno.aperturaEn))}
          {venta.turno.cierreEn && (
            <>
              {' '}
              — cerrado:{' '}
              {FECHA_HORA_CORTA_FMT.format(new Date(venta.turno.cierreEn))}
            </>
          )}
        </section>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </DialogFooter>
    </>
  );
}
