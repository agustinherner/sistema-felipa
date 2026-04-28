import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/mock';
import { prisma } from '@/lib/db';
import { getCategorias } from '@/lib/productos/queries';
import { getStockListado } from '@/lib/stock/queries';
import { StockTable, type StockFila } from './_components/StockTable';
import { StockFilters } from './_components/StockFilters';
import { StockPagination } from './_components/StockPagination';

const PAGE_SIZE = 30;

function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return 1;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

function parseString(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ?? '';
}

function parseBool(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === '1' || raw === 'true';
}

export default async function StockPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireAuth(['ADMIN']);

  const q = parseString(searchParams.q);
  const categoriaId = parseString(searchParams.categoriaId);
  const soloBajo = parseBool(searchParams.soloBajo);
  const soloNegativo = parseBool(searchParams.soloNegativo);
  const incluirInactivas = parseBool(searchParams.inactivas);
  const page = parsePage(searchParams.page);

  const sucursal = await prisma.sucursal.findFirst({
    where: { activa: true },
    orderBy: { creadaEn: 'asc' },
    select: { id: true },
  });
  if (!sucursal) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Stock</h1>
        <p className="text-sm text-destructive">
          No hay sucursales activas configuradas.
        </p>
      </div>
    );
  }

  const [categorias, listado] = await Promise.all([
    getCategorias(),
    getStockListado({
      q: q || undefined,
      categoriaId: categoriaId || undefined,
      sucursalId: sucursal.id,
      soloStockBajo: soloBajo,
      soloStockNegativo: soloNegativo,
      incluirInactivas,
      page,
      pageSize: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(listado.total / PAGE_SIZE));
  if (page > totalPages && listado.total > 0) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (categoriaId) params.set('categoriaId', categoriaId);
    if (soloBajo) params.set('soloBajo', '1');
    if (soloNegativo) params.set('soloNegativo', '1');
    if (incluirInactivas) params.set('inactivas', '1');
    if (totalPages > 1) params.set('page', String(totalPages));
    const qs = params.toString();
    redirect(qs ? `/stock?${qs}` : '/stock');
  }

  const cleanSearchParams: Record<string, string> = {};
  if (q) cleanSearchParams.q = q;
  if (categoriaId) cleanSearchParams.categoriaId = categoriaId;
  if (soloBajo) cleanSearchParams.soloBajo = '1';
  if (soloNegativo) cleanSearchParams.soloNegativo = '1';
  if (incluirInactivas) cleanSearchParams.inactivas = '1';

  const filas: StockFila[] = listado.filas;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Stock</h1>
        <p className="text-sm text-muted-foreground">
          {listado.total}{' '}
          {listado.total === 1 ? 'variante' : 'variantes'}
        </p>
      </div>
      <StockFilters
        categorias={categorias}
        initialQ={q}
        initialCategoriaId={categoriaId}
        initialSoloBajo={soloBajo}
        initialSoloNegativo={soloNegativo}
        initialIncluirInactivas={incluirInactivas}
      />
      {filas.length === 0 ? (
        <div className="rounded-md border bg-background p-8 text-center text-sm text-muted-foreground">
          No hay variantes que coincidan con los filtros.
        </div>
      ) : (
        <>
          <StockTable filas={filas} />
          <StockPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={listado.total}
            searchParams={cleanSearchParams}
          />
        </>
      )}
    </div>
  );
}
