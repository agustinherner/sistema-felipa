import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Venta registrada',
};

type SearchParams = {
  codigo?: string;
};

export default function VentaExitoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const codigo = searchParams.codigo?.trim();
  if (!codigo) {
    redirect('/ventas/nueva');
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-12 w-12" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">¡Venta registrada!</h1>
        <p className="text-sm text-muted-foreground">
          Guardá este código por si necesitás referenciarla más tarde.
        </p>
      </div>

      <div className="rounded-lg border bg-muted/30 px-6 py-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Código de venta
        </p>
        <p className="mt-1 font-mono text-3xl font-semibold tracking-wider">
          {codigo}
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild className="sm:min-w-40">
          <Link href="/ventas/nueva">Nueva venta</Link>
        </Button>
        <Button asChild variant="outline" className="sm:min-w-40">
          <Link href="/ventas">Ver historial</Link>
        </Button>
      </div>
    </div>
  );
}
