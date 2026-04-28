import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireAuth } from '@/lib/auth/mock';
import { prisma } from '@/lib/db';
import { getCategorias } from '@/lib/productos/queries';
import { ProductoForm } from '../../_components/ProductoForm';
import type { VarianteFormState } from '@/lib/productos/helpers';
import { BotonDesactivar } from '../../_components/BotonDesactivar';

function decimalToString(d: { toString: () => string } | null | undefined): string {
  if (d == null) return '';
  const s = d.toString();
  return s;
}

export default async function EditarProductoPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAuth(['ADMIN']);

  const [producto, categorias] = await Promise.all([
    prisma.producto.findUnique({
      where: { id: params.id },
      include: {
        variantes: {
          where: { activa: true },
          orderBy: { creadaEn: 'asc' },
        },
      },
    }),
    getCategorias(),
  ]);

  if (!producto) notFound();

  const variantesActivas = producto.variantes;

  const esVarianteUnicaImplicita =
    variantesActivas.length === 1 &&
    variantesActivas[0].nombre === 'Única' &&
    !variantesActivas[0].codigoBarras &&
    variantesActivas[0].precio === null &&
    variantesActivas[0].costo === null;

  const tieneVariantes = !esVarianteUnicaImplicita;

  let uidSeed = 0;
  const nuevoUid = () => {
    uidSeed += 1;
    return `vsrv-${producto.id}-${uidSeed}`;
  };

  const variantesFormState: VarianteFormState[] = variantesActivas.map((v) => ({
    uid: nuevoUid(),
    id: v.id,
    nombre: v.nombre,
    codigoBarras: v.codigoBarras ?? '',
    precioPropio: v.precio !== null || v.costo !== null,
    precio: decimalToString(v.precio),
    costo: decimalToString(v.costo),
    stockInicial: '',
  }));

  if (variantesFormState.length === 0) {
    variantesFormState.push({
      uid: nuevoUid(),
      nombre: '',
      codigoBarras: '',
      precioPropio: false,
      precio: '',
      costo: '',
      stockInicial: '',
    });
  }

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
        <h1 className="text-2xl font-semibold">Editar producto</h1>
      </div>

      {!producto.activo && (
        <div className="rounded-md border border-amber-500/50 bg-amber-50 p-3 text-sm text-amber-900">
          Este producto está inactivo. Reactivalo desde el botón al pie.
        </div>
      )}

      <ProductoForm
        modo="edicion"
        productoId={producto.id}
        categorias={categorias}
        valoresIniciales={{
          id: producto.id,
          nombre: producto.nombre,
          descripcion: producto.descripcion ?? '',
          categoriaId: producto.categoriaId ?? '',
          precioBase: decimalToString(producto.precioBase),
          costoBase: decimalToString(producto.costoBase),
          tieneVariantes,
          variantes: variantesFormState,
        }}
      />

      <div className="flex justify-end border-t pt-4">
        <BotonDesactivar productoId={producto.id} activo={producto.activo} />
      </div>
    </div>
  );
}
