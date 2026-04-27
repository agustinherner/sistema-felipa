import { requireAuth } from '@/lib/auth/mock';

export default async function StockPage() {
  await requireAuth(['admin']);

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Stock</h1>
      <p className="text-sm text-muted-foreground">
        P6 — Pantalla pendiente. Se implementa en Sprint 5.
      </p>
    </div>
  );
}
