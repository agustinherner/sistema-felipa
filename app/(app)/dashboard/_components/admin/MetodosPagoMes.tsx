import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DesgloseMetodo } from '@/lib/reportes';
import { METODO_COLOR, METODO_LABEL, formatMoneda } from './formato';

export function MetodosPagoMes({
  data,
  nombreMes,
}: {
  data: DesgloseMetodo[];
  nombreMes: string;
}) {
  const totalMonto = data.reduce((s, m) => s + Number(m.monto), 0);

  return (
    <Card>
      <CardHeader className="space-y-1 pb-3">
        <h3 className="text-base font-semibold">
          Ventas por método de pago — {nombreMes}
        </h3>
        <p className="text-xs text-muted-foreground">
          Cuántas ventas usaron cada método y cuánto se cobró por cada uno.
        </p>
      </CardHeader>
      <CardContent>
        {totalMonto === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin ventas en el mes todavía.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.map((m) => {
              const monto = Number(m.monto);
              const pct =
                totalMonto > 0 ? Math.round((monto / totalMonto) * 100) : 0;
              return (
                <div
                  key={m.metodo}
                  className={cn(
                    'rounded-md border p-3',
                    METODO_COLOR[m.metodo],
                  )}
                >
                  <p className="text-xs font-medium">
                    {METODO_LABEL[m.metodo]}
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {formatMoneda(m.monto)}
                  </p>
                  <p className="text-xs tabular-nums opacity-80">
                    {m.cantidad}{' '}
                    {m.cantidad === 1 ? 'venta' : 'ventas'} · {pct}%
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
