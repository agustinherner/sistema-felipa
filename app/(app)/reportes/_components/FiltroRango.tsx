'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Granularidad } from '@/lib/reportes';

type Props = {
  desde: string;
  hasta: string;
  granularidad: Granularidad;
};

/**
 * Filtro de rango (desde/hasta) + granularidad. Navega con searchParams.
 *
 * - desde/hasta + granularidad se aplican juntos al apretar "Aplicar". Esto
 *   evita disparar varias navigations consecutivas y deja al usuario corregir
 *   un valor antes de pegarle a la URL.
 * - El campo "Granularidad" controla SOLO el reporte 1 (ventas por período);
 *   los otros 4 reportes son idempotentes a su valor.
 * - Botón "Mes actual" como atajo: vuelve a defaults limpiando la URL.
 */
export function FiltroRango({ desde, hasta, granularidad }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [d, setD] = useState(desde);
  const [h, setH] = useState(hasta);
  const [g, setG] = useState<Granularidad>(granularidad);

  const aplicar = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('desde', d);
    params.set('hasta', h);
    params.set('g', g);
    router.push(`/reportes?${params.toString()}`);
  };

  const resetear = () => {
    router.push('/reportes');
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        aplicar();
      }}
      className="flex flex-col gap-3 rounded-md border bg-background p-4 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="reporte-desde" className="text-xs">
            Desde
          </Label>
          <Input
            id="reporte-desde"
            type="date"
            value={d}
            onChange={(e) => setD(e.target.value)}
            className="w-full sm:w-auto"
            max={h || undefined}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="reporte-hasta" className="text-xs">
            Hasta
          </Label>
          <Input
            id="reporte-hasta"
            type="date"
            value={h}
            onChange={(e) => setH(e.target.value)}
            className="w-full sm:w-auto"
            min={d || undefined}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="reporte-granularidad" className="text-xs">
          Período (ventas)
        </Label>
        <select
          id="reporte-granularidad"
          value={g}
          onChange={(e) => setG(e.target.value as Granularidad)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="dia">Día</option>
          <option value="semana">Semana (lun–dom)</option>
          <option value="mes">Mes</option>
        </select>
      </div>

      <div className="flex gap-2 sm:ml-auto">
        <Button type="submit">Aplicar</Button>
        <Button type="button" variant="outline" onClick={resetear}>
          Mes actual
        </Button>
      </div>
    </form>
  );
}
