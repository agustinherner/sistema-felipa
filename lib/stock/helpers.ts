import type { TipoMovimiento } from '@prisma/client';

export function tipoMovimientoLabel(tipo: TipoMovimiento): string {
  switch (tipo) {
    case 'INGRESO':
      return 'Ingreso';
    case 'VENTA':
      return 'Venta';
    case 'AJUSTE_ROTURA':
      return 'Rotura';
    case 'AJUSTE_ROBO':
      return 'Robo / pérdida';
    case 'AJUSTE_CONTEO':
      return 'Ajuste de conteo';
    case 'DEVOLUCION':
      return 'Devolución';
  }
}

export type StockBadgeKind = 'sin-stock' | 'negativo' | 'bajo' | 'ok';

export function clasificarStock(cantidad: number): StockBadgeKind {
  if (cantidad < 0) return 'negativo';
  if (cantidad === 0) return 'sin-stock';
  if (cantidad <= 3) return 'bajo';
  return 'ok';
}

export type HistorialMovimientoView = {
  id: string;
  creadoEnTexto: string;
  tipoLabel: string;
  cantidad: number;
  motivo: string | null;
  usuarioNombre: string;
  ventaId: string | null;
  ventaCodigoCorto: string | null;
};
