import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { obtenerConfiguracion } from '@/lib/configuracion/queries';
import { obtenerVentaDetalle } from '@/lib/ventas/queries';
import { urlWhatsappComprobante } from '@/lib/ventas/comprobante';

export const metadata = {
  title: 'Venta registrada',
};

type SearchParams = {
  codigo?: string;
  id?: string;
};

export default async function VentaExitoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const codigo = searchParams.codigo?.trim();
  const ventaId = searchParams.id?.trim();
  if (!codigo) {
    redirect('/ventas/nueva');
  }

  let turnoAbierto = false;
  let whatsappHref: string | null = null;
  if (ventaId) {
    const [venta, config] = await Promise.all([
      obtenerVentaDetalle(ventaId),
      obtenerConfiguracion(),
    ]);
    if (venta) {
      turnoAbierto =
        !venta.anulacion && !!venta.turno && venta.turno.cierreEn === null;
      if (!venta.anulacion) {
        whatsappHref = urlWhatsappComprobante(venta, {
          nombreNegocio: config.nombreNegocio,
          direccion: config.direccion,
          telefono: config.telefono,
          cuit: config.cuit,
        });
      }
    }
  }

  const anularHref = ventaId
    ? `/ventas?venta=${encodeURIComponent(ventaId)}`
    : null;

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

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 sm:w-auto sm:min-w-72"
        >
          <MessageCircle className="h-4 w-4" />
          Enviar comprobante por WhatsApp
        </a>
      )}

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild className="sm:min-w-40">
          <Link href="/ventas/nueva">Nueva venta</Link>
        </Button>
        <Button asChild variant="outline" className="sm:min-w-40">
          <Link href="/ventas">Ver historial</Link>
        </Button>
      </div>

      {turnoAbierto && anularHref && (
        <Link
          href={anularHref}
          className="text-xs text-muted-foreground underline-offset-4 hover:text-rose-700 hover:underline"
        >
          ¿Registraste algo mal? Anular esta venta
        </Link>
      )}
    </div>
  );
}
