'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, LogOut, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ResumenTurnoAbierto, RetiroTurno } from '@/lib/turnos/queries';
import { RetirarCajaModal } from './RetirarCajaModal';

const HORA_FMT = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatMoneda(n: number): string {
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

type StatProps = {
  label: string;
  value: string;
  emphasis?: boolean;
};

function Stat({ label, value, emphasis }: StatProps) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 tabular-nums',
          emphasis ? 'text-xl font-semibold' : 'text-lg font-medium',
        )}
      >
        {value}
      </p>
    </div>
  );
}

const METODO_COLOR = {
  efectivo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  transferencia: 'border-sky-200 bg-sky-50 text-sky-700',
  debito: 'border-violet-200 bg-violet-50 text-violet-700',
  credito: 'border-amber-200 bg-amber-50 text-amber-800',
} as const;

const METODO_LABEL = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  debito: 'Débito',
  credito: 'Crédito',
} as const;

type MetodoKey = keyof typeof METODO_COLOR;

export function ResumenTurno({
  resumen,
  retiros,
}: {
  resumen: ResumenTurnoAbierto;
  retiros: RetiroTurno[];
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const apertura = new Date(resumen.aperturaEn);
  const horaApertura = HORA_FMT.format(apertura);

  const metodos: MetodoKey[] = [
    'efectivo',
    'transferencia',
    'debito',
    'credito',
  ];
  const metodosVisibles = metodos.filter(
    (m) => resumen.ventasPorMetodo[m] > 0,
  );

  const tieneRetiros = resumen.totalRetiros > 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
          <div>
            <h2 className="text-lg font-semibold">Turno actual</h2>
            <p className="text-sm text-muted-foreground">
              Abierto desde las {horaApertura}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Abierto
          </span>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              label="Efectivo inicial"
              value={formatMoneda(resumen.efectivoInicialDeclarado)}
            />
            <Stat label="Ventas" value={String(resumen.cantidadVentas)} />
            <Stat
              label="Total vendido"
              value={formatMoneda(resumen.totalVendido)}
              emphasis
            />
            <Stat
              label="Efectivo esperado"
              value={formatMoneda(resumen.efectivoEsperado)}
              emphasis
            />
          </div>

          {tieneRetiros && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs tabular-nums text-muted-foreground">
              <span className="font-medium text-foreground">Caja: </span>
              Inicial {formatMoneda(resumen.efectivoInicialDeclarado)}
              {' + '}Ventas efectivo{' '}
              {formatMoneda(resumen.ventasPorMetodo.efectivo)}
              {' − '}Retiros {formatMoneda(resumen.totalRetiros)}
              {' = '}
              <span className="font-medium text-foreground">
                Esperado {formatMoneda(resumen.efectivoEsperado)}
              </span>
            </div>
          )}

          {metodosVisibles.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Por método de pago
              </p>
              <div className="flex flex-wrap gap-2">
                {metodosVisibles.map((m) => (
                  <span
                    key={m}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium',
                      METODO_COLOR[m],
                    )}
                  >
                    <span>{METODO_LABEL[m]}</span>
                    <span className="tabular-nums">
                      {formatMoneda(resumen.ventasPorMetodo[m])}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="sm:flex-1">
              <Link href="/ventas/nueva">
                <Plus className="h-4 w-4" />
                Nueva venta
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="sm:flex-1"
              onClick={() => setModalOpen(true)}
            >
              <ArrowDownToLine className="h-4 w-4" />
              Retirar de caja
            </Button>
            <Button asChild variant="outline" className="sm:flex-1">
              <Link href="/turno/cerrar">
                <LogOut className="h-4 w-4" />
                Cerrar turno
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {retiros.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-base font-semibold">Retiros de caja</h3>
            <p className="text-xs text-muted-foreground">
              {retiros.length}{' '}
              {retiros.length === 1 ? 'retiro' : 'retiros'} en este turno por un
              total de{' '}
              <span className="font-medium text-foreground">
                {formatMoneda(resumen.totalRetiros)}
              </span>
              .
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y rounded-md border bg-background">
              {retiros.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.motivo}</p>
                    <p className="text-xs text-muted-foreground">
                      {HORA_FMT.format(new Date(r.creadoEn))} ·{' '}
                      {r.usuarioNombre}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums text-red-600">
                    −{formatMoneda(r.monto)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <RetirarCajaModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
