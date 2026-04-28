import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MovimientosPagination({
  page,
  pageSize,
  total,
  searchParams,
}: {
  page: number;
  pageSize: number;
  total: number;
  searchParams: Record<string, string>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildHref(target: number): string {
    const params = new URLSearchParams(searchParams);
    if (target <= 1) params.delete('page');
    else params.set('page', String(target));
    const qs = params.toString();
    return qs ? `/stock/movimientos?${qs}` : '/stock/movimientos';
  }

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        {prevDisabled ? (
          <Button variant="outline" size="sm" disabled aria-label="Página anterior">
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm" aria-label="Página anterior">
            <Link href={buildHref(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Link>
          </Button>
        )}
        {nextDisabled ? (
          <Button variant="outline" size="sm" disabled aria-label="Página siguiente">
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm" aria-label="Página siguiente">
            <Link href={buildHref(page + 1)}>
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
