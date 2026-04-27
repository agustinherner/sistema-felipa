import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requireAuth } from '@/lib/auth/mock';
import { prisma } from '@/lib/db';
import {
  getCategorias,
  getProductosListado,
} from '@/lib/productos/queries';
import { ProductosFilters } from './_components/ProductosFilters';
import { ProductosTable } from './_components/ProductosTable';
import { ProductosPagination } from './_components/ProductosPagination';
import { EmptyState } from './_components/EmptyState';

const PAGE_SIZE = 20;

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

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireAuth(['admin', 'vendedor']);
  const isAdmin = user.role === 'admin';

  const q = parseString(searchParams.q);
  const categoriaId = parseString(searchParams.categoriaId);
  const page = parsePage(searchParams.page);

  const [categorias, listado, hayAlgunProducto] = await Promise.all([
    getCategorias(),
    getProductosListado({
      q: q || undefined,
      categoriaId: categoriaId || undefined,
      sucursalId: user.sucursalId,
      page,
      pageSize: PAGE_SIZE,
    }),
    prisma.producto.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(listado.total / PAGE_SIZE));
  if (page > totalPages && listado.total > 0) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (categoriaId) params.set('categoriaId', categoriaId);
    if (totalPages > 1) params.set('page', String(totalPages));
    const qs = params.toString();
    redirect(qs ? `/productos?${qs}` : '/productos');
  }

  const hayFiltros = q.length > 0 || categoriaId.length > 0;
  const cleanSearchParams: Record<string, string> = {};
  if (q) cleanSearchParams.q = q;
  if (categoriaId) cleanSearchParams.categoriaId = categoriaId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Productos</h1>
        {isAdmin && (
          <Button asChild>
            <Link href="/productos/nuevo">
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Link>
          </Button>
        )}
      </div>

      <ProductosFilters
        categorias={categorias}
        initialQ={q}
        initialCategoriaId={categoriaId}
      />

      {listado.productos.length === 0 ? (
        hayAlgunProducto || hayFiltros ? (
          <EmptyState kind="sin-resultados" />
        ) : (
          <EmptyState kind="sin-productos" isAdmin={isAdmin} />
        )
      ) : (
        <>
          <ProductosTable productos={listado.productos} role={user.role} />
          <ProductosPagination
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
