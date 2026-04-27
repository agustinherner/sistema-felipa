'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Role } from '@/lib/auth/types';

export function RoleSwitcher({ currentRole }: { currentRole: Role }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function switchTo(role: Role) {
    if (role === currentRole || pending) return;
    setPending(true);
    try {
      await fetch('/api/mock-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      router.replace('/');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-1 rounded-md border bg-muted/40 p-0.5">
      <span className="px-2 text-xs text-muted-foreground">dev</span>
      <Button
        size="sm"
        variant={currentRole === 'admin' ? 'default' : 'ghost'}
        className="h-7 px-3 text-xs"
        disabled={pending}
        onClick={() => switchTo('admin')}
      >
        Admin
      </Button>
      <Button
        size="sm"
        variant={currentRole === 'vendedor' ? 'default' : 'ghost'}
        className="h-7 px-3 text-xs"
        disabled={pending}
        onClick={() => switchTo('vendedor')}
      >
        Vendedor
      </Button>
    </div>
  );
}
