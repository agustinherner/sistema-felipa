import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, PackagePlus } from 'lucide-react';
import { TipoMovimiento } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { requireAuth } from '@/lib/auth/mock';
import { prisma } from '@/lib/db';
import {
  getMovimientosListado,
  getUsuariosActivos,
  getVarianteEtiqueta,
} from '@/lib/stock/queries';
import { MovimientosFilters } from './_components/MovimientosFilters';
import { MovimientosTable } from './_components/MovimientosTable';
import { MovimientosPagination } from './_components/MovimientosPagination';

const PAGE_SIZE = 50;

const TIPOS_VALIDOS = new Set<TipoMovimiento>([
  'INGRESO',
  'VENTA',
  'AJUSTE_ROTURA',
  'AJUSTE_ROBO',
  'AJUSTE_CONTEO',
  'DEVOLUCION',
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

function parseFecha(value: string): Date | null {
  if (!value) return null;
  // Esperamos formato YYYY-MM-DD del input type=date
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function parseTipo(value: string): TipoMovimiento | undefined {
  if (TIPOS_VALIDOS.has(value as TipoMovimiento)) {
    return value as TipoMovimiento;
  }
  return undefined;
}

function buildSearchString(params: Record<string, string>): string {
  const u = new URLSearchParams(params);
  const s = u.toString();
  return s ? `?${s}` : '';
}

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireAuth(['ADMIN']);

  const desdeStr = parseString(searchParams.desde);
  const hastaStr = parseString(searchParams.hasta);
  const tipoStr = parseString(searchParams.tipo);
  const varianteId = parseString(searchParams.varianteId);
  const usuarioId = parseString(searchParams.usuarioId);
  const motivo = parseString(searchParams.motivo);
  const page = parsePage(searchParams.page);

  const sucursal = await prisma.sucursal.findFirst({
    where: { activa: true },
    orderBy: { creadaEn: 'asc' },
    select: { id: true },
  });
  if (!sucursal) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Movimientos de stock</h1>
        <p className="text-sm text-destructive">
          No hay sucursales activas configuradas.
        </p>
      </div>
    );
  }

  const desde = parseFecha(desdeStr) ?? undefined;
  const hasta = parseFecha(hastaStr) ?? undefined;
  const tipo = parseTipo(tipoStr);
  const usuariosPromise = getUsuariosActivos();
  const variantePromise = varianteId
    ? getVarianteEtiqueta(varianteId)
    : Promise.resolve(null);
  const listadoPromise = getMovimientosListado({
    sucursalId: sucursal.id,
    desde,
    hasta,
    tipo,
    varianteId: varianteId || undefined,
    usuarioId: usuarioId || undefined,
    motivo: motivo || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const [usuarios, varianteSeleccionada, listado] = await Promise.all([
    usuariosPromise,
    variantePromise,
    listadoPromise,
  ]);

  const totalPages = Math.max(1, Math.ceil(listado.total / PAGE_SIZE));
  const cleanParams: Record<string, string> = {};
  if (desdeStr) cleanParams.desde = desdeStr;
  if (hastaStr) cleanParams.hasta = hastaStr;
  if (tipo) cleanParams.tipo = tipo;
  if (varianteId) cleanParams.varianteId = varianteId;
  if (usuarioId) cleanParams.usuarioId = usuarioId;
  if (motivo) cleanParams.motivo = motivo;

  if (page > totalPages && listado.total > 0) {
    const params = { ...cleanParams };
    if (totalPages > 1) params.page = String(totalPages);
    redirect(`/stock/movimientos${buildSearchString(params)}`);
  }

  const usuarioSeleccionado = usuarioId
    ? usuarios.find((u) => u.id === usuarioId) ?? null
    : null;

  const usingDefaults = !desdeStr && !hastaStr;
  const hayFiltros =
    Boolean(desdeStr) ||
    Boolean(hastaStr) ||
    Boolean(tipo) ||
    Boolean(varianteId) ||
    Boolean(usuarioId) ||
    Boolean(motivo);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/stock"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
            aria-label="Volver a stock"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-semibold">Movimientos de stock</h1>
        </div>
        <Button asChild>
          <Link href="/stock/ingreso">
            <PackagePlus className="h-4 w-4" />
            Ingreso de mercadería
          </Link>
        </Button>
      </div>

      <MovimientosFilters
        usuarios={usuarios}
        initialDesde={desdeStr}
        initialHasta={hastaStr}
        initialTipo={tipo ?? ''}
        initialVarianteId={varianteId}
        initialVarianteLabel={varianteSeleccionada?.label ?? null}
        initialUsuarioId={usuarioId}
        initialMotivo={motivo}
        sucursalId={sucursal.id}
        usingDefaults={usingDefaults}
        usuarioSeleccionadoNombre={usuarioSeleccionado?.nombre ?? null}
      />

      <p className="text-sm text-muted-foreground">
        {listado.total === 0 ? (
          'No hay movimientos en el rango filtrado.'
        ) : (
          <>
            Mostrando{' '}
            <span className="font-medium text-foreground">
              {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, listado.total)}
            </span>{' '}
            de{' '}
            <span className="font-medium text-foreground">
              {listado.total}
            </span>{' '}
            {listado.total === 1 ? 'movimiento' : 'movimientos'}
          </>
        )}
      </p>

      {listado.filas.length === 0 ? (
        <div className="rounded-md border bg-background p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No hay movimientos en el rango filtrado.
          </p>
          {hayFiltros && (
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/stock/movimientos">Limpiar filtros</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <MovimientosTable filas={listado.filas} />
          <MovimientosPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={listado.total}
            searchParams={cleanParams}
          />
        </>
      )}
    </div>
  );
}
