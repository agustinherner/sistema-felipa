'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { crearProductoRapido } from '@/lib/productos/actions';
import type { ResultadoBusqueda } from '@/lib/ventas/actions';

type Props = {
  open: boolean;
  nombreInicial: string;
  onClose: () => void;
  onCreado: (resultado: ResultadoBusqueda) => void;
};

export function AltaRapidaModal({
  open,
  nombreInicial,
  onClose,
  onCreado,
}: Props) {
  const [nombre, setNombre] = useState(nombreInicial);
  const [precio, setPrecio] = useState('');
  const [errores, setErrores] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const nombreRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (open) {
      setNombre(nombreInicial);
      setPrecio('');
      setErrores([]);
      submittingRef.current = false;
      setTimeout(() => nombreRef.current?.focus(), 0);
    }
  }, [open, nombreInicial]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!pending) onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, pending]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (submittingRef.current) return;
    setErrores([]);

    const nombreTrim = nombre.trim();
    const precioNum = parseFloat(precio);
    const errs: string[] = [];
    if (nombreTrim.length < 2) {
      errs.push('El nombre debe tener al menos 2 caracteres.');
    }
    if (!Number.isFinite(precioNum) || precioNum <= 0) {
      errs.push('El precio debe ser un número mayor a 0.');
    }
    if (errs.length > 0) {
      setErrores(errs);
      return;
    }

    submittingRef.current = true;
    startTransition(async () => {
      try {
        const res = await crearProductoRapido({
          nombre: nombreTrim,
          precioVenta: precioNum,
        });
        if (!res.ok) {
          setErrores(res.errores);
          submittingRef.current = false;
          return;
        }
        onCreado({
          varianteId: res.varianteId,
          nombreCompleto: res.nombre,
          precioEfectivo: res.precio,
          stockActual: 1,
          tieneStock: true,
          esNuevo: true,
        });
        // No reseteamos el ref: el componente se desmonta al cerrar.
      } catch (err) {
        console.error('[crearProductoRapido] error inesperado:', err);
        setErrores(['No se pudo crear el producto. Reintentá.']);
        submittingRef.current = false;
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Alta rápida de producto"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold">Alta rápida</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Cargá nombre y precio para vender ahora. El admin completa el resto
          después (costo, categoría, variantes).
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="altarapida-nombre" className="text-sm font-medium">
              Nombre del producto
            </label>
            <Input
              ref={nombreRef}
              id="altarapida-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Vela aromática lavanda"
              maxLength={200}
              disabled={pending}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="altarapida-precio" className="text-sm font-medium">
              Precio de venta
            </label>
            <Input
              id="altarapida-precio"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="0.00"
              disabled={pending}
            />
          </div>

          {errores.length > 0 && (
            <div
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <ul className="list-inside list-disc">
                {errores.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? 'Agregando…' : 'Agregar al carrito'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
