import { requireAuth } from '@/lib/auth/mock';

export default async function UsuariosPage() {
  await requireAuth(['admin']);

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Usuarios</h1>
      <p className="text-sm text-muted-foreground">
        P9 — Pantalla pendiente. Se implementa en Sprint 3.
      </p>
    </div>
  );
}
