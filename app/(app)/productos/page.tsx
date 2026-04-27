import { requireAuth } from '@/lib/auth/mock';

export default async function ProductosPage() {
  await requireAuth(['admin', 'vendedor']);

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Productos</h1>
      <p className="text-sm text-muted-foreground">
        P4/P5 — Pantalla pendiente. Se implementa en Sprint 4.
      </p>
    </div>
  );
}
