'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
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
import { actualizarConfiguracion } from '@/lib/configuracion/actions';

type Initial = {
  nombreNegocio: string;
  direccion: string | null;
  telefono: string | null;
  cuit: string | null;
  markupDefault: string;
  descuentoEstandar: string;
  diasDevolucion: number;
  umbralStockBajo: number;
};

export function ConfiguracionAdminForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errores, setErrores] = useState<string[]>([]);
  const [exito, setExito] = useState(false);

  const [nombreNegocio, setNombreNegocio] = useState(initial.nombreNegocio);
  const [direccion, setDireccion] = useState(initial.direccion ?? '');
  const [telefono, setTelefono] = useState(initial.telefono ?? '');
  const [cuit, setCuit] = useState(initial.cuit ?? '');
  const [markupDefault, setMarkupDefault] = useState(initial.markupDefault);
  const [descuentoEstandar, setDescuentoEstandar] = useState(
    initial.descuentoEstandar,
  );
  const [diasDevolucion, setDiasDevolucion] = useState(
    String(initial.diasDevolucion),
  );
  const [umbralStockBajo, setUmbralStockBajo] = useState(
    String(initial.umbralStockBajo),
  );

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrores([]);
    setExito(false);

    startTransition(async () => {
      const res = await actualizarConfiguracion({
        nombreNegocio,
        direccion,
        telefono,
        cuit,
        markupDefault,
        descuentoEstandar,
        diasDevolucion,
        umbralStockBajo,
      });

      if (!res.ok) {
        setErrores(res.errores);
        return;
      }
      setExito(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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

      {exito && (
        <Alert>
          <AlertDescription>
            Configuración guardada.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos del negocio</CardTitle>
          <CardDescription>
            Se usan en el comprobante de WhatsApp y en otros lugares donde se
            muestre el nombre del local.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="nombreNegocio">Nombre del negocio</Label>
            <Input
              id="nombreNegocio"
              value={nombreNegocio}
              onChange={(e) => setNombreNegocio(e.target.value)}
              required
              maxLength={120}
              disabled={pending}
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              disabled={pending}
              placeholder="Opcional"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              disabled={pending}
              placeholder="Opcional"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cuit">CUIT</Label>
            <Input
              id="cuit"
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
              disabled={pending}
              placeholder="Opcional"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parámetros de venta</CardTitle>
          <CardDescription>
            Valores por defecto que se aplican al cargar productos y al cobrar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="markupDefault">Multiplicador de markup</Label>
            <Input
              id="markupDefault"
              type="number"
              step="0.01"
              min="1.01"
              value={markupDefault}
              onChange={(e) => setMarkupDefault(e.target.value)}
              required
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              Precio sugerido = costo × multiplicador. Ej: 2.15 = 115% sobre el
              costo.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="descuentoEstandar">
              Descuento estándar (%)
            </Label>
            <Input
              id="descuentoEstandar"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={descuentoEstandar}
              onChange={(e) => setDescuentoEstandar(e.target.value)}
              required
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              Botón rápido en cobro (efectivo / transferencia).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stock y devoluciones</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="umbralStockBajo">Umbral de stock bajo</Label>
            <Input
              id="umbralStockBajo"
              type="number"
              step="1"
              min="0"
              value={umbralStockBajo}
              onChange={(e) => setUmbralStockBajo(e.target.value)}
              required
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              Variantes con cantidad ≤ este valor se marcan como “bajo”.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="diasDevolucion">Días para devolver una venta</Label>
            <Input
              id="diasDevolucion"
              type="number"
              step="1"
              min="0"
              value={diasDevolucion}
              onChange={(e) => setDiasDevolucion(e.target.value)}
              required
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              Pasados estos días desde la venta, no se permiten devoluciones.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
