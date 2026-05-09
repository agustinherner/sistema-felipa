'use client';

import { useEffect } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { MetodoPago, MetodoPagoEntry } from './VentaNuevaForm';

type Props = {
  metodosPago: MetodoPagoEntry[];
  subtotal: number;
  descuento: number;
  total: number;
  sumaPagos: number;
  diferenciaRestante: number;
  cobroValido: boolean;
  carritoVacio: boolean;
  onAgregarMetodo: () => void;
  onCambiarMetodo: (id: string, metodo: MetodoPago | '') => void;
  onCambiarMonto: (id: string, monto: string) => void;
  onEliminarMetodo: (id: string) => void;
  onCobrar: () => void;
  cobrando: boolean;
};

const MAX_METODOS = 4;

const OPCIONES: { value: MetodoPago; label: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'DEBITO', label: 'Débito' },
  { value: 'CREDITO', label: 'Crédito' },
];

function formatoPrecio(n: number): string {
  return `$${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

export function MetodosPagoPanel({
  metodosPago,
  subtotal,
  descuento,
  total,
  diferenciaRestante,
  cobroValido,
  carritoVacio,
  onAgregarMetodo,
  onCambiarMetodo,
  onCambiarMonto,
  onEliminarMetodo,
  onCobrar,
  cobrando,
}: Props) {
  const aplicaDescuento = descuento > 0;
  const metodosUsados = new Set(
    metodosPago.map((m) => m.metodo).filter((m) => m !== ''),
  );
  const ultimoTieneMetodo =
    metodosPago.length > 0 &&
    metodosPago[metodosPago.length - 1].metodo !== '';
  const puedeAgregarMas =
    metodosPago.length < MAX_METODOS && ultimoTieneMetodo;

  // Atajo F2 para activar el cobro si está habilitado.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'F2') return;
      const ae = document.activeElement;
      // Si el usuario está editando un input/select, no interceptar.
      if (
        ae instanceof HTMLInputElement ||
        ae instanceof HTMLSelectElement ||
        ae instanceof HTMLTextAreaElement
      ) {
        // Permitir F2 igual si el input es un campo de monto y todo está válido.
        // Trade-off: el cajero puede querer disparar F2 desde el input de monto.
      }
      if (cobroValido && !cobrando) {
        e.preventDefault();
        onCobrar();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cobroValido, cobrando, onCobrar]);

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm lg:sticky lg:top-6">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Resumen
        </h2>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatoPrecio(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span
              className={
                'inline-flex items-center gap-1.5 ' +
                (aplicaDescuento
                  ? 'text-emerald-700'
                  : 'text-muted-foreground')
              }
            >
              <span
                className={
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ' +
                  (aplicaDescuento
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-muted text-muted-foreground')
                }
              >
                Descuento 10% {aplicaDescuento ? '✓' : ''}
              </span>
            </span>
            <span
              className={
                'tabular-nums ' +
                (aplicaDescuento ? 'text-emerald-700' : 'text-muted-foreground')
              }
            >
              {aplicaDescuento ? `-${formatoPrecio(descuento)}` : '$0'}
            </span>
          </div>
        </div>
        <div className="border-t pt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold uppercase tracking-wide">
              Total
            </span>
            <span className="text-2xl font-bold tabular-nums">
              {formatoPrecio(total)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Métodos de pago
        </h3>
        <div className="space-y-2">
          {metodosPago.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <Select
                value={m.metodo}
                onChange={(e) =>
                  onCambiarMetodo(
                    m.id,
                    e.target.value as MetodoPago | '',
                  )
                }
                disabled={cobrando}
                className="flex-1"
                aria-label="Método de pago"
              >
                <option value="">Elegir método…</option>
                {OPCIONES.map((opt) => {
                  const usado =
                    metodosUsados.has(opt.value) && m.metodo !== opt.value;
                  return (
                    <option key={opt.value} value={opt.value} disabled={usado}>
                      {opt.label}
                    </option>
                  );
                })}
              </Select>
              <Input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder="$"
                value={m.monto}
                onChange={(e) => onCambiarMonto(m.id, e.target.value)}
                disabled={cobrando}
                className="w-28"
                aria-label="Monto"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onEliminarMetodo(m.id)}
                disabled={cobrando || metodosPago.length === 1}
                aria-label="Eliminar método"
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        {puedeAgregarMas && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAgregarMetodo}
            disabled={cobrando}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            Agregar método
          </Button>
        )}
      </div>

      {!carritoVacio && diferenciaRestante > 0.01 && (
        <div className="mt-4 flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-sm">
          <span className="font-medium text-amber-900">Faltan</span>
          <span className="tabular-nums font-semibold text-amber-900">
            {formatoPrecio(diferenciaRestante)}
          </span>
        </div>
      )}
      {diferenciaRestante < -0.01 && (
        <div className="mt-4 flex items-center justify-between rounded-md bg-sky-50 px-3 py-2 text-sm">
          <span className="font-medium text-sky-900">Vuelto</span>
          <span className="tabular-nums font-semibold text-sky-900">
            {formatoPrecio(-diferenciaRestante)}
          </span>
        </div>
      )}

      <Button
        type="button"
        onClick={onCobrar}
        disabled={!cobroValido || cobrando}
        className="mt-5 h-12 w-full text-base font-semibold"
      >
        {cobrando && <Loader2 className="h-4 w-4 animate-spin" />}
        Cobrar
        <span className="ml-1 text-xs opacity-80">F2</span>
      </Button>
    </div>
  );
}
