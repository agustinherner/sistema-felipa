'use client';

import { useCallback, useMemo, useState } from 'react';
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

const MAX_METODOS = 4;

function nuevoEntry(): MetodoPagoEntry {
  return { id: crypto.randomUUID(), metodo: '', monto: '' };
}

export function VentaNuevaForm() {
  const router = useRouter();

  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPagoEntry[]>(() => [
    nuevoEntry(),
  ]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cobrando, setCobrando] = useState(false);
  const [errorCobro, setErrorCobro] = useState<string[] | null>(null);

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

  // ---- Cálculos derivados ----
  const subtotal = useMemo(
    () =>
      items.reduce((acc, it) => acc + it.precioUnitario * it.cantidad, 0),
    [items],
  );

  const aplicaDescuento = useMemo(() => {
    if (metodosPago.length === 0) return false;
    return metodosPago.every(
      (m) => m.metodo === 'EFECTIVO' || m.metodo === 'TRANSFERENCIA',
    );
  }, [metodosPago]);

  const descuento = useMemo(
    () => (aplicaDescuento ? Math.round(subtotal * 0.1 * 100) / 100 : 0),
    [aplicaDescuento, subtotal],
  );

  const total = useMemo(() => subtotal - descuento, [subtotal, descuento]);

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
    if (metodosPago.some((m) => m.metodo === '')) return false;
    if (metodosPago.some((m) => (parseFloat(m.monto) || 0) <= 0)) return false;
    if (diferenciaRestante > 0.01) return false; // falta plata
    return true;
  }, [items.length, metodosPago, diferenciaRestante]);

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
    setCobrando(true);
    setErrorCobro(null);
    try {
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
      };
      const res = await crearVenta(payload);
      if (!res.ok) {
        setErrorCobro(res.errores);
        setModalAbierto(false);
        setCobrando(false);
        return;
      }
      // Éxito: navegar a la pantalla de éxito.
      router.push(`/ventas/exito?codigo=${encodeURIComponent(res.idCorto)}`);
    } catch (err) {
      setErrorCobro([
        err instanceof Error ? err.message : 'Error inesperado al cobrar',
      ]);
      setModalAbierto(false);
      setCobrando(false);
    }
  }, [items, metodosPago, router]);

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
          total={total}
          sumaPagos={sumaPagos}
          diferenciaRestante={diferenciaRestante}
          cobroValido={cobroValido}
          carritoVacio={items.length === 0}
          onAgregarMetodo={onAgregarMetodo}
          onCambiarMetodo={onCambiarMetodo}
          onCambiarMonto={onCambiarMonto}
          onEliminarMetodo={onEliminarMetodo}
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
        total={total}
        cobrando={cobrando}
        onConfirmar={onConfirmarCobro}
        onCancelar={onCancelarModal}
      />
    </div>
  );
}
