'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { obtenerHistorialVariante } from '@/lib/stock/actions';
import type { HistorialMovimientoView } from '@/lib/stock/helpers';
import type { StockFila } from './StockTable';

export function HistorialModal({
  fila,
  onClose,
}: {
  fila: StockFila;
  onClose: () => void;
}) {
  const [items, setItems] = useState<HistorialMovimientoView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    obtenerHistorialVariante(fila.varianteId, fila.sucursalId)
      .then((r) => {
        if (!active) return;
        if (r.ok) setItems(r.items);
        else setError(r.error);
      })
      .catch((e) => {
        if (!active) return;
        console.error(e);
        setError('No se pudo cargar el historial.');
      });
    return () => {
      active = false;
    };
  }, [fila.varianteId, fila.sucursalId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Historial de movimientos"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Historial de movimientos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {fila.productoNombre} — {fila.varianteNombre}
        </p>
        <p className="mt-3 text-sm">
          Stock actual:{' '}
          <span className="font-semibold tabular-nums">{fila.stockActual}</span>
        </p>

        <div className="mt-4">
          <p className="text-sm font-medium">Últimos 20 movimientos</p>
          <div className="mt-2 max-h-96 overflow-auto rounded-md border">
            {!items && !error && (
              <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando…
              </div>
            )}
            {error && (
              <div className="p-4 text-sm text-destructive">{error}</div>
            )}
            {items && items.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No hay movimientos registrados todavía.
              </div>
            )}
            {items && items.length > 0 && (
              <ul className="divide-y">
                {items.map((m) => {
                  const cantClass =
                    m.cantidad > 0
                      ? 'text-emerald-700'
                      : m.cantidad < 0
                        ? 'text-destructive'
                        : 'text-muted-foreground';
                  const cantidadStr =
                    m.cantidad > 0 ? `+${m.cantidad}` : `${m.cantidad}`;
                  return (
                    <li
                      key={m.id}
                      className="grid grid-cols-[110px_60px_1fr_120px] items-baseline gap-3 px-3 py-2 text-sm"
                    >
                      <span className="tabular-nums text-muted-foreground">
                        {m.creadoEnTexto}
                      </span>
                      <span className={`font-semibold tabular-nums ${cantClass}`}>
                        {cantidadStr}
                      </span>
                      <span className="min-w-0 truncate">
                        <span className="font-medium">{m.tipoLabel}</span>
                        {m.ventaCodigoCorto && m.ventaId && (
                          <>
                            {' — '}
                            <a
                              href={`/ventas/${m.ventaId}`}
                              className="text-primary underline-offset-2 hover:underline"
                            >
                              {m.ventaCodigoCorto}
                            </a>
                          </>
                        )}
                        {m.motivo && !m.ventaCodigoCorto && (
                          <>
                            {' — '}
                            <span className="text-muted-foreground">
                              {m.motivo}
                            </span>
                          </>
                        )}
                      </span>
                      <span className="text-right text-muted-foreground">
                        {m.usuarioNombre}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Para ver el historial completo, ir a Movimientos.
        </p>

        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
