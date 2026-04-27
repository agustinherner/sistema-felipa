'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type Categoria = { id: string; nombre: string };

export function ProductosFilters({
  categorias,
  initialQ,
  initialCategoriaId,
}: {
  categorias: Categoria[];
  initialQ: string;
  initialCategoriaId: string;
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
      router.replace(`/productos?${params.toString()}`);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function onCategoriaChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('categoriaId', value);
    else params.delete('categoriaId');
    params.delete('page');
    router.replace(`/productos?${params.toString()}`);
  }

  function limpiar() {
    setQ('');
    router.replace('/productos');
  }

  const hayFiltros = q.trim().length > 0 || initialCategoriaId.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Buscar por nombre o código de barras…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="w-full max-w-xs">
        <Select
          value={initialCategoriaId}
          onChange={(e) => onCategoriaChange(e.target.value)}
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
