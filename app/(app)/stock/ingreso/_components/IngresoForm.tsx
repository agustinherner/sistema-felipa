'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { registrarIngresoBulk } from '@/lib/stock/actions';
import type { VarianteParaIngreso } from '@/lib/stock/helpers';
import {
  BuscadorVariantes,
  type BuscadorHandle,
} from './BuscadorVariantes';
import { LineaIngreso, type LineaState } from './LineaIngreso';

type Props = {
  sucursalId: string;
  sucursalNombre: string;
};

export function IngresoForm({ sucursalId, sucursalNombre }: Props) {
  const router = useRouter();
  const [identificador, setIdentificador] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [lineas, setLineas] = useState<LineaState[]>([]);
  const [errores, setErrores] = useState<string[]>([]);
  const [exito, setExito] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const buscadorRef = useRef<BuscadorHandle>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const hayLineas = lineas.length > 0;
  const hayDatos =
    identificador.trim().length > 0 ||
    proveedor.trim().length > 0 ||
    observaciones.trim().length > 0;
  const hayCambios = hayLineas || hayDatos;

  const varianteIdsEnLote = useMemo(
    () => new Set(lineas.map((l) => l.varianteId)),
    [lineas],
  );
  const totalUnidades = useMemo(
    () => lineas.reduce((acc, l) => acc + l.cantidad, 0),
    [lineas],
  );

  useEffect(() => {
    buscadorRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!hayCambios) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hayCambios]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        // Si está dentro del form, dejar que dispare submit.
        if (formRef.current && target && formRef.current.contains(target)) {
          if (tag === 'TEXTAREA') return; // textarea ya hace newline normal
          e.preventDefault();
          if (!pending && hayLineas) {
            handleSubmit();
          }
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, hayLineas, lineas, identificador, proveedor, observaciones]);

  function handleSeleccionarVariante(v: VarianteParaIngreso) {
    setExito(null);
    setErrores([]);
    setLineas((prev) => {
      const idx = prev.findIndex((l) => l.varianteId === v.varianteId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 };
        return next;
      }
      return [
        ...prev,
        {
          varianteId: v.varianteId,
          productoNombre: v.productoNombre,
          varianteNombre: v.varianteNombre,
          codigoBarras: v.codigoBarras,
          esVarianteUnicaImplicita: v.esVarianteUnicaImplicita,
          cantidad: 1,
        },
      ];
    });
  }

  function handleCantidadChange(varianteId: string, cantidad: number) {
    setLineas((prev) =>
      prev.map((l) =>
        l.varianteId === varianteId ? { ...l, cantidad } : l,
      ),
    );
  }

  function handleRemove(varianteId: string) {
    setLineas((prev) => prev.filter((l) => l.varianteId !== varianteId));
  }

  function handleCancelar() {
    if (hayCambios) {
      const ok = window.confirm(
        'Tenés líneas sin guardar. ¿Salir igual?',
      );
      if (!ok) return;
    }
    router.push('/stock');
  }

  function handleSubmit() {
    setErrores([]);
    setExito(null);

    if (lineas.length === 0) {
      setErrores(['Agregá al menos una línea.']);
      return;
    }

    const lineasNormalizadas = lineas.map((l) => ({
      varianteId: l.varianteId,
      cantidad: Math.max(1, Math.floor(l.cantidad || 0)),
    }));

    startTransition(async () => {
      const res = await registrarIngresoBulk({
        sucursalId,
        identificador: identificador.trim() || null,
        proveedor: proveedor.trim() || null,
        observaciones: observaciones.trim() || null,
        lineas: lineasNormalizadas,
      });
      if (!res.ok) {
        setErrores(res.errores);
        return;
      }

      setLineas([]);
      setIdentificador('');
      setProveedor('');
      setObservaciones('');
      setExito(
        `Ingreso registrado: ${res.lineasProcesadas} ${
          res.lineasProcesadas === 1 ? 'línea' : 'líneas'
        }, ${res.unidadesTotales} ${
          res.unidadesTotales === 1 ? 'unidad agregada' : 'unidades agregadas'
        } al stock.`,
      );
      router.refresh();
      setTimeout(() => buscadorRef.current?.focus(), 50);
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        if (!pending) handleSubmit();
      }}
      className="space-y-6"
      noValidate
    >
      {exito && (
        <div
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          {exito}
        </div>
      )}

      {errores.length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm font-medium text-destructive">
            No se pudo registrar el ingreso:
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-destructive">
            {errores.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="space-y-4 rounded-md border bg-background p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold">Datos del ingreso</h2>
          <span className="text-xs text-muted-foreground">
            Sucursal: {sucursalNombre}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="identificador" className="text-sm font-medium">
              Identificador{' '}
              <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Input
              id="identificador"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              maxLength={100}
              placeholder="Ej: Remito #1234"
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proveedor" className="text-sm font-medium">
              Proveedor{' '}
              <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Input
              id="proveedor"
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              maxLength={200}
              placeholder="Ej: Mayorista La Pampa"
              disabled={pending}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="observaciones" className="text-sm font-medium">
            Observaciones{' '}
            <span className="text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            id="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            maxLength={500}
            rows={2}
            disabled={pending}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </section>

      <section className="space-y-3 rounded-md border bg-background p-5">
        <h2 className="text-base font-semibold">Agregar línea</h2>
        <BuscadorVariantes
          ref={buscadorRef}
          sucursalId={sucursalId}
          varianteIdsEnLote={varianteIdsEnLote}
          onSeleccionar={handleSeleccionarVariante}
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">
          Tip: si escaneás un código que ya está en el lote, sumamos 1 a esa
          línea en lugar de duplicarla. Atajo:{' '}
          <kbd className="rounded border bg-muted px-1 text-[10px]">
            Ctrl+Enter
          </kbd>{' '}
          confirma el ingreso.{' '}
          <Link href="/productos/nuevo" className="underline">
            ¿No existe el producto? Cargalo acá
          </Link>
          .
        </p>
      </section>

      <section className="rounded-md border bg-background">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-base font-semibold">
            Líneas{' '}
            <span className="text-muted-foreground">({lineas.length})</span>
          </h2>
          {hayLineas && (
            <p className="text-sm text-muted-foreground">
              Total:{' '}
              <span className="font-medium text-foreground tabular-nums">
                {totalUnidades}
              </span>{' '}
              {totalUnidades === 1 ? 'unidad' : 'unidades'},{' '}
              <span className="font-medium text-foreground tabular-nums">
                {lineas.length}
              </span>{' '}
              {lineas.length === 1 ? 'línea' : 'líneas'}
            </p>
          )}
        </div>
        {hayLineas ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    Producto / Variante
                  </th>
                  <th className="w-32 px-3 py-2 text-right font-medium">
                    Cantidad
                  </th>
                  <th className="w-20 px-3 py-2 text-right font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((l) => (
                  <LineaIngreso
                    key={l.varianteId}
                    linea={l}
                    disabled={pending}
                    onCantidadChange={(n) =>
                      handleCantidadChange(l.varianteId, n)
                    }
                    onRemove={() => handleRemove(l.varianteId)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Todavía no agregaste líneas. Escaneá un código o buscá una variante
            arriba.
          </p>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancelar}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? 'Registrando…' : 'Confirmar ingreso'}
        </Button>
      </div>
    </form>
  );
}
