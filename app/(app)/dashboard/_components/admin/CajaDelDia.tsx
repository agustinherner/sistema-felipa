import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CajaDelDia as CajaDelDiaData } from '@/lib/reportes';
import {
  FECHA_FMT,
  HORA_FMT,
  METODO_COLOR,
  METODO_LABEL,
  formatMoneda,
  formatMonedaConSigno,
} from './formato';

export function CajaDelDia({ data }: { data: CajaDelDiaData }) {
  const metodosConActividad = data.porMetodo.filter((m) => m.cantidad > 0);

  return (
    <Card>
      <CardHeader className="space-y-1 pb-3">
        <h3 className="text-base font-semibold">Caja del día</h3>
        <p className="text-xs text-muted-foreground">
          Ventas registradas hoy en hora argentina.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border bg-background p-3">
            <p className="text-xs text-muted-foreground">Total vendido</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatMoneda(data.totalVendido)}
            </p>
          </div>
          <div className="rounded-md border bg-background p-3">
            <p className="text-xs text-muted-foreground">Ventas</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {data.cantidadVentas}
            </p>
          </div>
        </div>

        {metodosConActividad.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Por método de pago
            </p>
            <div className="flex flex-wrap gap-2">
              {metodosConActividad.map((m) => (
                <span
                  key={m.metodo}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium',
                    METODO_COLOR[m.metodo],
                  )}
                >
                  <span>{METODO_LABEL[m.metodo]}</span>
                  <span className="tabular-nums">{formatMoneda(m.monto)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {data.cierresHoy.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Cierres de hoy ({data.cierresHoy.length})
            </p>
            <ul className="divide-y rounded-md border bg-background">
              {data.cierresHoy.map((c) => {
                const dif = c.diferencia !== null ? Number(c.diferencia) : null;
                const hayDif = dif !== null && Math.abs(dif) >= 0.01;
                return (
                  <li
                    key={c.turnoId}
                    className={cn(
                      'flex items-center justify-between gap-3 px-3 py-2 text-sm',
                      hayDif && 'bg-amber-50/60',
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.vendedor}</p>
                      <p className="text-xs text-muted-foreground">
                        {HORA_FMT.format(new Date(c.aperturaEn))} –{' '}
                        {HORA_FMT.format(new Date(c.cierreEn))} ·{' '}
                        {formatMoneda(c.totalVendido)}
                      </p>
                    </div>
                    {dif !== null && (
                      <p
                        className={cn(
                          'shrink-0 text-sm font-semibold tabular-nums',
                          hayDif
                            ? dif > 0
                              ? 'text-emerald-700'
                              : 'text-red-700'
                            : 'text-muted-foreground',
                        )}
                      >
                        {hayDif ? formatMonedaConSigno(dif) : formatMoneda(0)}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {data.turnosAbiertos.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Turnos abiertos ({data.turnosAbiertos.length})
            </p>
            <ul className="divide-y rounded-md border bg-background">
              {data.turnosAbiertos.map((t) => {
                const apertura = new Date(t.aperturaEn);
                return (
                  <li
                    key={t.turnoId}
                    className={cn(
                      'flex items-center justify-between gap-3 px-3 py-2 text-sm',
                      t.largo && 'bg-red-50/60',
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{t.vendedor}</p>
                      <p className="text-xs text-muted-foreground">
                        Abierto desde {FECHA_FMT.format(apertura)}{' '}
                        {HORA_FMT.format(apertura)} ·{' '}
                        {t.horasAbierto.toFixed(1)} h
                      </p>
                    </div>
                    {t.largo && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                        <AlertTriangle className="h-3 w-3" />
                        &gt;12 h
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {data.cantidadVentas === 0 &&
          data.cierresHoy.length === 0 &&
          data.turnosAbiertos.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Sin actividad registrada hoy.
            </p>
          )}
      </CardContent>
    </Card>
  );
}
