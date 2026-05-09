'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { VentasPermissions } from '@/lib/ventas/permissions';

const METODO_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los métodos' },
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'DEBITO', label: 'Débito' },
  { value: 'CREDITO', label: 'Crédito' },
];

type Props = {
  permissions: VentasPermissions;
  usuarios: { id: string; nombre: string }[];
  filtrosActuales: {
    desde: string;
    hasta: string;
    usuario: string;
    metodo: string;
  };
};

export function FiltrosVentas({
  permissions,
  usuarios,
  filtrosActuales,
}: Props) {
  const router = useRouter();
  const [desde, setDesde] = useState(filtrosActuales.desde);
  const [hasta, setHasta] = useState(filtrosActuales.hasta);
  const [usuario, setUsuario] = useState(filtrosActuales.usuario);
  const [metodo, setMetodo] = useState(filtrosActuales.metodo);

  function aplicar() {
    const params = new URLSearchParams();
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    if (permissions.filtrarPorUsuario && usuario) {
      params.set('usuario', usuario);
    }
    if (metodo) params.set('metodo', metodo);
    const qs = params.toString();
    router.push(qs ? `/ventas?${qs}` : '/ventas');
  }

  function limpiar() {
    setUsuario('');
    setMetodo('');
    const today = new Date().toISOString().slice(0, 10);
    setDesde(today);
    setHasta(today);
    router.push('/ventas');
  }

  return (
    <div className="rounded-md border bg-background p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="ventas-desde"
            className="text-xs font-medium text-muted-foreground"
          >
            Desde
          </label>
          <Input
            id="ventas-desde"
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="ventas-hasta"
            className="text-xs font-medium text-muted-foreground"
          >
            Hasta
          </label>
          <Input
            id="ventas-hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="w-[160px]"
          />
        </div>

        {permissions.filtrarPorUsuario && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="ventas-usuario"
              className="text-xs font-medium text-muted-foreground"
            >
              Vendedor
            </label>
            <Select
              id="ventas-usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-[200px]"
            >
              <option value="">Todos</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="ventas-metodo"
            className="text-xs font-medium text-muted-foreground"
          >
            Método de pago
          </label>
          <Select
            id="ventas-metodo"
            value={metodo}
            onChange={(e) => setMetodo(e.target.value)}
            className="w-[200px]"
          >
            {METODO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex gap-2">
          <Button type="button" onClick={aplicar}>
            <Filter className="h-4 w-4" />
            Filtrar
          </Button>
          <Button type="button" variant="ghost" onClick={limpiar}>
            Limpiar
          </Button>
        </div>
      </div>
    </div>
  );
}
