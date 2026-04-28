import Link from 'next/link';
import { ArrowLeft, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requireAuth } from '@/lib/auth/mock';
import { prisma } from '@/lib/db';
import { IngresoForm } from './_components/IngresoForm';

export default async function IngresoStockPage() {
  await requireAuth(['ADMIN']);

  const sucursal = await prisma.sucursal.findFirst({
    where: { activa: true },
    orderBy: { creadaEn: 'asc' },
    select: { id: true, nombre: true },
  });

  if (!sucursal) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Ingreso de mercadería</h1>
        <p className="text-sm text-destructive">
          No hay sucursales activas configuradas.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/stock"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
            aria-label="Volver a stock"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-semibold">Ingreso de mercadería</h1>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/stock/movimientos">
            <History className="h-4 w-4" />
            Ver historial
          </Link>
        </Button>
      </div>

      <IngresoForm sucursalId={sucursal.id} sucursalNombre={sucursal.nombre} />
    </div>
  );
}
