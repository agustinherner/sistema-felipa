'use client';

import { useEffect } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type {
  DescuentoState,
  DescuentoTipo,
  MetodoPago,
  MetodoPagoEntry,
} from './VentaNuevaForm';

type Props = {
  metodosPago: MetodoPagoEntry[];
  subtotal: number;
  descuento: DescuentoState | null;
  descuentoMonto: number;
  descuentoError: string | null;
  descuentoActivo: boolean;
  /** Porcentaje del preset "1 toque" (de Configuracion). Se usa solo en el label. */
  descuentoEstandar: number;
  total: number;
  sumaPagos: number;
  diferenciaRestante: number;
  cobroValido: boolean;
  carritoVacio: boolean;
  onAgregarMetodo: () => void;
  onCambiarMetodo: (id: string, metodo: MetodoPago | '') => void;
  onCambiarMonto: (id: string, monto: string) => void;
  onEliminarMetodo: (id: string) => void;
  onCambiarDescuentoTipo: (tipo: DescuentoTipo) => void;
  onCambiarDescuentoValor: (valor: string) => void;
  onAplicarPresetEfTransf: () => void;
  onQuitarDescuento: () => void;
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
  descuentoMonto,
  descuentoError,
  descuentoActivo,
  descuentoEstandar,
  total,
  diferenciaRestante,
  cobroValido,
  carritoVacio,
  onAgregarMetodo,
  onCambiarMetodo,
  onCambiarMonto,
  onEliminarMetodo,
  onCambiarDescuentoTipo,
  onCambiarDescuentoValor,
  onAplicarPresetEfTransf,
  onQuitarDescuento,
  onCobrar,
  cobrando,
}: Props) {
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
      if (cobroValido && !cobrando) {
        e.preventDefault();
        onCobrar();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cobroValido, cobrando, onCobrar]);

  const tipoSeleccionado = descuento?.tipo ?? 'PORCENTAJE';
  const valorDescuento = descuento?.valor ?? '';
  const sufijo = tipoSeleccionado === 'PORCENTAJE' ? '%' : '$';

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
          {descuentoActivo && (
            <div className="flex items-center justify-between text-emerald-700">
              <span>
                Descuento{' '}
                {descuento?.tipo === 'PORCENTAJE'
                  ? `${descuento.valor}%`
                  : 'monto fijo'}
              </span>
              <span className="tabular-nums">
                -{formatoPrecio(descuentoMonto)}
              </span>
            </div>
          )}
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

      {/* ---- Descuento ---- */}
      <div className="mt-5 space-y-2 rounded-md border bg-muted/20 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Descuento (opcional)
          </h3>
          {descuento !== null && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onQuitarDescuento}
              disabled={cobrando}
              className="h-7 px-2 text-xs"
            >
              Quitar
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAplicarPresetEfTransf}
            disabled={cobrando || carritoVacio}
            className="h-8 text-xs"
          >
            {descuentoEstandar}% Ef/Transf
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={tipoSeleccionado}
            onChange={(e) =>
              onCambiarDescuentoTipo(e.target.value as DescuentoTipo)
            }
            disabled={cobrando}
            className="w-24"
            aria-label="Tipo de descuento"
          >
            <option value="PORCENTAJE">%</option>
            <option value="MONTO">$</option>
          </Select>
          <div className="relative flex-1">
            <Input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              placeholder={
                tipoSeleccionado === 'PORCENTAJE' ? '0' : '$0'
              }
              value={valorDescuento}
              onChange={(e) => onCambiarDescuentoValor(e.target.value)}
              onFocus={() => {
                if (descuento === null) onCambiarDescuentoTipo(tipoSeleccionado);
              }}
              disabled={cobrando || carritoVacio}
              className="pr-7"
              aria-label="Valor del descuento"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {sufijo}
            </span>
          </div>
        </div>
        {descuentoError && (
          <p className="text-xs text-red-600" role="alert">
            {descuentoError}
          </p>
        )}
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
