'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useTransition,
} from 'react';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { buscarVariantesIngresoAction } from '@/lib/stock/actions';
import {
  etiquetaVariante,
  type VarianteParaIngreso,
} from '@/lib/stock/helpers';

export type BuscadorHandle = {
  focus: () => void;
};

type Props = {
  sucursalId: string;
  varianteIdsEnLote: Set<string>;
  onSeleccionar: (v: VarianteParaIngreso) => void;
  disabled?: boolean;
};

export const BuscadorVariantes = forwardRef<BuscadorHandle, Props>(
  function BuscadorVariantes(
    { sucursalId, varianteIdsEnLote, onSeleccionar, disabled },
    ref,
  ) {
    const [query, setQuery] = useState('');
    const [items, setItems] = useState<VarianteParaIngreso[]>([]);
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const [pending, startTransition] = useTransition();
    const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
    const [codigoNoEncontrado, setCodigoNoEncontrado] = useState<string | null>(
      null,
    );

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fetchSeqRef = useRef(0);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    const fetchAhora = useCallback(
      async (q: string): Promise<VarianteParaIngreso[]> => {
        const trimmed = q.trim();
        if (!trimmed) {
          setItems([]);
          setOpen(false);
          setCodigoNoEncontrado(null);
          return [];
        }
        const seq = ++fetchSeqRef.current;
        const res = await buscarVariantesIngresoAction(trimmed, sucursalId);
        if (seq !== fetchSeqRef.current) return [];
        if (!res.ok) {
          setErrorBusqueda(res.error);
          setItems([]);
          return [];
        }
        setErrorBusqueda(null);
        setItems(res.items);
        setHighlight(0);
        if (
          res.items.length === 0 &&
          /^\d{6,}$/.test(trimmed)
        ) {
          setCodigoNoEncontrado(trimmed);
        } else {
          setCodigoNoEncontrado(null);
        }
        return res.items;
      },
      [sucursalId],
    );

    useEffect(() => {
      const trimmed = query.trim();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!trimmed) {
        setItems([]);
        setOpen(false);
        setCodigoNoEncontrado(null);
        return;
      }
      debounceRef.current = setTimeout(() => {
        startTransition(() => {
          fetchAhora(trimmed).then((res) => {
            setOpen(res.length > 0);
          });
        });
      }, 200);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

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
      if (!v.varianteActiva || !v.productoActivo) return;
      onSeleccionar(v);
      setQuery('');
      setItems([]);
      setOpen(false);
      setCodigoNoEncontrado(null);
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
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          // dejar pasar para que el form de Ingreso lo maneje
          // (dispatch synthetic key doesn't propagate, así que bubbleamos)
          // Nada que hacer acá.
          return;
        }
        const trimmed = query.trim();
        if (!trimmed) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const candidatos = items;
        const matchExacto = candidatos.find(
          (c) => c.codigoBarras !== null && c.codigoBarras === trimmed,
        );
        if (matchExacto) {
          seleccionar(matchExacto);
          return;
        }
        if (candidatos.length > 0 && !codigoNoEncontrado) {
          const sel = candidatos[highlight] ?? candidatos[0];
          if (sel) seleccionar(sel);
          return;
        }
        // sin items aún (debounce no disparó): forzar fetch sincrónico
        startTransition(() => {
          fetchAhora(trimmed).then((items) => {
            const exacto = items.find(
              (c) => c.codigoBarras !== null && c.codigoBarras === trimmed,
            );
            if (exacto) {
              seleccionar(exacto);
            } else if (items.length > 0) {
              setOpen(true);
            }
          });
        });
      }
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
            onFocus={() => {
              if (items.length > 0) setOpen(true);
            }}
            onKeyDown={onKeyDown}
            placeholder="Escaneá código o buscá por nombre…"
            className="pl-9"
            disabled={disabled}
            autoComplete="off"
            aria-label="Buscar variante para agregar al lote"
          />
          {pending && (
            <Loader2
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden
            />
          )}
        </div>

        {errorBusqueda && (
          <p className="mt-2 text-xs text-destructive">{errorBusqueda}</p>
        )}

        {open && items.length > 0 && (
          <div
            role="listbox"
            className="absolute left-0 right-0 z-30 mt-1 max-h-80 overflow-y-auto rounded-md border bg-background shadow-lg"
          >
            {items.map((it, idx) => {
              const inactiva = !it.varianteActiva || !it.productoActivo;
              const yaEnLote = varianteIdsEnLote.has(it.varianteId);
              const isHighlighted = idx === highlight;
              return (
                <button
                  key={it.varianteId}
                  type="button"
                  role="option"
                  aria-selected={isHighlighted}
                  disabled={inactiva}
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => seleccionar(it)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm',
                    isHighlighted && !inactiva && 'bg-accent',
                    inactiva && 'cursor-not-allowed opacity-60',
                    !inactiva && 'hover:bg-accent',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate font-medium',
                        inactiva && 'line-through',
                      )}
                    >
                      {etiquetaVariante({
                        productoNombre: it.productoNombre,
                        varianteNombre: it.varianteNombre,
                        esVarianteUnicaImplicita:
                          it.esVarianteUnicaImplicita,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {it.codigoBarras ? (
                        <span className="tabular-nums">{it.codigoBarras}</span>
                      ) : (
                        <span>Sin código de barras</span>
                      )}
                      <span className="mx-1.5">·</span>
                      Stock actual:{' '}
                      <span className="tabular-nums">{it.stockActual}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {inactiva && (
                      <Badge variant="secondary" className="text-[10px]">
                        Inactiva
                      </Badge>
                    )}
                    {yaEnLote && !inactiva && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-100 text-[10px] text-emerald-900"
                      >
                        ✓ Ya en lote (suma 1)
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {codigoNoEncontrado && (
          <p className="mt-2 text-xs text-muted-foreground">
            Código <span className="tabular-nums">{codigoNoEncontrado}</span>{' '}
            no encontrado.
          </p>
        )}
      </div>
    );
  },
);
