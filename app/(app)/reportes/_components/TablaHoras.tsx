import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { HorasPorVendedorFila } from '@/lib/reportes';
import { CardReporte } from './CardReporte';
import { sufijoRango } from './csv';
import { formatEntero } from './formato';

type Props = {
  data: HorasPorVendedorFila[];
  desde: string;
  hasta: string;
};

export function TablaHoras({ data, desde, hasta }: Props) {
  const totalTurnos = data.reduce((s, r) => s + r.cantidadTurnos, 0);
  const totalHoras = data.reduce((s, r) => s + Number(r.horasTotales), 0);

  const filename = `reporte-horas-trabajadas-${sufijoRango(desde, hasta)}.csv`;
  const header = ['Vendedor', 'Turnos cerrados', 'Horas totales', 'Promedio por turno'];
  const rows = data.map((v) => [
    v.vendedor,
    v.cantidadTurnos,
    v.horasTotales,
    v.promedioHoras,
  ]);

  return (
    <CardReporte
      titulo="Horas trabajadas por vendedor"
      descripcion="Sólo turnos cerrados (cierreEn dentro del rango). Cada turno se contabiliza por su diferencia cierre − apertura."
      csv={{ filename, header, rows }}
    >
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No se cerraron turnos en el rango.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Turnos</TableHead>
                <TableHead className="text-right">Horas totales</TableHead>
                <TableHead className="text-right">Promedio / turno</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((v) => (
                <TableRow key={v.usuarioId}>
                  <TableCell className="font-medium">{v.vendedor}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEntero(v.cantidadTurnos)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {v.horasTotales} h
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {v.promedioHoras} h
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 bg-muted/40 font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEntero(totalTurnos)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {totalHoras.toFixed(1)} h
                </TableCell>
                <TableCell className="text-right" />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </CardReporte>
  );
}
