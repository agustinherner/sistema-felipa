'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SelectorVariante } from './SelectorVariante';
import { SelectorUsuario } from './SelectorUsuario';

const TIPO_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los tipos' },
  { value: 'INGRESO', label: 'Ingreso' },
  { value: 'VENTA', label: 'Venta' },
  { value: 'AJUSTE_ROTURA', label: 'Rotura' },
  { value: 'AJUSTE_ROBO', label: 'Robo / pérdida' },
  { value: 'AJUSTE_CONTEO', label: 'Conteo de inventario' },
  { value: 'DEVOLUCION', label: 'Devolución' },
];

type Props = {
  usuarios: { id: string; nombre: string }[];
  initialDesde: string;
  initialHasta: string;
  initialTipo: string;
  initialVarianteId: string;
  initialVarianteLabel: string | null;
  initialUsuarioId: string;
  initialMotivo: string;
  sucursalId: string;
  usingDefaults: boolean;
  usuarioSeleccionadoNombre: string | null;
};

export function MovimientosFilters({
  usuarios,
  initialDesde,
  initialHasta,
  initialTipo,
  initialVarianteId,
  initialVarianteLabel,
  initialUsuarioId,
  initialMotivo,
  sucursalId,
  usingDefaults,
  usuarioSeleccionadoNombre,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [motivo, setMotivo] = useState(initialMotivo);
  const motivoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRenderRef = useRef(true);
  const desdeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    desdeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (motivoDebounceRef.current) clearTimeout(motivoDebounceRef.current);
    motivoDebounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = motivo.trim();
      if (trimmed) params.set('motivo', trimmed);
      else params.delete('motivo');
      params.delete('page');
      router.replace(`/stock/movimientos?${params.toString()}`);
    }, 300);
    return () => {
      if (motivoDebounceRef.current) clearTimeout(motivoDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motivo]);

  function setParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    params.delete('page');
    const qs = params.toString();
    router.replace(qs ? `/stock/movimientos?${qs}` : '/stock/movimientos');
  }

  function limpiar() {
    setMotivo('');
    router.replace('/stock/movimientos');
  }

  function quitarFiltro(name: string) {
    setParam(name, '');
  }

  const pills: { key: string; label: string; param: string }[] = [];
  if (initialDesde) {
    pills.push({
      key: 'desde',
      label: `Desde ${initialDesde}`,
      param: 'desde',
    });
  }
  if (initialHasta) {
    pills.push({
      key: 'hasta',
      label: `Hasta ${initialHasta}`,
      param: 'hasta',
    });
  }
  if (initialTipo) {
    const t = TIPO_OPTIONS.find((o) => o.value === initialTipo);
    if (t) pills.push({ key: 'tipo', label: `Tipo: ${t.label}`, param: 'tipo' });
  }
  if (initialVarianteId && initialVarianteLabel) {
    pills.push({
      key: 'varianteId',
      label: `Variante: ${initialVarianteLabel}`,
      param: 'varianteId',
    });
  }
  if (initialUsuarioId && usuarioSeleccionadoNombre) {
    pills.push({
      key: 'usuarioId',
      label: `Usuario: ${usuarioSeleccionadoNombre}`,
      param: 'usuarioId',
    });
  }
  if (initialMotivo) {
    pills.push({
      key: 'motivo',
      label: `Motivo: "${initialMotivo}"`,
      param: 'motivo',
    });
  }

  const hayFiltros = pills.length > 0;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 rounded-md border bg-background p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="desde" className="text-xs font-medium text-muted-foreground">
            Desde
          </label>
          <Input
            id="desde"
            ref={desdeInputRef}
            type="date"
            value={initialDesde}
            onChange={(e) => setParam('desde', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="hasta" className="text-xs font-medium text-muted-foreground">
            Hasta
          </label>
          <Input
            id="hasta"
            type="date"
            value={initialHasta}
            onChange={(e) => setParam('hasta', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="tipo" className="text-xs font-medium text-muted-foreground">
            Tipo
          </label>
          <Select
            id="tipo"
            value={initialTipo}
            onChange={(e) => setParam('tipo', e.target.value)}
            aria-label="Filtrar por tipo"
          >
            {TIPO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Variante
          </label>
          <SelectorVariante
            sucursalId={sucursalId}
            selectedId={initialVarianteId}
            selectedLabel={initialVarianteLabel}
            onChange={(id) => setParam('varianteId', id)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="usuario" className="text-xs font-medium text-muted-foreground">
            Usuario
          </label>
          <SelectorUsuario
            usuarios={usuarios}
            value={initialUsuarioId}
            onChange={(id) => setParam('usuarioId', id)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="motivo" className="text-xs font-medium text-muted-foreground">
            Motivo
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="motivo"
              type="search"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="ej: Remito"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {usingDefaults && (
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" aria-hidden />
            Filtrando últimos 30 días
          </span>
        )}
        {pills.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => quitarFiltro(p.param)}
            className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-0.5 text-xs hover:bg-accent"
          >
            <span>{p.label}</span>
            <X className="h-3 w-3" aria-hidden />
          </button>
        ))}
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
    </div>
  );
}
