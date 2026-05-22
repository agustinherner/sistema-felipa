'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Ban, Loader2 } from 'lucide-react';
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
import {
  anularVenta,
  obtenerDetalleVentaAction,
} from '@/lib/ventas/actions';
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

function labelDescuentoDetalle(v: VentaDetalle): string {
  if (v.descuentoTipo === 'PORCENTAJE' && v.descuentoValor !== null) {
    const n = v.descuentoValor;
    const txt = Number.isInteger(n) ? n.toString() : n.toFixed(2);
    return `Descuento ${txt}%`;
  }
  if (v.descuentoTipo === 'MONTO' && v.descuentoValor !== null) {
    return `Descuento $${Math.round(v.descuentoValor).toLocaleString('es-AR')}`;
  }
  // Legacy: aplicaDescuento true sin tipo (ventas pre-cambio).
  return 'Descuento';
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
  currentUserId: string;
  esAdmin: boolean;
};

export function DetalleVentaModal({
  ventaId,
  onClose,
  currentUserId,
  esAdmin,
}: Props) {
  const [state, setState] = useState<State>({ status: 'idle' });
  const router = useRouter();

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

  function handleVentaAnulada(actualizada: VentaDetalle) {
    setState({ status: 'ok', venta: actualizada });
    router.refresh();
  }

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
          <DetalleContenido
            venta={state.venta}
            onClose={onClose}
            currentUserId={currentUserId}
            esAdmin={esAdmin}
            onAnulada={handleVentaAnulada}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetalleContenido({
  venta,
  onClose,
  currentUserId,
  esAdmin,
  onAnulada,
}: {
  venta: VentaDetalle;
  onClose: () => void;
  currentUserId: string;
  esAdmin: boolean;
  onAnulada: (v: VentaDetalle) => void;
}) {
  const fechaCompleta = FECHA_HORA_FMT.format(new Date(venta.creadaEn));
  const [mostrarForm, setMostrarForm] = useState(false);

  const turnoAbierto = venta.turno !== null && venta.turno.cierreEn === null;
  const puedeAnularPorRol = esAdmin || venta.usuarioId === currentUserId;
  const puedeAnular =
    !venta.anulacion && turnoAbierto && puedeAnularPorRol;

  return (
    <>
      <DialogHeader>
        <DialogTitle
          className={cn(
            'font-mono text-lg',
            venta.anulacion && 'text-muted-foreground line-through',
          )}
        >
          {venta.codigoCorto}
        </DialogTitle>
        <DialogDescription>
          {fechaCompleta} · Vendedor: {venta.usuarioNombre}
        </DialogDescription>
      </DialogHeader>

      {venta.anulacion && (
        <div className="space-y-1 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          <div className="flex items-center gap-2 font-semibold uppercase tracking-wide">
            <Ban className="h-4 w-4" aria-hidden />
            Venta anulada
          </div>
          <p>
            Anulada el{' '}
            {FECHA_HORA_FMT.format(new Date(venta.anulacion.anuladaEn))}
            {venta.anulacion.anuladaPorNombre
              ? ` por ${venta.anulacion.anuladaPorNombre}`
              : ''}
            .
          </p>
          {venta.anulacion.motivo && (
            <p>
              <span className="font-medium">Motivo:</span>{' '}
              {venta.anulacion.motivo}
            </p>
          )}
        </div>
      )}

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
              <dt>{labelDescuentoDetalle(venta)}</dt>
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

      {puedeAnular && mostrarForm && (
        <FormAnular
          ventaId={venta.id}
          onCancel={() => setMostrarForm(false)}
          onSuccess={onAnulada}
        />
      )}

      <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {puedeAnular && !mostrarForm ? (
          <Button
            type="button"
            variant="outline"
            className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
            onClick={() => setMostrarForm(true)}
          >
            <Ban className="h-4 w-4" />
            Anular venta
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </DialogFooter>
    </>
  );
}

function FormAnular({
  ventaId,
  onCancel,
  onSuccess,
}: {
  ventaId: string;
  onCancel: () => void;
  onSuccess: (v: VentaDetalle) => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enviandoRef = useRef(false);

  async function confirmar() {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    setError(null);
    try {
      const res = await anularVenta({ ventaId, motivo: motivo.trim() });
      if (!res.ok) {
        setError(res.errores.join(' · ') || 'No se pudo anular la venta.');
        setConfirmando(false);
        return;
      }
      const detalle = await obtenerDetalleVentaAction({ ventaId });
      if (detalle.ok) {
        onSuccess(detalle.venta);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo anular la venta.',
      );
      setConfirmando(false);
    } finally {
      setEnviando(false);
      enviandoRef.current = false;
    }
  }

  return (
    <section className="space-y-3 rounded-md border border-rose-200 bg-rose-50/60 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
        <AlertTriangle className="h-4 w-4" aria-hidden />
        Anular venta
      </div>
      <div className="space-y-1">
        <label
          htmlFor="motivo-anulacion"
          className="text-xs font-medium text-muted-foreground"
        >
          Motivo (obligatorio)
        </label>
        <textarea
          id="motivo-anulacion"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Ej: producto equivocado, doble registro…"
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {confirmando ? (
        <div className="space-y-2 rounded-md border border-rose-300 bg-background p-3 text-sm">
          <p className="font-medium text-rose-900">
            ¿Seguro que querés anular esta venta?
          </p>
          <p className="text-xs text-muted-foreground">
            Esta acción no se puede deshacer. Se va a revertir el stock y la
            venta no va a contar en los totales del turno.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={enviando}
              onClick={confirmar}
            >
              {enviando && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              Sí, anular
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={enviando}
              onClick={() => setConfirmando(false)}
            >
              Volver
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={motivo.trim().length < 3}
            onClick={() => {
              setError(null);
              setConfirmando(true);
            }}
          >
            Anular venta
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            Cancelar
          </Button>
        </div>
      )}
    </section>
  );
}
