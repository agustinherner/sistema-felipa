'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { etiquetaVariante } from '@/lib/stock/helpers';

export type LineaState = {
  varianteId: string;
  productoNombre: string;
  varianteNombre: string;
  codigoBarras: string | null;
  esVarianteUnicaImplicita: boolean;
  cantidad: number;
};

type Props = {
  linea: LineaState;
  disabled?: boolean;
  onCantidadChange: (cantidad: number) => void;
  onRemove: () => void;
};

export function LineaIngreso({
  linea,
  disabled,
  onCantidadChange,
  onRemove,
}: Props) {
  const label = etiquetaVariante({
    productoNombre: linea.productoNombre,
    varianteNombre: linea.varianteNombre,
    esVarianteUnicaImplicita: linea.esVarianteUnicaImplicita,
  });

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === '') {
      onCantidadChange(0);
      return;
    }
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return;
    onCantidadChange(Math.max(0, n));
  }

  function onBlur() {
    if (linea.cantidad < 1) onCantidadChange(1);
  }

  return (
    <tr className="border-t">
      <td className="px-3 py-2">
        <p className="font-medium">{label}</p>
        {linea.codigoBarras && (
          <p className="text-xs tabular-nums text-muted-foreground">
            {linea.codigoBarras}
          </p>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        <Input
          type="number"
          inputMode="numeric"
          step={1}
          min={1}
          value={linea.cantidad === 0 ? '' : String(linea.cantidad)}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className="ml-auto h-9 w-20 text-right tabular-nums"
          aria-label={`Cantidad para ${label}`}
        />
      </td>
      <td className="px-3 py-2 text-right">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Quitar línea ${label}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
