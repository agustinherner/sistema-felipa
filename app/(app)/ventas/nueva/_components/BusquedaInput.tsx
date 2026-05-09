'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { AlertTriangle, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { buscarProducto, type ResultadoBusqueda } from '@/lib/ventas/actions';

type Props = {
  onAgregar: (resultado: ResultadoBusqueda) => void;
};

const DEBOUNCE_MS = 350;
const MIN_DEBOUNCE_LEN = 2;

function formatoPrecio(n: number): string {
  return `$${n.toLocaleString('es-AR')}`;
}

export function BusquedaInput({ onAgregar }: Props) {
  const [valor, setValor] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Token para descartar respuestas viejas si llegan fuera de orden.
  const reqIdRef = useRef(0);
  // Marca si el último cambio del input vino del usuario (vs reset programático).
  const lastUserInputRef = useRef('');

  const limpiar = useCallback(() => {
    setValor('');
    setResultados([]);
    setDropdownAbierto(false);
    setMensaje(null);
    setHighlight(0);
    inputRef.current?.focus();
  }, []);

  const handleSeleccion = useCallback(
    (r: ResultadoBusqueda) => {
      onAgregar(r);
      limpiar();
    },
    [onAgregar, limpiar],
  );

  const ejecutarBusqueda = useCallback(
    (
      termino: string,
      modo: 'enter' | 'tipeo',
    ): void => {
      const termTrim = termino.trim();
      if (!termTrim) {
        setResultados([]);
        setDropdownAbierto(false);
        return;
      }
      const reqId = ++reqIdRef.current;
      startTransition(async () => {
        const result = await buscarProducto(termTrim);
        if (reqId !== reqIdRef.current) return; // descartado
        if (!result.ok) {
          setResultados([]);
          setDropdownAbierto(false);
          setMensaje(result.errores[0] ?? 'Error en la búsqueda');
          return;
        }
        setMensaje(null);
        if (modo === 'enter') {
          if (result.resultados.length === 0) {
            setMensaje('Producto no encontrado');
            setResultados([]);
            setDropdownAbierto(false);
            setValor('');
            inputRef.current?.focus();
            return;
          }
          if (result.resultados.length === 1) {
            handleSeleccion(result.resultados[0]);
            return;
          }
          setResultados(result.resultados);
          setDropdownAbierto(true);
          setHighlight(0);
          return;
        }
        // tipeo
        setResultados(result.resultados);
        setDropdownAbierto(result.resultados.length > 0);
        setHighlight(0);
      });
    },
    [handleSeleccion],
  );

  // Debounce mientras tipea
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (valor !== lastUserInputRef.current) return; // cambio programático, ignorar
    if (valor.trim().length < MIN_DEBOUNCE_LEN) {
      setResultados([]);
      setDropdownAbierto(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      ejecutarBusqueda(valor, 'tipeo');
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [valor, ejecutarBusqueda]);

  // Cerrar dropdown al click afuera
  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownAbierto(false);
      }
    }
    document.addEventListener('mousedown', onClickFuera);
    return () => document.removeEventListener('mousedown', onClickFuera);
  }, []);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    lastUserInputRef.current = e.target.value;
    setValor(e.target.value);
    setMensaje(null);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Si el dropdown está abierto y hay highlight válido, agarrar esa fila.
      if (dropdownAbierto && resultados.length > 0) {
        const r = resultados[highlight] ?? resultados[0];
        handleSeleccion(r);
        return;
      }
      // Sino, búsqueda directa modo Enter (scanner).
      if (debounceRef.current) clearTimeout(debounceRef.current);
      ejecutarBusqueda(valor, 'enter');
      return;
    }
    if (e.key === 'Escape') {
      setDropdownAbierto(false);
      return;
    }
    if (!dropdownAbierto || resultados.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          autoFocus
          value={valor}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Código de barras o nombre del producto"
          aria-label="Buscar producto"
          className="pl-9 pr-9"
        />
        {pending && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {mensaje && !dropdownAbierto && (
        <div className="mt-2 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          {mensaje}
        </div>
      )}

      {dropdownAbierto && resultados.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-auto rounded-md border bg-popover shadow-md"
        >
          {resultados.map((r, i) => {
            const stockBajo = r.stockActual <= 0;
            return (
              <li
                key={r.varianteId}
                role="option"
                aria-selected={i === highlight}
                onMouseDown={(e) => {
                  // mousedown para que dispare antes que el blur del input
                  e.preventDefault();
                  handleSeleccion(r);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={
                  'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm ' +
                  (i === highlight ? 'bg-accent' : 'hover:bg-accent/60')
                }
              >
                <span
                  className={
                    'flex items-center gap-2 ' +
                    (stockBajo ? 'text-amber-700' : '')
                  }
                >
                  {stockBajo && <AlertTriangle className="h-4 w-4" />}
                  {r.nombreCompleto}
                </span>
                <span className="flex items-center gap-3 whitespace-nowrap text-muted-foreground">
                  <span>Stock: {r.stockActual}</span>
                  <span className="font-medium text-foreground">
                    {formatoPrecio(r.precioEfectivo)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
