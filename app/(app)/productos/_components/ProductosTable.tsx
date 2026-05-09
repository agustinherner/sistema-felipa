import Link from 'next/link';
import { Pencil, Asterisk } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProductoListadoItem } from '@/lib/productos/queries';
import type { ProductoPermissions } from '@/lib/productos/permissions';

export function ProductosTable({
  productos,
  permissions,
}: {
  productos: ProductoListadoItem[];
  permissions: ProductoPermissions;
}) {
  return (
    <div className="rounded-md border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Variantes</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            {permissions.verCosto && (
              <TableHead className="text-right">Costo</TableHead>
            )}
            <TableHead className="text-right">Stock</TableHead>
            {permissions.editar && (
              <TableHead className="w-16 text-right">Acciones</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {productos.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'font-medium',
                      !p.activo && 'text-muted-foreground line-through',
                    )}
                  >
                    {p.nombre}
                  </span>
                  {!p.activo && (
                    <Badge variant="secondary" className="text-[10px]">
                      Inactivo
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {p.categoriaNombre ?? (
                  <span className="text-muted-foreground">Sin categoría</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {p.cantidadVariantes === 1
                    ? '1 variante'
                    : `${p.cantidadVariantes} variantes`}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <span className="inline-flex items-center justify-end gap-1">
                  {p.precioBaseFormateado}
                  {p.tieneOverrides && (
                    <span
                      title="Algunas variantes tienen precio o costo propio"
                      aria-label="Algunas variantes tienen precio o costo propio"
                      className="text-muted-foreground"
                    >
                      <Asterisk className="h-3 w-3" />
                    </span>
                  )}
                </span>
              </TableCell>
              {permissions.verCosto && (
                <TableCell className="text-right tabular-nums">
                  {p.costoBaseFormateado}
                </TableCell>
              )}
              <TableCell className="text-right tabular-nums">
                {p.stockTotal}
              </TableCell>
              {permissions.editar && (
                <TableCell className="text-right">
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${p.nombre}`}
                  >
                    <Link href={`/productos/${p.id}/editar`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
