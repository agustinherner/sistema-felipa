'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { crearProducto, editarProducto } from '@/lib/productos/actions';
import {
  nuevaVarianteVacia,
  type VarianteFormState,
} from '@/lib/productos/helpers';
import { NuevaCategoriaModal } from './NuevaCategoriaModal';
import { VarianteCard } from './VarianteCard';

const MARKUP = 2.15;

type Categoria = { id: string; nombre: string };

export type ProductoFormValoresIniciales = {
  id?: string;
  nombre: string;
  descripcion: string;
  categoriaId: string;
  precioBase: string;
  costoBase: string;
  tieneVariantes: boolean;
  variantes: VarianteFormState[];
};

type Props = {
  modo: 'alta' | 'edicion';
  categorias: Categoria[];
  valoresIniciales: ProductoFormValoresIniciales;
  productoId?: string;
  categoriaPersistidaId?: string;
};

function parseDecimalOrNull(s: string): number | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

function parseIntOrZero(s: string): number {
  const trimmed = s.trim();
  if (!trimmed) return 0;
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function extraerCodigosDeErrores(errores: string[]): Set<string> {
  const codigos = new Set<string>();
  const re = /El código de barras "([^"]+)"/g;
  for (const e of errores) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(e)) !== null) codigos.add(m[1]);
  }
  return codigos;
}

function calcularPrecioConMarkup(costoStr: string, precioStr: string): string {
  if (precioStr.trim() !== '') return precioStr;
  const costoNum = parseDecimalOrNull(costoStr);
  if (costoNum == null || costoNum <= 0) return precioStr;
  const sugerido = Math.round(costoNum * MARKUP * 100) / 100;
  return String(sugerido);
}

