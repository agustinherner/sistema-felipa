'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { toggleUsuarioActivo } from '@/lib/usuarios/actions';

export function SwitchActivo({
  userId,
  activo,
  disabled,
  title,
}: {
  userId: string;
  activo: boolean;
  disabled?: boolean;
  title?: string;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(activo);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onChange(next: boolean) {
    if (pending) return;
    setError(null);
    setChecked(next);
    setPending(true);

    const res = await toggleUsuarioActivo({ userId, activo: next });

    if (!res.ok) {
      // Rollback visual ante rechazo del servidor (último admin, auto-desactivación, etc.)
      setChecked(!next);
      setError(res.errores[0] ?? 'No se pudo cambiar el estado.');
      setPending(false);
      return;
    }

    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled || pending}
        title={title}
        aria-label={checked ? 'Desactivar usuario' : 'Activar usuario'}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
