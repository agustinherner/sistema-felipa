'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { crearCategoria } from '@/lib/productos/actions';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (categoria: { id: string; nombre: string }) => void;
};

export function NuevaCategoriaModal({ open, onClose, onCreated }: Props) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setNombre('');
      setDescripcion('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    const trimmed = nombre.trim();
    if (trimmed.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    startTransition(async () => {
      const res = await crearCategoria(trimmed, descripcion.trim() || undefined);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onCreated(res.categoria);
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nueva categoría"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Nueva categoría</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Se crea y queda seleccionada en el formulario.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="categoria-nombre"
              className="text-sm font-medium"
            >
              Nombre
            </label>
            <Input
              ref={inputRef}
              id="categoria-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Decoración"
              maxLength={120}
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="categoria-descripcion"
              className="text-sm font-medium"
            >
              Descripción <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Input
              id="categoria-descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={250}
              disabled={pending}
            />
          </div>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
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
              {pending ? 'Creando…' : 'Crear categoría'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
