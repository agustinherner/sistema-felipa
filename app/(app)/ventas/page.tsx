import { requireAuth } from '@/lib/auth/mock';

export default async function VentasPage() {
  await requireAuth(['admin', 'vendedor']);

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Ventas</h1>
      <p className="text-sm text-muted-foreground">
        P3 — Pantalla pendiente. Se implementa en Sprint 7.
      </p>
    </div>
  );
}
