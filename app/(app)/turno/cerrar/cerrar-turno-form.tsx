'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { cerrarTurno } from '@/lib/turnos/actions';

type Props = {
  turnoAperturaEn: string;
  efectivoInicial: number;
  cantidadVentas: number;
  montosPorMetodo: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
  };
  totalVendido: number;
  efectivoEsperado: number;
  esTurnoOlvidado: boolean;
  horasAbierto: number;
};

const fmtMoneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
});

function formatApertura(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} ${hh}:${min}`;
}

function formatDuracion(horas: number): string {
  const totalMinutos = Math.max(0, Math.floor(horas * 60));
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  return `${h}h ${m}m`;
}

function formatLocalDateTime(d: Date): string {
  // YYYY-MM-DDTHH:mm en zona local — formato requerido por <input type="datetime-local">.
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function CerrarTurnoForm({
  turnoAperturaEn,
  efectivoInicial,
  cantidadVentas,
  montosPorMetodo,
  totalVendido,
  efectivoEsperado,
  esTurnoOlvidado,
  horasAbierto,
}: Props) {
  const router = useRouter();
  const [efectivoContado, setEfectivoContado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [cierreEnLocal, setCierreEnLocal] = useState(() =>
    formatLocalDateTime(new Date()),
  );
  const [errores, setErrores] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const aperturaDate = useMemo(() => new Date(turnoAperturaEn), [turnoAperturaEn]);

  const diferencia = useMemo(() => {
    if (efectivoContado.trim() === '') return null;
    const contado = Number(efectivoContado);
    if (Number.isNaN(contado)) return null;
    return contado - efectivoEsperado;
  }, [efectivoContado, efectivoEsperado]);

  const sinVentas = cantidadVentas === 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrores([]);

    const contado = Number(efectivoContado);
    if (efectivoContado === '' || Number.isNaN(contado) || contado < 0) {
      setErrores(['Ingresá un efectivo contado válido (mayor o igual a 0).']);
      return;
    }

    let cierreEnOverride: Date | undefined;
    if (esTurnoOlvidado) {
      const parsed = new Date(cierreEnLocal);
      if (Number.isNaN(parsed.getTime())) {
        setErrores(['La fecha de cierre no es válida.']);
        return;
      }
      if (parsed < aperturaDate) {
        setErrores(['La fecha de cierre no puede ser anterior a la apertura.']);
        return;
      }
      if (parsed > new Date()) {
        setErrores(['La fecha de cierre no puede ser futura.']);
        return;
      }
      cierreEnOverride = parsed;
    }

    startTransition(async () => {
      const result = await cerrarTurno({
        efectivoContado: contado,
        observaciones: observaciones.trim() || undefined,
        cierreEnOverride,
      });
      if (!result.ok) {
        setErrores(result.errores);
        return;
      }
      router.push('/');
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Resumen */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del turno</CardTitle>
          <CardDescription>Apertura {formatApertura(turnoAperturaEn)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Duración" value={formatDuracion(horasAbierto)} />
          <Row
            label="Efectivo inicial declarado"
            value={fmtMoneda.format(efectivoInicial)}
          />
          <Separator />
          <Row label="Cantidad de ventas" value={String(cantidadVentas)} />
          {sinVentas ? (
            <p className="text-muted-foreground">Sin ventas en este turno.</p>
          ) : (
            <>
              <Row
                label="Efectivo"
                value={fmtMoneda.format(montosPorMetodo.efectivo)}
              />
              <Row
                label="Transferencia"
                value={fmtMoneda.format(montosPorMetodo.transferencia)}
              />
              <Row label="Débito" value={fmtMoneda.format(montosPorMetodo.debito)} />
              <Row label="Crédito" value={fmtMoneda.format(montosPorMetodo.credito)} />
              <Separator />
              <Row
                label="Total vendido"
                value={fmtMoneda.format(totalVendido)}
                strong
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Cierre */}
      <Card>
        <CardHeader>
          <CardTitle>Cierre de caja</CardTitle>
          <CardDescription>
            Contá el efectivo en caja y registralo para cerrar el turno.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {esTurnoOlvidado && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Turno olvidado</AlertTitle>
                <AlertDescription>
                  Este turno está abierto desde hace {formatDuracion(horasAbierto)}.
                  Ajustá la fecha y hora de cierre si corresponde.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Efectivo esperado</Label>
              <Input
                type="text"
                value={fmtMoneda.format(efectivoEsperado)}
                readOnly
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="efectivoContado">Efectivo contado</Label>
              <Input
                id="efectivoContado"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0"
                value={efectivoContado}
                onChange={(e) => setEfectivoContado(e.target.value)}
                autoFocus
                disabled={pending}
              />
            </div>

            <div className="space-y-1">
              <Label>Diferencia</Label>
              <DiferenciaDisplay diferencia={diferencia} />
            </div>

            {esTurnoOlvidado && (
              <div className="space-y-2">
                <Label htmlFor="cierreEn">Fecha y hora de cierre</Label>
                <Input
                  id="cierreEn"
                  type="datetime-local"
                  value={cierreEnLocal}
                  onChange={(e) => setCierreEnLocal(e.target.value)}
                  min={formatLocalDateTime(aperturaDate)}
                  max={formatLocalDateTime(new Date())}
                  disabled={pending}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones (opcional)</Label>
              <textarea
                id="observaciones"
                maxLength={500}
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                disabled={pending}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              Cerrar turno
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(strong && 'font-semibold')}>{value}</span>
    </div>
  );
}

function DiferenciaDisplay({ diferencia }: { diferencia: number | null }) {
  if (diferencia === null) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }
  if (diferencia === 0) {
    return (
      <p className="text-sm font-semibold text-green-600">
        {fmtMoneda.format(0)} (exacto)
      </p>
    );
  }
  if (diferencia > 0) {
    return (
      <p className="text-sm font-semibold text-green-600">
        +{fmtMoneda.format(diferencia)} (sobró)
      </p>
    );
  }
  return (
    <p className="text-sm font-semibold text-red-600">
      -{fmtMoneda.format(Math.abs(diferencia))} (faltó)
    </p>
  );
}
