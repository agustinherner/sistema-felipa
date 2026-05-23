import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton del dashboard: imita el saludo + card de "Turno actual" (con sus
 * 4 stats) + tabla de turnos del mes. La sección "Negocio" (cards de admin)
 * se aproxima con una grilla de 4 cards.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header: saludo */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Card "Turno actual" */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-md border bg-background p-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-6 w-24" />
              </div>
            ))}
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de turnos del mes */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-56" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sección "Negocio" (admin) — grilla de cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2 pb-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-9/12" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
