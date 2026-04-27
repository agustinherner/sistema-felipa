'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Role } from '@/lib/auth/types';

export default function LoginPage() {
  const router = useRouter();
  const [pending, setPending] = useState<Role | null>(null);

  async function loginAs(role: Role) {
    setPending(role);
    try {
      const res = await fetch('/api/mock-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        setPending(null);
        return;
      }
      router.replace('/');
      router.refresh();
    } catch {
      setPending(null);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <p className="text-xs text-muted-foreground">
          Login mock — Sprint 3 traerá login real
        </p>
        <CardTitle className="text-2xl">Sistema Felipa</CardTitle>
        <CardDescription>Elegí con qué rol querés ingresar</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button
          size="lg"
          onClick={() => loginAs('admin')}
          disabled={pending !== null}
        >
          {pending === 'admin' ? 'Ingresando…' : 'Entrar como Admin (Felipa)'}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => loginAs('vendedor')}
          disabled={pending !== null}
        >
          {pending === 'vendedor'
            ? 'Ingresando…'
            : 'Entrar como Vendedor (Andrea)'}
        </Button>
      </CardContent>
    </Card>
  );
}
