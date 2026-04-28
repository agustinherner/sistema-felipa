'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type Categoria = { id: string; nombre: string };

export function StockFilters({
  categorias,
  initialQ,
  initialCategoriaId,
  initialSoloBajo,
  initialSoloNegativo,
  initialIncluirInactivas,
}: {
  categorias: Categoria[];
  initialQ: string;
  initialCategoriaId: string;
  initialSoloBajo: boolean;
  initialSoloNegativo: boolean;
  initialIncluirInactivas: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQ);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = q.trim();
      if (trimmed) params.set('q', trimmed);
      else params.delete('q');
      params.delete('page');
      router.replace(`/stock?${params.toString()}`);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setParam(name: string, value: string | boolean) {
    const params = new URLSearchParams(searchParams.toString());
    const v = typeof value === 'boolean' ? (value ? '1' : '') : value;
    if (v) params.set(name, v);
    else params.delete(name);
    params.delete('page');
    router.replace(`/stock?${params.toString()}`);
  }

  function limpiar() {
    setQ('');
    router.replace('/stock');
  }

  const hayFiltros =
    q.trim().length > 0 ||
    initialCategoriaId.length > 0 ||
    initialSoloBajo ||
    initialSoloNegativo ||
    initialIncluirInactivas;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Buscar por producto o variante…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="w-full max-w-xs">
        <Select
          value={initialCategoriaId}
          onChange={(e) => setParam('categoriaId', e.target.value)}
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={initialSoloBajo}
          onChange={(e) => setParam('soloBajo', e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        Solo stock bajo (≤3)
      </label>
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={initialSoloNegativo}
          onChange={(e) => setParam('soloNegativo', e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        Solo stock negativo
      </label>
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={initialIncluirInactivas}
          onChange={(e) => setParam('inactivas', e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        Ver variantes inactivas
      </label>
      {hayFiltros && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={limpiar}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4" aria-hidden />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
