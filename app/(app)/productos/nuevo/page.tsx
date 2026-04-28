import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireAuth } from '@/lib/auth/mock';
import { getCategorias } from '@/lib/productos/queries';
import { ProductoForm } from '../_components/ProductoForm';
import { nuevaVarianteVacia } from '@/lib/productos/helpers';

function parseString(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ?? '';
}

export default async function NuevoProductoPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireAuth(['ADMIN']);
  const categorias = await getCategorias();

  const categoriaPersistida = parseString(searchParams.categoriaId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/productos"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          aria-label="Volver a productos"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold">Nuevo producto</h1>
      </div>

      <ProductoForm
        modo="alta"
        categorias={categorias}
        categoriaPersistidaId={categoriaPersistida}
        valoresIniciales={{
          nombre: '',
          descripcion: '',
          categoriaId: '',
          precioBase: '',
          costoBase: '',
          tieneVariantes: false,
          variantes: [nuevaVarianteVacia()],
        }}
      />
    </div>
  );
}
