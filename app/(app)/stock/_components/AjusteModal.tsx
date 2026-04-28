'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { registrarAjuste } from '@/lib/stock/actions';
import type { TipoAjuste } from '@/lib/stock/schemas';
import type { StockFila } from './StockTable';

const TIPOS: { value: TipoAjuste; label: string; descripcion: string }[] = [
  { value: 'AJUSTE_ROTURA', label: 'Rotura', descripcion: 'resta stock' },
  { value: 'AJUSTE_ROBO', label: 'Robo / pérdida', descripcion: 'resta stock' },
  {
    value: 'AJUSTE_CONTEO',
    label: 'Conteo de inventario',
    descripcion: 'ajusta al valor real',
  },
  {
    value: 'DEVOLUCION',
    label: 'Devolución de cliente',
    descripcion: 'suma stock',
  },
];

export function AjusteModal({
  fila,
  onClose,
  onSuccess,
}: {
  fila: StockFila;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [tipo, setTipo] = useState<TipoAjuste>('AJUSTE_ROTURA');
  const [cantidad, setCantidad] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [confirmingNeg, setConfirmingNeg] = useState<{
    nuevoStock: number;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const cantidadRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const t = setTimeout(() => cantidadRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [tipo]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!pending) onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!pending) formRef.current?.requestSubmit();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, pending]);

  function calcularDelta(cantidadInput: number): number {
    if (tipo === 'AJUSTE_ROTURA' || tipo === 'AJUSTE_ROBO')
      return -cantidadInput;
    if (tipo === 'DEVOLUCION') return cantidadInput;
    return cantidadInput - fila.stockActual;
  }

  function submit(forzarNeg: boolean = false) {
    setError(null);
    const trimmed = cantidad.trim();
    if (!trimmed) {
      setError('Ingresá una cantidad.');
      return;
    }
    const n = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(n)) {
      setError('Cantidad inválida.');
      return;
    }
    if (tipo === 'AJUSTE_CONTEO') {
      if (n < 0) {
        setError('La cantidad real contada no puede ser negativa.');
        return;
      }
    } else {
      if (n < 1) {
        setError('La cantidad debe ser al menos 1.');
        return;
      }
    }

    const delta = calcularDelta(n);
    const nuevoStock = fila.stockActual + delta;

    if (!forzarNeg && nuevoStock < 0) {
      setConfirmingNeg({ nuevoStock });
      return;
    }

    startTransition(async () => {
      const res = await registrarAjuste({
        varianteId: fila.varianteId,
        sucursalId: fila.sucursalId,
        tipo,
        cantidadInput: n,
        motivo: motivo.trim() || null,
      });
      if (!res.ok) {
        setError(res.errores[0] ?? 'No se pudo registrar el ajuste.');
        setConfirmingNeg(null);
        return;
      }
      if (res.sinCambios) {
        onSuccess(
          'El stock ya coincide con el conteo. No se creó ningún movimiento.',
        );
      } else {
        onSuccess(`Ajuste registrado. Nuevo stock: ${res.nuevoStock}.`);
      }
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(false);
  }

  const labelCantidad =
    tipo === 'AJUSTE_CONTEO' ? 'Cantidad real contada' : 'Cantidad afectada';

  const cantidadNum = cantidad.trim() ? Number.parseInt(cantidad, 10) : NaN;
  const previewDelta = Number.isFinite(cantidadNum) ? calcularDelta(cantidadNum) : null;
  const previewNuevoStock =
    previewDelta !== null ? fila.stockActual + previewDelta : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ajustar stock"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Ajustar stock</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {fila.productoNombre} — {fila.varianteNombre}
        </p>
        <p className="mt-3 text-sm">
          Stock actual:{' '}
          <span className="font-semibold tabular-nums">{fila.stockActual}</span>
        </p>

        <form ref={formRef} className="mt-4 space-y-4" onSubmit={onSubmit}>
          <fieldset className="space-y-1.5">
            <legend className="mb-1 text-sm font-medium">
              Tipo de movimiento
            </legend>
            {TIPOS.map((t) => (
              <label
                key={t.value}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="tipo"
                  value={t.value}
                  checked={tipo === t.value}
                  onChange={() => {
                    setTipo(t.value);
                    setError(null);
                    setConfirmingNeg(null);
                  }}
                  disabled={pending}
                />
                <span>
                  {t.label}{' '}
                  <span className="text-muted-foreground">
                    ({t.descripcion})
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <div>
            <label
              className="text-sm font-medium"
              htmlFor="ajuste-cantidad"
            >
              {labelCantidad}
            </label>
            <Input
              id="ajuste-cantidad"
              ref={cantidadRef}
              type="number"
              inputMode="numeric"
              step={1}
              min={tipo === 'AJUSTE_CONTEO' ? 0 : 1}
              value={cantidad}
              onChange={(e) => {
                setCantidad(e.target.value);
                setConfirmingNeg(null);
              }}
              disabled={pending}
              className="mt-1"
            />
            {tipo === 'AJUSTE_CONTEO' && previewDelta !== null && (
              <p className="mt-1 text-xs text-muted-foreground">
                Delta calculado:{' '}
                <span className="tabular-nums">
                  {previewDelta > 0 ? `+${previewDelta}` : previewDelta}
                </span>{' '}
                (de {fila.stockActual} a {previewNuevoStock}).
              </p>
            )}
            {tipo !== 'AJUSTE_CONTEO' && previewDelta !== null && cantidadNum >= 1 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Nuevo stock: <span className="tabular-nums">{previewNuevoStock}</span>.
              </p>
            )}
          </div>

          <div>
            <label
              className="text-sm font-medium"
              htmlFor="ajuste-motivo"
            >
              Motivo (opcional)
            </label>
            <textarea
              id="ajuste-motivo"
              maxLength={500}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={pending}
              className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Ej: caja golpeada en el ingreso"
            />
          </div>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {confirmingNeg && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <p className="font-medium">
                Esto va a dejar el stock en {confirmingNeg.nuevoStock}.
              </p>
              <p className="mt-1">¿Confirmás de todas formas?</p>
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingNeg(null)}
                  disabled={pending}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => submit(true)}
                  disabled={pending}
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sí, confirmar
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || !!confirmingNeg}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? 'Registrando…' : 'Confirmar ajuste'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
