import { requireAuth } from '@/lib/auth/mock';

export default async function DashboardPage() {
  await requireAuth(['admin']);

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        P7 — Pantalla pendiente. Se implementa en Sprint 8.
      </p>
    </div>
  );
}
