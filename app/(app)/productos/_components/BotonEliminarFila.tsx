'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { desactivarProducto } from '@/lib/productos/actions';

type Props = {
  productoId: string;
  productoNombre: string;
};

export function BotonEliminarFila({ productoId, productoNombre }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const enviandoRef = useRef(false);
  const router = useRouter();

  function handleConfirm() {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setError(null);
    startTransition(async () => {
      try {
        const res = await desactivarProducto(productoId);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setConfirmOpen(false);
        router.refresh();
      } finally {
        enviandoRef.current = false;
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setConfirmOpen(true)}
        aria-label={`Eliminar ${productoNombre}`}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !pending) setConfirmOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
            <h2 className="text-lg font-semibold">¿Eliminar este producto?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              ¿Seguro que querés eliminar &ldquo;{productoNombre}&rdquo;? Esta
              acción no se puede deshacer.
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
                {pending ? 'Eliminando…' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
