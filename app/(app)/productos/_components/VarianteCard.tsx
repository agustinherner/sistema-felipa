'use client';

import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { VarianteFormState } from '@/lib/productos/helpers';

export type { VarianteFormState };

type Props = {
  index: number;
  variante: VarianteFormState;
  mostrarStockInicial: boolean;
  puedeEliminar: boolean;
  errores?: { nombre?: string; codigoBarras?: string };
  onChange: (next: VarianteFormState) => void;
  onRemove: () => void;
  onMarkupSugerido: () => void;
  disabled?: boolean;
};

export function VarianteCard({
  index,
  variante,
  mostrarStockInicial,
  puedeEliminar,
  errores,
  onChange,
  onRemove,
  onMarkupSugerido,
  disabled,
}: Props) {
  return (
    <div className="rounded-md border bg-background p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Variante {index + 1}
          </span>
          {variante.precioPropio && (
            <Badge
              variant="outline"
              className="border-amber-500/60 bg-amber-50 text-amber-900"
            >
              Precio propio
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={!puedeEliminar || disabled}
          aria-label={`Eliminar variante ${index + 1}`}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Nombre / descriptor
          </label>
          <Input
            value={variante.nombre}
            onChange={(e) => onChange({ ...variante, nombre: e.target.value })}
            placeholder="Ej: Rojo, Talle M, 250ml"
            maxLength={120}
            disabled={disabled}
            className={errores?.nombre ? 'border-destructive' : undefined}
          />
          {errores?.nombre && (
            <p className="text-xs text-destructive">{errores.nombre}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Código de barras{' '}
            <span className="text-muted-foreground">(opcional)</span>
          </label>
          <Input
            value={variante.codigoBarras}
            onChange={(e) =>
              onChange({ ...variante, codigoBarras: e.target.value })
            }
            placeholder="Ej: 7790001000011"
            maxLength={64}
            disabled={disabled}
            className={errores?.codigoBarras ? 'border-destructive' : undefined}
          />
          {errores?.codigoBarras && (
            <p className="text-xs text-destructive">{errores.codigoBarras}</p>
          )}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          checked={variante.precioPropio}
          onChange={(e) =>
            onChange({
              ...variante,
              precioPropio: e.target.checked,
              ...(e.target.checked ? {} : { precio: '', costo: '' }),
            })
          }
          disabled={disabled}
        />
        <span>Esta variante tiene precio propio (override)</span>
      </label>

      {variante.precioPropio && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Costo override</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={variante.costo}
              onChange={(e) =>
                onChange({ ...variante, costo: e.target.value })
              }
              onBlur={onMarkupSugerido}
              placeholder="0.00"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Precio override</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={variante.precio}
              onChange={(e) =>
                onChange({ ...variante, precio: e.target.value })
              }
              placeholder="0.00"
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {mostrarStockInicial && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Stock inicial</label>
          <Input
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            value={variante.stockInicial}
            onChange={(e) =>
              onChange({ ...variante, stockInicial: e.target.value })
            }
            placeholder="0"
            disabled={disabled}
            className="max-w-xs"
          />
        </div>
      )}
    </div>
  );
}
