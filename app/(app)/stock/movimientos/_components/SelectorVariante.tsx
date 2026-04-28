'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { buscarVariantesIngresoAction } from '@/lib/stock/actions';
import {
  etiquetaVariante,
  type VarianteParaIngreso,
} from '@/lib/stock/helpers';

type Props = {
  sucursalId: string;
  selectedId: string;
  selectedLabel: string | null;
  onChange: (varianteId: string) => void;
};

export function SelectorVariante({
  sucursalId,
  selectedId,
  selectedLabel,
  onChange,
}: Props) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<VarianteParaIngreso[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchSeqRef = useRef(0);

  const fetchAhora = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setItems([]);
        setOpen(false);
        return;
      }
      const seq = ++fetchSeqRef.current;
      const res = await buscarVariantesIngresoAction(trimmed, sucursalId);
      if (seq !== fetchSeqRef.current) return;
      if (!res.ok) {
        setItems([]);
        return;
      }
      setItems(res.items);
      setHighlight(0);
      setOpen(res.items.length > 0);
    },
    [sucursalId],
  );

  useEffect(() => {
    if (selectedId) return;
    const trimmed = query.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!trimmed) {
      setItems([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(() => {
        fetchAhora(trimmed);
      });
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selectedId, fetchAhora]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function seleccionar(v: VarianteParaIngreso) {
    onChange(v.varianteId);
    setQuery('');
    setItems([]);
    setOpen(false);
  }

  function limpiar() {
    onChange('');
    setQuery('');
    setItems([]);
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      if (items.length > 0) {
        e.preventDefault();
        setOpen(true);
        setHighlight((h) => Math.min(h + 1, items.length - 1));
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      if (items.length > 0) {
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
      }
      return;
    }
    if (e.key === 'Enter' && items.length > 0) {
      e.preventDefault();
      const sel = items[highlight] ?? items[0];
      if (sel) seleccionar(sel);
    }
  }

  if (selectedId && selectedLabel) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex max-w-full items-center gap-2 truncate rounded-md border bg-muted/40 px-2 py-1 text-sm">
          <span className="truncate" title={selectedLabel}>
            {selectedLabel}
          </span>
          <button
            type="button"
            onClick={limpiar}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Quitar variante seleccionada"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (items.length > 0) setOpen(true);
          }}
          placeholder="Buscar variante…"
          className="pl-9"
          autoComplete="off"
          aria-label="Filtrar por variante"
        />
        {pending && (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden
          />
        )}
      </div>

      {open && items.length > 0 && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-md border bg-background shadow-lg"
        >
          {items.map((it, idx) => {
            const isHighlighted = idx === highlight;
            const label = etiquetaVariante({
              productoNombre: it.productoNombre,
              varianteNombre: it.varianteNombre,
              esVarianteUnicaImplicita: it.esVarianteUnicaImplicita,
            });
            return (
              <button
                key={it.varianteId}
                type="button"
                role="option"
                aria-selected={isHighlighted}
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => seleccionar(it)}
                className={cn(
                  'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent',
                  isHighlighted && 'bg-accent',
                )}
              >
                <span
                  className={cn(
                    'truncate font-medium',
                    (!it.varianteActiva || !it.productoActivo) &&
                      'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
                {it.codigoBarras && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {it.codigoBarras}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {selectedId && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={limpiar}
          className="mt-1 text-muted-foreground"
        >
          Quitar selección
        </Button>
      )}
    </div>
  );
}
