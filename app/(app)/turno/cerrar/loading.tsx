import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton del cierre de turno: card de resumen del turno (apertura, ventas,
 * desglose por método, efectivo esperado) + form de cierre (input de efectivo
 * contado + botones).
 */
export default function CerrarTurnoLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Card: resumen del turno */}
      <Card>
        <CardHeader className="space-y-2 pb-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-64" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-md border bg-background p-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-6 w-24" />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-28 rounded-md" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card: form de cierre */}
      <Card>
        <CardHeader className="space-y-2 pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <Skeleton className="h-10 w-full sm:w-32" />
            <Skeleton className="h-10 w-full sm:w-40" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
