import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { TurnoMesItem } from '@/lib/turnos/queries';

const FECHA_FMT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
});
const HORA_FMT = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatMoneda(n: number): string {
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

function formatDiferencia(d: number | null): {
  texto: string;
  className: string;
} {
  if (d === null) return { texto: '—', className: 'text-muted-foreground' };
  if (d >= 0) {
    return {
      texto: formatMoneda(d),
      className: 'text-emerald-700',
    };
  }
  return {
    texto: `-${formatMoneda(Math.abs(d))}`,
    className: 'text-red-700',
  };
}

type Props = {
  nombreMes: string;
  turnos: TurnoMesItem[];
};

export function TablaTurnosMes({ nombreMes, turnos }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Turnos de {nombreMes}</h2>

      {turnos.length === 0 ? (
        <div className="rounded-md border bg-background p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay turnos cerrados este mes.
          </p>
        </div>
      ) : (
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Fecha</TableHead>
                <TableHead className="hidden md:table-cell w-[140px]">
                  Horario
                </TableHead>
                <TableHead className="w-[80px] text-right">Ventas</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="hidden md:table-cell text-right">
                  Diferencia
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {turnos.map((t) => {
                const apertura = new Date(t.aperturaEn);
                const cierre = new Date(t.cierreEn);
                const dif = formatDiferencia(t.diferencia);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="tabular-nums">
                      {FECHA_FMT.format(apertura)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell tabular-nums text-muted-foreground">
                      {HORA_FMT.format(apertura)} – {HORA_FMT.format(cierre)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {t.cantidadVentas}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoneda(t.totalVendido)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'hidden md:table-cell text-right font-medium tabular-nums',
                        dif.className,
                      )}
                    >
                      {dif.texto}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
