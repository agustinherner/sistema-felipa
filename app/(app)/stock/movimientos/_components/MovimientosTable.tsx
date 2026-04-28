import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  colorTipoMovimiento,
  etiquetaVariante,
  tipoMovimientoLabel,
} from '@/lib/stock/helpers';
import type { MovimientoListadoFila } from '@/lib/stock/queries';

const FECHA_FMT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
});
const HORA_FMT = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const MOTIVO_MAX = 60;

function truncar(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

export function MovimientosTable({
  filas,
}: {
  filas: MovimientoListadoFila[];
}) {
  return (
    <div className="rounded-md border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[88px]">Fecha</TableHead>
            <TableHead className="w-[160px]">Tipo</TableHead>
            <TableHead>Producto · Variante</TableHead>
            <TableHead className="w-[80px] text-right">Cantidad</TableHead>
            <TableHead className="w-[80px] text-right">Stock</TableHead>
            <TableHead className="w-[120px]">Usuario</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((f) => {
            const fecha = FECHA_FMT.format(f.creadoEn);
            const hora = HORA_FMT.format(f.creadoEn);
            const cantClass =
              f.cantidad > 0
                ? 'text-emerald-700'
                : f.cantidad < 0
                  ? 'text-rose-700'
                  : 'text-muted-foreground';
            const cantStr = f.cantidad > 0 ? `+${f.cantidad}` : `${f.cantidad}`;
            const colorTipo = colorTipoMovimiento(f.tipo);
            const etiqueta = etiquetaVariante({
              productoNombre: f.productoNombre,
              varianteNombre: f.varianteNombre,
              esVarianteUnicaImplicita: f.esVarianteUnicaImplicita,
            });

            return (
              <TableRow key={f.id}>
                <TableCell className="align-top">
                  <div className="flex flex-col text-xs leading-tight tabular-nums">
                    <span className="font-medium">{fecha}</span>
                    <span className="text-muted-foreground">{hora}</span>
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
                      colorTipo,
                    )}
                  >
                    {tipoMovimientoLabel(f.tipo)}
                  </span>
                </TableCell>
                <TableCell className="align-top">
                  <div className="space-y-0.5">
                    <p className="text-sm">{etiqueta}</p>
                    {f.tipo === 'VENTA' && f.ventaCodigoCorto && f.ventaId && (
                      <p className="text-xs text-muted-foreground">
                        ↳{' '}
                        <Link
                          href={`/ventas/${f.ventaId}`}
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          {f.ventaCodigoCorto}
                        </Link>
                      </p>
                    )}
                    {f.motivo && f.tipo !== 'VENTA' && (
                      <p
                        className="text-xs text-muted-foreground"
                        title={f.motivo}
                      >
                        {truncar(f.motivo, MOTIVO_MAX)}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right align-top">
                  <span className={cn('font-semibold tabular-nums', cantClass)}>
                    {cantStr}
                  </span>
                </TableCell>
                <TableCell className="text-right align-top">
                  <span className="font-medium tabular-nums">
                    {f.stockResultante}
                  </span>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  {f.usuarioNombre}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
