'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X } from 'lucide-react';
import { crearVenta, type ResultadoBusqueda } from '@/lib/ventas/actions';
import { BusquedaInput } from './BusquedaInput';
import { CarritoTable } from './CarritoTable';
import { MetodosPagoPanel } from './MetodosPagoPanel';
import { ModalCobro } from './ModalCobro';

export type ItemCarrito = {
  varianteId: string;
  nombreCompleto: string;
  precioUnitario: number;
  cantidad: number;
  stockActual: number;
};

export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'DEBITO' | 'CREDITO';

export type MetodoPagoEntry = {
  id: string;
  metodo: MetodoPago | '';
  monto: string;
};

export type DescuentoTipo = 'PORCENTAJE' | 'MONTO';

export type DescuentoState = {
  tipo: DescuentoTipo;
  valor: string;
};

const MAX_METODOS = 4;

function nuevoEntry(): MetodoPagoEntry {
  return { id: crypto.randomUUID(), metodo: '', monto: '' };
}

function redondear2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function VentaNuevaForm() {
  const router = useRouter();

  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPagoEntry[]>(() => [
    nuevoEntry(),
  ]);
  const [descuento, setDescuento] = useState<DescuentoState | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cobrando, setCobrando] = useState(false);
  const [errorCobro, setErrorCobro] = useState<string[] | null>(null);
  // Guard síncrono contra doble submit. `cobrando` se usa para feedback
  // visual (disabled del botón) pero su update es async; entre el primer
  // click y la propagación del disabled hay una ventana donde un segundo
  // tap táctil llega al handler. El ref se setea en el mismo tick.
  const submittingRef = useRef(false);

  // ---- Carrito ----
  const onAgregarAlCarrito = useCallback((resultado: ResultadoBusqueda) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.varianteId === resultado.varianteId);
      if (existing) {
        return prev.map((it) =>
          it.varianteId === resultado.varianteId
            ? { ...it, cantidad: it.cantidad + 1 }
            : it,
        );
      }
      return [
        ...prev,
        {
          varianteId: resultado.varianteId,
          nombreCompleto: resultado.nombreCompleto,
          precioUnitario: resultado.precioEfectivo,
          cantidad: 1,
          stockActual: resultado.stockActual,
        },
      ];
    });
  }, []);

  const onCambiarCantidad = useCallback(
    (varianteId: string, nuevaCantidad: number) => {
      setItems((prev) => {
        if (nuevaCantidad <= 0 || Number.isNaN(nuevaCantidad)) {
          return prev.filter((it) => it.varianteId !== varianteId);
        }
        return prev.map((it) =>
          it.varianteId === varianteId
            ? { ...it, cantidad: Math.floor(nuevaCantidad) }
            : it,
        );
      });
    },
    [],
  );

  const onEliminarItem = useCallback((varianteId: string) => {
    setItems((prev) => prev.filter((it) => it.varianteId !== varianteId));
  }, []);

  // ---- Métodos de pago ----
  const onAgregarMetodo = useCallback(() => {
    setMetodosPago((prev) => {
      if (prev.length >= MAX_METODOS) return prev;
      const ultimo = prev[prev.length - 1];
      if (!ultimo || ultimo.metodo === '') return prev;
      return [...prev, nuevoEntry()];
    });
  }, []);

  const onCambiarMetodo = useCallback(
    (id: string, metodo: MetodoPago | '') => {
      setMetodosPago((prev) => {
        // Sin duplicados: si otro entry ya tiene ese método, no permitir.
        if (
          metodo !== '' &&
          prev.some((m) => m.id !== id && m.metodo === metodo)
        ) {
          return prev;
        }
        return prev.map((m) => (m.id === id ? { ...m, metodo } : m));
      });
    },
    [],
  );

  const onCambiarMonto = useCallback((id: string, monto: string) => {
    setMetodosPago((prev) =>
      prev.map((m) => (m.id === id ? { ...m, monto } : m)),
    );
  }, []);

  const onEliminarMetodo = useCallback((id: string) => {
    setMetodosPago((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  // ---- Descuento ----
  const onCambiarDescuentoTipo = useCallback((tipo: DescuentoTipo) => {
    setDescuento((prev) =>
      prev ? { ...prev, tipo } : { tipo, valor: '' },
    );
  }, []);

  const onCambiarDescuentoValor = useCallback((valor: string) => {
    setDescuento((prev) => (prev ? { ...prev, valor } : prev));
  }, []);

  const onAplicarPresetEfTransf = useCallback(() => {
    setDescuento({ tipo: 'PORCENTAJE', valor: '10' });
  }, []);

  const onQuitarDescuento = useCallback(() => {
    setDescuento(null);
  }, []);

  // ---- Cálculos derivados ----
  const subtotal = useMemo(
    () =>
      items.reduce((acc, it) => acc + it.precioUnitario * it.cantidad, 0),
    [items],
  );

  // Devuelve { monto, error }. Si el descuento es null o el valor está vacío,
  // monto = 0 y error = null (estado válido = sin descuento).
  const descuentoCalc = useMemo<{ monto: number; error: string | null }>(() => {
    if (!descuento) return { monto: 0, error: null };
    const trimmed = descuento.valor.trim();
    if (trimmed === '') return { monto: 0, error: null };
    const n = parseFloat(trimmed);
    if (!Number.isFinite(n) || n <= 0) {
      return { monto: 0, error: 'El valor del descuento debe ser mayor a 0.' };
    }
    if (descuento.tipo === 'PORCENTAJE') {
      if (n > 100) {
        return { monto: 0, error: 'El porcentaje no puede ser mayor a 100.' };
      }
      return { monto: redondear2(subtotal * (n / 100)), error: null };
    }
    // MONTO
    if (n > subtotal + 0.001) {
      return { monto: 0, error: 'El descuento no puede superar el subtotal.' };
    }
    return { monto: redondear2(n), error: null };
  }, [descuento, subtotal]);

  const descuentoMonto = descuentoCalc.monto;
  const descuentoError = descuentoCalc.error;
  const descuentoActivo = descuento !== null && descuentoMonto > 0;

  const total = useMemo(
    () => redondear2(subtotal - descuentoMonto),
    [subtotal, descuentoMonto],
  );

  const sumaPagos = useMemo(
    () =>
      metodosPago.reduce((acc, m) => acc + (parseFloat(m.monto) || 0), 0),
    [metodosPago],
  );

  const diferenciaRestante = useMemo(
    () => total - sumaPagos,
    [total, sumaPagos],
  );

  const cobroValido = useMemo(() => {
    if (items.length === 0) return false;
    if (descuentoError) return false;
    if (metodosPago.some((m) => m.metodo === '')) return false;
    if (metodosPago.some((m) => (parseFloat(m.monto) || 0) <= 0)) return false;
    if (diferenciaRestante > 0.01) return false; // falta plata
    return true;
  }, [items.length, descuentoError, metodosPago, diferenciaRestante]);

  // ---- Cobro ----
  const onCobrar = useCallback(() => {
    if (!cobroValido) return;
    setErrorCobro(null);
    setModalAbierto(true);
  }, [cobroValido]);

  const onCancelarModal = useCallback(() => {
    if (cobrando) return;
    setModalAbierto(false);
  }, [cobrando]);

  const onConfirmarCobro = useCallback(async () => {
    // Guard síncrono: si ya hay un submit en vuelo, ignorar el segundo tap.
    // `cobrando` propaga async vía React; el ref es el guard real.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setCobrando(true);
    setErrorCobro(null);
    try {
      const descuentoPayload =
        descuento && descuento.valor.trim() !== '' && !descuentoError
          ? {
              tipo: descuento.tipo,
              valor: parseFloat(descuento.valor),
            }
          : null;
      const payload = {
        items: items.map((it) => ({
          varianteId: it.varianteId,
          cantidad: it.cantidad,
        })),
        metodosPago: metodosPago
          .filter((m) => m.metodo !== '' && m.monto.trim() !== '')
          .map((m) => ({
            metodo: m.metodo as MetodoPago,
            monto: parseFloat(m.monto),
          })),
        descuento: descuentoPayload,
      };
      const res = await crearVenta(payload);
      if (!res.ok) {
        setErrorCobro(res.errores);
        setModalAbierto(false);
        submittingRef.current = false;
        setCobrando(false);
        return;
      }
      // Éxito: navegar a éxito. NO reseteamos el ref ni `cobrando`: queremos
      // que cualquier tap residual mientras Next desmonta el form siga siendo
      // ignorado. El ref se descarta cuando el componente se unmonta.
      router.push(`/ventas/exito?codigo=${encodeURIComponent(res.codigoCorto)}`);
    } catch (err) {
      // Nunca filtrar el mensaje crudo de Prisma/DB al cajero. Logueamos el
      // error real (Vercel Function logs / consola del browser en dev) y
      // mostramos un mensaje accionable.
      console.error('[crearVenta] error inesperado:', err);
      setErrorCobro(['No se pudo registrar la venta. Reintentá.']);
      setModalAbierto(false);
      submittingRef.current = false;
      setCobrando(false);
    }
  }, [items, metodosPago, descuento, descuentoError, router]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <BusquedaInput onAgregar={onAgregarAlCarrito} />
        <CarritoTable
          items={items}
          subtotal={subtotal}
          onCambiarCantidad={onCambiarCantidad}
          onEliminar={onEliminarItem}
        />
      </div>

      <aside className="lg:col-span-1">
        <MetodosPagoPanel
          metodosPago={metodosPago}
          subtotal={subtotal}
          descuento={descuento}
          descuentoMonto={descuentoMonto}
          descuentoError={descuentoError}
          descuentoActivo={descuentoActivo}
          total={total}
          sumaPagos={sumaPagos}
          diferenciaRestante={diferenciaRestante}
          cobroValido={cobroValido}
          carritoVacio={items.length === 0}
          onAgregarMetodo={onAgregarMetodo}
          onCambiarMetodo={onCambiarMetodo}
          onCambiarMonto={onCambiarMonto}
          onEliminarMetodo={onEliminarMetodo}
          onCambiarDescuentoTipo={onCambiarDescuentoTipo}
          onCambiarDescuentoValor={onCambiarDescuentoValor}
          onAplicarPresetEfTransf={onAplicarPresetEfTransf}
          onQuitarDescuento={onQuitarDescuento}
          onCobrar={onCobrar}
          cobrando={cobrando}
        />

        {errorCobro && errorCobro.length > 0 && (
          <div
            role="alert"
            className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-4 w-4" />
                No se pudo registrar la venta
              </span>
              <button
                type="button"
                onClick={() => setErrorCobro(null)}
                aria-label="Cerrar"
                className="opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="list-disc pl-5">
              {errorCobro.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      <ModalCobro
        abierto={modalAbierto}
        items={items}
        metodosPago={metodosPago}
        subtotal={subtotal}
        descuento={descuento}
        descuentoMonto={descuentoMonto}
        total={total}
        cobrando={cobrando}
        onConfirmar={onConfirmarCobro}
        onCancelar={onCancelarModal}
      />
    </div>
  );
}
