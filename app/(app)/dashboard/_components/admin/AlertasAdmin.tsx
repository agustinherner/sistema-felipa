import Link from 'next/link';
import { AlertTriangle, Clock, PackageX, FileQuestion } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Alertas } from '@/lib/reportes';
import { HORA_FMT, FECHA_FMT } from './formato';

export function AlertasAdmin({ data }: { data: Alertas }) {
  const bloques: Array<{
    key: string;
    titulo: string;
    icon: React.ReactNode;
    contenido: React.ReactNode;
  }> = [];

  if (data.turnosLargos.length > 0) {
    bloques.push({
      key: 'turnos',
      titulo: `Turnos abiertos hace >12 h (${data.turnosLargos.length})`,
      icon: <Clock className="h-4 w-4 text-amber-600" />,
      contenido: (
        <ul className="space-y-1.5">
          {data.turnosLargos.map((t) => {
            const apertura = new Date(t.aperturaEn);
            return (
              <li key={t.id} className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{t.vendedor}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {FECHA_FMT.format(apertura)} {HORA_FMT.format(apertura)} ·{' '}
                  {t.horasAbierto.toFixed(1)} h
                </span>
              </li>
            );
          })}
        </ul>
      ),
    });
  }

  if (data.stockNegativo.length > 0) {
    bloques.push({
      key: 'stock',
      titulo: `Stock negativo (${data.stockNegativo.length})`,
      icon: <PackageX className="h-4 w-4 text-red-600" />,
      contenido: (
        <ul className="space-y-1.5">
          {data.stockNegativo.map((s) => (
            <li
              key={s.varianteId}
              className="flex items-baseline justify-between gap-3"
            >
              <span className="font-medium truncate">
                {s.productoNombre}
                {s.varianteNombre && s.varianteNombre !== s.productoNombre ? (
                  <span className="text-muted-foreground">
                    {' '}
                    · {s.varianteNombre}
                  </span>
                ) : null}
              </span>
              <span className="tabular-nums text-red-700 font-semibold">
                {s.cantidad}
              </span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (data.productosIncompletos.length > 0) {
    bloques.push({
      key: 'incompletos',
      titulo: `Productos incompletos (${data.productosIncompletos.length})`,
      icon: <FileQuestion className="h-4 w-4 text-sky-700" />,
      contenido: (
        <ul className="space-y-1.5">
          {data.productosIncompletos.map((p) => (
            <li key={p.productoId}>
              <Link
                href={`/productos/${p.productoId}/editar`}
                className="font-medium text-sky-700 hover:underline"
              >
                {p.nombre}
              </Link>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (bloques.length === 0) return null;

  return (
    <Card>
      <CardHeader className="space-y-1 pb-3">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Alertas
        </h3>
        <p className="text-xs text-muted-foreground">
          Cosas que pueden necesitar tu atención.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {bloques.map((b) => (
          <div key={b.key}>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              {b.icon}
              {b.titulo}
            </p>
            <div className="rounded-md border bg-background px-3 py-2 text-sm">
              {b.contenido}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
