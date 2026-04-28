'use client';

import { useEffect, useState } from 'react';
import { CornerDownRight } from 'lucide-react';
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
import { BadgeStock } from './BadgeStock';
import { AjusteModal } from './AjusteModal';
import { HistorialModal } from './HistorialModal';

export type StockFila = {
  productoId: string;
  productoNombre: string;
  productoActivo: boolean;
  categoriaNombre: string | null;
  varianteId: string;
  varianteNombre: string;
  varianteActiva: boolean;
  stockActual: number;
  sucursalId: string;
};

type ModalState =
  | { kind: 'ajuste'; fila: StockFila }
  | { kind: 'historial'; fila: StockFila }
  | null;

export function StockTable({ filas }: { filas: StockFila[] }) {
  const [modal, setModal] = useState<ModalState>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 5000);
    return () => clearTimeout(t);
  }, [banner]);

  function onAjusteOk(msg: string) {
    setBanner(msg);
    setModal(null);
  }

  let prevProductoId: string | null = null;

  return (
    <div className="space-y-3">
      {banner && (
        <div
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          {banner}
        </div>
      )}
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Variante</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-48 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((f) => {
              const sameAsPrev = prevProductoId === f.productoId;
              prevProductoId = f.productoId;
              return (
                <TableRow key={f.varianteId}>
                  <TableCell>
                    {sameAsPrev ? (
                      <CornerDownRight
                        className="h-4 w-4 text-muted-foreground/40"
                        aria-hidden
                      />
                    ) : (
                      <span
                        className={cn(
                          'font-medium',
                          !f.productoActivo &&
                            'text-muted-foreground line-through',
                        )}
                      >
                        {f.productoNombre}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          !f.varianteActiva &&
                            'text-muted-foreground line-through',
                        )}
                      >
                        {f.varianteNombre}
                      </span>
                      {!f.varianteActiva && (
                        <Badge
                          variant="secondary"
                          className="text-[10px]"
                        >
                          Inactiva
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {f.categoriaNombre ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <BadgeStock cantidad={f.stockActual} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setModal({ kind: 'ajuste', fila: f })
                        }
                      >
                        Ajustar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setModal({ kind: 'historial', fila: f })
                        }
                      >
                        Historial
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {modal?.kind === 'ajuste' && (
        <AjusteModal
          fila={modal.fila}
          onClose={() => setModal(null)}
          onSuccess={onAjusteOk}
        />
      )}
      {modal?.kind === 'historial' && (
        <HistorialModal
          fila={modal.fila}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
