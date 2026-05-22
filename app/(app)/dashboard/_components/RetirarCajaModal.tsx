'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registrarRetiroCaja } from '@/lib/turnos/actions';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RetirarCajaModal({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [errores, setErrores] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const submittingRef = useRef(false);

  useEffect(() => {
    if (open) {
      setMonto('');
      setMotivo('');
      setErrores([]);
      submittingRef.current = false;
    }
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setErrores([]);

    const montoNum = Number(monto);
    if (monto.trim() === '' || Number.isNaN(montoNum) || montoNum <= 0) {
      setErrores(['Ingresá un monto mayor a cero.']);
      return;
    }
    if (motivo.trim().length < 3) {
      setErrores(['El motivo debe tener al menos 3 caracteres.']);
      return;
    }

    submittingRef.current = true;
    startTransition(async () => {
      const res = await registrarRetiroCaja({
        monto: montoNum,
        motivo: motivo.trim(),
      });
      if (!res.ok) {
        submittingRef.current = false;
        setErrores(res.errores);
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Retirar de caja</DialogTitle>
          <DialogDescription>
            Registrá un retiro de efectivo del turno (depósito al banco, pago a
            proveedor, cambio, etc.).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errores.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {errores.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="retiro-monto">Monto</Label>
            <Input
              id="retiro-monto"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
              autoFocus
              disabled={pending}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="retiro-motivo">Motivo</Label>
            <Input
              id="retiro-motivo"
              type="text"
              placeholder="Ej: depósito banco"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
              minLength={3}
              maxLength={200}
              disabled={pending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar retiro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
