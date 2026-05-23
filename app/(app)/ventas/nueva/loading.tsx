import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton de "nueva venta": header + búsqueda + tabla del carrito + panel de
 * métodos de pago a la derecha. En mobile colapsa a una sola columna.
 */
export default function NuevaVentaLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        {/* Columna izquierda: búsqueda + carrito */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />

          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b py-2 last:border-b-0"
                >
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-7" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: panel de métodos de pago + total */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-7 w-32" />
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
