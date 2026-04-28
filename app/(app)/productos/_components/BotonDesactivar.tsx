'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { desactivarProducto, reactivarProducto } from '@/lib/productos/actions';

type Props = {
  productoId: string;
  activo: boolean;
};

export function BotonDesactivar({ productoId, activo }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = activo
        ? await desactivarProducto(productoId)
        : await reactivarProducto(productoId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setConfirmOpen(false);
      router.push('/productos');
      router.refresh();
    });
  }

  if (activo) {
    return (
      <>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setConfirmOpen(true)}
          disabled={pending}
        >
          Desactivar producto
        </Button>
        {confirmOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar desactivación"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !pending) setConfirmOpen(false);
            }}
          >
            <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
              <h2 className="text-lg font-semibold">¿Desactivar este producto?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                No se va a poder vender pero se preserva el historial. Podés
                reactivarlo después.
              </p>
              {error && (
                <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmOpen(false)}
                  disabled={pending}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleConfirm}
                  disabled={pending}
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pending ? 'Desactivando…' : 'Desactivar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        onClick={handleConfirm}
        disabled={pending}
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? 'Reactivando…' : 'Reactivar producto'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
