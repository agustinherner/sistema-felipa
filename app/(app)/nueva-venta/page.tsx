import { requireAuth } from '@/lib/auth/mock';

export default async function NuevaVentaPage() {
  await requireAuth(['admin', 'vendedor']);

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Nueva venta</h1>
      <p className="text-sm text-muted-foreground">
        P2 — Pantalla pendiente. Se implementa en Sprint 6.
      </p>
    </div>
  );
}
