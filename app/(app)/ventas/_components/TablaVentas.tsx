'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VentasPermissions } from '@/lib/ventas/permissions';
import type {
  MetodoPagoItem,
  MetodoPagoVenta,
  VentaListItem,
} from '@/lib/ventas/queries';
import type { NegocioInfo } from '@/lib/ventas/comprobante';
import { DetalleVentaModal } from './DetalleVentaModal';

const FECHA_FMT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
});
const HORA_FMT = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const METODO_ABREV: Record<MetodoPagoVenta, string> = {
  EFECTIVO: 'EF',
  TRANSFERENCIA: 'TR',
  DEBITO: 'DE',
  CREDITO: 'CR',
};

const METODO_COLOR: Record<MetodoPagoVenta, string> = {
  EFECTIVO: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  TRANSFERENCIA: 'border-sky-200 bg-sky-50 text-sky-700',
  DEBITO: 'border-violet-200 bg-violet-50 text-violet-700',
  CREDITO: 'border-amber-200 bg-amber-50 text-amber-800',
};

function formatMoneda(n: number): string {
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

function etiquetaDescuento(v: VentaListItem): string {
  if (v.descuentoTipo === 'PORCENTAJE' && v.descuentoValor !== null) {
    // El valor ya viene en %, con hasta 2 decimales. Mostrar enteros si es entero.
    const n = v.descuentoValor;
    const txt = Number.isInteger(n) ? n.toString() : n.toFixed(2);
    return `${txt}% dto`;
  }
  if (v.descuentoTipo === 'MONTO' && v.descuentoValor !== null) {
    return `${formatMoneda(v.descuentoValor)} dto`;
  }
  // Legacy: aplicaDescuento true pero descuentoTipo null (ventas pre-cambio).
  return 'dto';
}

function formatFechaHora(iso: string): { fecha: string; hora: string } {
  const d = new Date(iso);
  return { fecha: FECHA_FMT.format(d), hora: HORA_FMT.format(d) };
}

function PagoChips({ metodos }: { metodos: MetodoPagoItem[] }) {
  if (metodos.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {metodos.map((m, i) => (
        <span
          key={`${m.metodo}-${i}`}
          className={cn(
            'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium',
            METODO_COLOR[m.metodo],
          )}
          title={`${m.metodo} ${formatMoneda(m.monto)}`}
        >
          <span className="font-semibold">{METODO_ABREV[m.metodo]}</span>
          <span className="tabular-nums">{formatMoneda(m.monto)}</span>
        </span>
      ))}
    </div>
  );
}

type Props = {
  ventas: VentaListItem[];
  hayMas: boolean;
  page: number;
  permissions: VentasPermissions;
  currentUserId: string;
  negocio: NegocioInfo;
  diasDevolucion: number;
};

export function TablaVentas({
  ventas,
  hayMas,
  page,
  permissions,
  currentUserId,
  negocio,
  diasDevolucion,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ventaParam = searchParams.get('venta');
  const [ventaSeleccionada, setVentaSeleccionada] = useState<string | null>(
    ventaParam,
  );

  useEffect(() => {
    if (ventaParam && ventaParam !== ventaSeleccionada) {
      setVentaSeleccionada(ventaParam);
    }
  }, [ventaParam, ventaSeleccionada]);

  function pagina(n: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (n <= 1) params.delete('page');
    else params.set('page', String(n));
    const qs = params.toString();
    router.push(qs ? `/ventas?${qs}` : '/ventas');
  }

  if (ventas.length === 0) {
    return (
      <div className="rounded-md border bg-background p-10 text-center">
        <p className="text-sm text-muted-foreground">
          No hay ventas para los filtros seleccionados.
        </p>
      </div>
    );
  }

  const showVendedor = permissions.verTodas;

  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Código</TableHead>
              <TableHead className="w-[88px]">Fecha</TableHead>
              {showVendedor && (
                <TableHead className="hidden md:table-cell w-[140px]">
                  Vendedor
                </TableHead>
              )}
              <TableHead className="hidden md:table-cell">Pago</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventas.map((v) => {
              const { fecha, hora } = formatFechaHora(v.creadaEn);
              return (
                <TableRow
                  key={v.id}
                  className={cn(
                    'cursor-pointer',
                    v.anulada && 'bg-rose-50/40 text-muted-foreground',
                  )}
                  onClick={() => setVentaSeleccionada(v.id)}
                >
                  <TableCell className="align-top text-sm">
                    <div className="flex flex-col gap-1">
                      <span
                        className={cn(
                          'font-mono',
                          v.anulada && 'line-through',
                        )}
                      >
                        {v.codigoCorto}
                      </span>
                      {v.anulada && (
                        <span className="inline-flex w-fit items-center rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                          Anulada
                        </span>
                      )}
                      {!v.anulada && v.estadoDevolucion === 'PARCIAL' && (
                        <span className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                          Dev. parcial
                        </span>
                      )}
                      {!v.anulada && v.estadoDevolucion === 'TOTAL' && (
                        <span className="inline-flex w-fit items-center rounded-full border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                          Devuelta
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div
                      className={cn(
                        'flex flex-col text-xs leading-tight tabular-nums',
                        v.anulada && 'line-through',
                      )}
                    >
                      <span className="font-medium">{fecha}</span>
                      <span className="text-muted-foreground">{hora}</span>
                    </div>
                  </TableCell>
                  {showVendedor && (
                    <TableCell
                      className={cn(
                        'hidden md:table-cell align-top text-sm text-muted-foreground',
                        v.anulada && 'line-through',
                      )}
                    >
                      {v.usuarioNombre}
                    </TableCell>
                  )}
                  <TableCell
                    className={cn(
                      'hidden md:table-cell align-top',
                      v.anulada && 'opacity-60',
                    )}
                  >
                    <PagoChips metodos={v.metodosPago} />
                  </TableCell>
                  <TableCell className="text-right align-top">
                    <div
                      className={cn(
                        'flex flex-col items-end gap-0.5',
                        v.anulada && 'line-through',
                      )}
                    >
                      {v.aplicaDescuento ? (
                        <>
                          <span className="text-xs text-muted-foreground line-through tabular-nums">
                            {formatMoneda(v.subtotal)}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatMoneda(v.total)}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                            {etiquetaDescuento(v)}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold tabular-nums">
                          {formatMoneda(v.total)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Página {page}
          {ventas.length > 0 && (
            <>
              {' · '}
              {ventas.length} venta{ventas.length === 1 ? '' : 's'}
            </>
          )}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => pagina(page - 1)}
          >
            ← Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hayMas}
            onClick={() => pagina(page + 1)}
          >
            Siguiente →
          </Button>
        </div>
      </div>

      <DetalleVentaModal
        ventaId={ventaSeleccionada}
        onClose={() => {
          setVentaSeleccionada(null);
          if (searchParams.has('venta')) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('venta');
            const qs = params.toString();
            router.replace(qs ? `/ventas?${qs}` : '/ventas');
          }
        }}
        currentUserId={currentUserId}
        esAdmin={permissions.verTodas}
        negocio={negocio}
        diasDevolucion={diasDevolucion}
      />
    </div>
  );
}
