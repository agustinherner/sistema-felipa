import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Fallback genérico para todas las rutas dentro del grupo (app).
 * Las rutas con loading.tsx propio (dashboard, turno/cerrar, ventas/nueva)
 * lo sobreescriben con un skeleton más fiel a su layout.
 */
export default function AppGroupLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-10/12" />
          <Skeleton className="h-4 w-9/12" />
        </CardContent>
      </Card>
    </div>
  );
}
