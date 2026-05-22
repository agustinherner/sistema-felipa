import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requireAuth } from '@/lib/auth/session';
import {
  listarUsuariosDeSucursal,
  listarVentas,
  type MetodoPagoVenta,
} from '@/lib/ventas/queries';
import { permisosVentas } from '@/lib/ventas/permissions';
import { FiltrosVentas } from './_components/FiltrosVentas';
import { TablaVentas } from './_components/TablaVentas';

const METODOS_VALIDOS = new Set<MetodoPagoVenta>([
  'EFECTIVO',
  'TRANSFERENCIA',
  'DEBITO',
  'CREDITO',
]);

function parseString(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ?? '';
}

function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return 1;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseFechaInicio(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseFechaFin(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d;
}

function parseMetodo(value: string): MetodoPagoVenta | undefined {
  return METODOS_VALIDOS.has(value as MetodoPagoVenta)
    ? (value as MetodoPagoVenta)
    : undefined;
}

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireAuth(['ADMIN', 'VENDEDOR']);
  const permissions = permisosVentas(user.role);

  if (!user.sucursalId) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Ventas</h1>
        <p className="text-sm text-destructive">
          Tu usuario no tiene una sucursal asignada. Pedile a un administrador
          que te asigne una.
        </p>
      </div>
    );
  }

  const today = todayISO();
  const desdeStr = parseString(searchParams.desde) || today;
  const hastaStr = parseString(searchParams.hasta) || today;
  const usuarioStr = parseString(searchParams.usuario);
  const metodoStr = parseString(searchParams.metodo);
  const ocultarAnuladasStr = parseString(searchParams.ocultarAnuladas);
  const ocultarAnuladas = ocultarAnuladasStr === '1';
  const page = parsePage(searchParams.page);

  const fechaDesde = parseFechaInicio(desdeStr) ?? undefined;
  const fechaHasta = parseFechaFin(hastaStr) ?? undefined;
  const metodoPago = parseMetodo(metodoStr);

  const usuarioId = permissions.verTodas
    ? usuarioStr || undefined
    : user.id;

  const usuariosPromise = permissions.filtrarPorUsuario
    ? listarUsuariosDeSucursal(user.sucursalId)
    : Promise.resolve([]);

  const listadoPromise = listarVentas({
    sucursalId: user.sucursalId,
    usuarioId,
    fechaDesde,
    fechaHasta,
    metodoPago,
    incluirAnuladas: !ocultarAnuladas,
    page,
  });

  const [usuarios, listado] = await Promise.all([
    usuariosPromise,
    listadoPromise,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Historial de ventas</h1>
          <p className="text-sm text-muted-foreground">
            {permissions.verTodas
              ? 'Ventas registradas en la sucursal.'
              : 'Tus ventas registradas.'}
          </p>
        </div>
        <Button asChild>
          <Link href="/ventas/nueva">
            <Plus className="h-4 w-4" />
            Nueva venta
          </Link>
        </Button>
      </div>

      <FiltrosVentas
        permissions={permissions}
        usuarios={usuarios}
        filtrosActuales={{
          desde: desdeStr,
          hasta: hastaStr,
          usuario: permissions.filtrarPorUsuario ? usuarioStr : '',
          metodo: metodoStr,
          ocultarAnuladas,
        }}
      />

      <TablaVentas
        ventas={listado.ventas}
        hayMas={listado.hayMas}
        page={page}
        permissions={permissions}
        currentUserId={user.id}
      />
    </div>
  );
}
