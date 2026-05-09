'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { abrirTurno } from '@/lib/turnos/actions';

export function AbrirTurnoForm() {
  const router = useRouter();
  const [efectivoInicial, setEfectivoInicial] = useState('');
  const [errores, setErrores] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrores([]);

    const monto = Number(efectivoInicial);
    if (Number.isNaN(monto) || monto < 0) {
      setErrores(['Ingresá un monto válido (mayor o igual a 0).']);
      return;
    }

    startTransition(async () => {
      const result = await abrirTurno({ efectivoInicial: monto });
      if (!result.ok) {
        setErrores(result.errores);
        return;
      }
      router.push('/');
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abrir turno</CardTitle>
        <CardDescription>
          Declará el efectivo inicial en caja para empezar a vender.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="efectivoInicial">Efectivo inicial</Label>
            <Input
              id="efectivoInicial"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0"
              value={efectivoInicial}
              onChange={(e) => setEfectivoInicial(e.target.value)}
              autoFocus
              disabled={pending}
            />
          </div>

          {errores.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {errores.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Abrir turno
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
