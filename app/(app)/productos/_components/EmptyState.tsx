import Link from 'next/link';
import { Package, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Variant =
  | { kind: 'sin-productos'; isAdmin: boolean }
  | { kind: 'sin-resultados' };

export function EmptyState(props: Variant) {
  if (props.kind === 'sin-productos') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-background py-16 text-center">
        <Package className="h-10 w-10 text-muted-foreground" aria-hidden />
        <p className="text-base font-medium">
          No hay productos cargados todavía.
        </p>
        {props.isAdmin && (
          <Link
            href="/productos/nuevo"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Cargar el primer producto →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-background py-16 text-center">
      <SearchX className="h-10 w-10 text-muted-foreground" aria-hidden />
      <p className="text-base font-medium">
        No se encontraron productos con esos filtros.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href="/productos">Limpiar filtros</Link>
      </Button>
    </div>
  );
}
