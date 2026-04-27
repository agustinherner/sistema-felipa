import { requireAuth } from '@/lib/auth/mock';

export default async function ConfiguracionPage() {
  await requireAuth(['admin']);

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Configuración</h1>
      <p className="text-sm text-muted-foreground">
        P10 — Pantalla pendiente. Se implementa en Sprint 9.
      </p>
    </div>
  );
}
