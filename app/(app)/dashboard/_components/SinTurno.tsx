import Link from 'next/link';
import { Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function SinTurno() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Clock className="h-7 w-7 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">No tenés un turno abierto</h2>
          <p className="text-sm text-muted-foreground">
            Abrí un turno para empezar a vender.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/turno/abrir">Abrir turno</Link>
        </Button>
        <div
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          title="Necesitás un turno abierto para vender"
        >
          <Lock className="h-3 w-3" />
          <span>Nueva venta — necesitás un turno abierto</span>
        </div>
      </CardContent>
    </Card>
  );
}