export function ProductoForm({
  modo,
  categorias: categoriasIniciales,
  valoresIniciales,
  productoId,
  categoriaPersistidaId,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciales);
  const [nombre, setNombre] = useState(valoresIniciales.nombre);
  const [descripcion, setDescripcion] = useState(valoresIniciales.descripcion);
  const [categoriaId, setCategoriaId] = useState(
    categoriaPersistidaId ?? valoresIniciales.categoriaId,
  );
  const [precioBase, setPrecioBase] = useState(valoresIniciales.precioBase);
  const [costoBase, setCostoBase] = useState(valoresIniciales.costoBase);
  const [tieneVariantes, setTieneVariantes] = useState(
    valoresIniciales.tieneVariantes,
  );
  const [variantes, setVariantes] = useState<VarianteFormState[]>(
    valoresIniciales.variantes,
  );
  const [stockInicialUnico, setStockInicialUnico] = useState(
    valoresIniciales.tieneVariantes
      ? ''
      : valoresIniciales.variantes[0]?.stockInicial ?? '',
  );

  const [erroresGenerales, setErroresGenerales] = useState<string[]>([]);
  const [erroresVariantes, setErroresVariantes] = useState<
    Record<string, { nombre?: string; codigoBarras?: string }>
  >({});
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [submitMode, setSubmitMode] = useState<'guardar' | 'guardar-y-otro'>(
    'guardar',
  );

  const [modalCategoriaOpen, setModalCategoriaOpen] = useState(false);

  const nombreRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    nombreRef.current?.focus();
  }, []);

  const esAlta = modo === 'alta';

  const variantesParaRender = useMemo(
    () => (tieneVariantes ? variantes : []),
    [tieneVariantes, variantes],
  );

  function handleCostoBaseBlur() {
    const sugerido = calcularPrecioConMarkup(costoBase, precioBase);
    if (sugerido !== precioBase) setPrecioBase(sugerido);
  }

  function handleVarianteCostoBlur(uid: string) {
    setVariantes((prev) =>
      prev.map((v) => {
        if (v.uid !== uid) return v;
        if (!v.precioPropio) return v;
        const sugerido = calcularPrecioConMarkup(v.costo, v.precio);
        if (sugerido === v.precio) return v;
        return { ...v, precio: sugerido };
      }),
    );
  }

  function handleAgregarVariante() {
    setVariantes((prev) => [...prev, nuevaVarianteVacia()]);
  }

  function handleEliminarVariante(uid: string) {
    setVariantes((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((v) => v.uid !== uid);
    });
  }

  function handleCambioVariante(uid: string, next: VarianteFormState) {
    setVariantes((prev) => prev.map((v) => (v.uid === uid ? next : v)));
  }

  function handleToggleVariantes(checked: boolean) {
    setTieneVariantes(checked);
    if (checked) {
      if (variantes.length === 0) {
        setVariantes([nuevaVarianteVacia()]);
      }
    }
  }

  function handleCategoriaCreada(cat: Categoria) {
    setCategorias((prev) => {
      const next = [...prev, cat];
      next.sort((a, b) => a.nombre.localeCompare(b.nombre));
      return next;
    });
    setCategoriaId(cat.id);
    setModalCategoriaOpen(false);
  }

  function validarLocal(): boolean {
    const generales: string[] = [];
    const porVariante: Record<string, { nombre?: string; codigoBarras?: string }> =
      {};
    let nombreErr: string | null = null;

    if (nombre.trim().length < 2) {
      nombreErr = 'El nombre debe tener al menos 2 caracteres.';
    }

    if (tieneVariantes && variantes.length === 0) {
      generales.push('Tiene que haber al menos una variante.');
    }

    const codigosVistos = new Map<string, number>();
    if (tieneVariantes) {
      variantes.forEach((v, idx) => {
        const errs: { nombre?: string; codigoBarras?: string } = {};
        if (v.nombre.trim().length === 0) {
          errs.nombre = 'Nombre requerido.';
        }
        const code = v.codigoBarras.trim();
        if (code) {
          if (codigosVistos.has(code)) {
            errs.codigoBarras = `Duplicado con variante ${codigosVistos.get(code)! + 1}.`;
          } else {
            codigosVistos.set(code, idx);
          }
        }
        if (Object.keys(errs).length > 0) porVariante[v.uid] = errs;
      });
    }

    setErroresGenerales(generales);
    setErroresVariantes(porVariante);
    setErrorNombre(nombreErr);

    return (
      generales.length === 0 &&
      Object.keys(porVariante).length === 0 &&
      nombreErr === null
    );
  }

  function buildPayload(overrides?: {
    precioBase?: string;
    variantes?: VarianteFormState[];
  }) {
    const precioBaseStr = overrides?.precioBase ?? precioBase;
    const variantesArr = overrides?.variantes ?? variantes;
    const idVarianteUnica = !tieneVariantes
      ? variantesArr[0]?.id
      : undefined;

    return {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      categoriaId: categoriaId || null,
      precioBase: parseDecimalOrNull(precioBaseStr) ?? 0,
      costoBase: parseDecimalOrNull(costoBase) ?? 0,
      tieneVariantes,
      variantes: tieneVariantes
        ? variantesArr.map((v) => ({
            id: v.id,
            nombre: v.nombre.trim(),
            codigoBarras: v.codigoBarras.trim() || null,
            precio: v.precioPropio ? parseDecimalOrNull(v.precio) : null,
            costo: v.precioPropio ? parseDecimalOrNull(v.costo) : null,
            ...(esAlta
              ? { stockInicial: parseIntOrZero(v.stockInicial) }
              : {}),
          }))
        : [
            {
              id: idVarianteUnica,
              nombre: 'Única',
              codigoBarras: null,
              precio: null,
              costo: null,
              ...(esAlta
                ? { stockInicial: parseIntOrZero(stockInicialUnico) }
                : {}),
            },
          ],
    };
  }

  function handleSubmit(mode: 'guardar' | 'guardar-y-otro') {
    const precioBaseFinal = calcularPrecioConMarkup(costoBase, precioBase);
    let cambioAlgunaVariante = false;
    const variantesFinal = variantes.map((v) => {
      if (!v.precioPropio) return v;
      const p = calcularPrecioConMarkup(v.costo, v.precio);
      if (p === v.precio) return v;
      cambioAlgunaVariante = true;
      return { ...v, precio: p };
    });

    if (precioBaseFinal !== precioBase) setPrecioBase(precioBaseFinal);
    if (cambioAlgunaVariante) setVariantes(variantesFinal);

    if (!validarLocal()) return;
    setSubmitMode(mode);
    setErroresGenerales([]);

    startTransition(async () => {
      const payload = buildPayload({
        precioBase: precioBaseFinal,
        variantes: variantesFinal,
      });

      const handleErrores = (errores: string[]) => {
        setErroresGenerales(errores);
        const codigosFallados = extraerCodigosDeErrores(errores);
        if (codigosFallados.size === 0) return;
        const porVariante: Record<
          string,
          { nombre?: string; codigoBarras?: string }
        > = {};
        variantesFinal.forEach((v) => {
          const code = v.codigoBarras.trim();
          if (code && codigosFallados.has(code)) {
            porVariante[v.uid] = { codigoBarras: 'Ya está usado por otro producto.' };
          }
        });
        if (Object.keys(porVariante).length > 0) setErroresVariantes(porVariante);
      };

      if (esAlta) {
        const res = await crearProducto(payload);
        if (!res.ok) {
          handleErrores(res.errores);
          return;
        }
        if (mode === 'guardar') {
          router.push('/productos');
          router.refresh();
        } else {
          const params = new URLSearchParams();
          if (categoriaId) params.set('categoriaId', categoriaId);
          const qs = params.toString();
          router.push(qs ? `/productos/nuevo?${qs}` : '/productos/nuevo');
          router.refresh();
        }
      } else {
        if (!productoId) return;
        const res = await editarProducto(productoId, payload);
        if (!res.ok) {
          handleErrores(res.errores);
          return;
        }
        router.push('/productos');
        router.refresh();
      }
    });
  }

  function handleFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(esAlta ? 'guardar-y-otro' : 'guardar');
    }
  }

  return (
    <>
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit('guardar');
      }}
      onKeyDown={handleFormKeyDown}
      className="space-y-6"
      noValidate
    >
      {erroresGenerales.length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm font-medium text-destructive">
            No se pudo guardar:
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-destructive">
            {erroresGenerales.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="rounded-md border bg-background p-5 space-y-4">
        <h2 className="text-base font-semibold">Datos del producto</h2>

        <div className="space-y-1.5">
          <label htmlFor="nombre" className="text-sm font-medium">
            Nombre
          </label>
          <Input
            id="nombre"
            ref={nombreRef}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Sahumerio Sándalo Premium"
            maxLength={200}
            disabled={pending}
            className={errorNombre ? 'border-destructive' : undefined}
          />
          {errorNombre && (
            <p className="text-xs text-destructive">{errorNombre}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="descripcion" className="text-sm font-medium">
            Descripción <span className="text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            maxLength={1000}
            disabled={pending}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="categoriaId" className="text-sm font-medium">
            Categoría
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                id="categoriaId"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                disabled={pending}
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalCategoriaOpen(true)}
              disabled={pending}
            >
              <Plus className="h-4 w-4" />
              Nueva categoría
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="costoBase" className="text-sm font-medium">
              Costo base{' '}
              <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Input
              id="costoBase"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={costoBase}
              onChange={(e) => setCostoBase(e.target.value)}
              onBlur={handleCostoBaseBlur}
              placeholder="0.00"
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="precioBase" className="text-sm font-medium">
              Precio base{' '}
              <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Input
              id="precioBase"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={precioBase}
              onChange={(e) => setPrecioBase(e.target.value)}
              placeholder="0.00"
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              Markup sugerido: 115% (precio = costo × 2.15). Se autocompleta al
              salir del costo si está vacío.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-md border bg-background p-5 space-y-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={tieneVariantes}
            onChange={(e) => handleToggleVariantes(e.target.checked)}
            disabled={pending}
          />
          <span>Este producto tiene variantes (color, tamaño, presentación)</span>
        </label>

        {tieneVariantes ? (
          <div className="space-y-3">
            {variantesParaRender.map((v, idx) => (
              <VarianteCard
                key={v.uid}
                index={idx}
                variante={v}
                mostrarStockInicial={esAlta}
                puedeEliminar={variantes.length > 1}
                errores={erroresVariantes[v.uid]}
                onChange={(next) => handleCambioVariante(v.uid, next)}
                onRemove={() => handleEliminarVariante(v.uid)}
                onMarkupSugerido={() => handleVarianteCostoBlur(v.uid)}
                disabled={pending}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleAgregarVariante}
              disabled={pending}
            >
              <Plus className="h-4 w-4" />
              Agregar variante
            </Button>
          </div>
        ) : (
          esAlta && (
            <div className="space-y-1.5">
              <label
                htmlFor="stockInicialUnico"
                className="text-sm font-medium"
              >
                Stock inicial
              </label>
              <Input
                id="stockInicialUnico"
                type="number"
                step="1"
                min="0"
                inputMode="numeric"
                value={stockInicialUnico}
                onChange={(e) => setStockInicialUnico(e.target.value)}
                placeholder="0"
                disabled={pending}
                className="max-w-xs"
              />
            </div>
          )
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending && submitMode === 'guardar' && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {pending && submitMode === 'guardar'
            ? 'Guardando…'
            : esAlta
              ? 'Guardar'
              : 'Guardar cambios'}
        </Button>
        {esAlta && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit('guardar-y-otro')}
            disabled={pending}
          >
            {pending && submitMode === 'guardar-y-otro' && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {pending && submitMode === 'guardar-y-otro'
              ? 'Guardando…'
              : 'Guardar y cargar otro'}
          </Button>
        )}
        <Button asChild type="button" variant="ghost" disabled={pending}>
          <Link href="/productos">Cancelar</Link>
        </Button>
      </div>

    </form>
    <NuevaCategoriaModal
      open={modalCategoriaOpen}
      onClose={() => setModalCategoriaOpen(false)}
      onCreated={handleCategoriaCreada}
    />
    </>
  );
}
