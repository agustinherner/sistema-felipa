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

export type VarianteParaIngreso = {
  varianteId: string;
  productoNombre: string;
  varianteNombre: string;
  codigoBarras: string | null;
  esVarianteUnicaImplicita: boolean;
  varianteActiva: boolean;
  productoActivo: boolean;
  stockActual: number;
};

export function esNombreVarianteUnica(nombre: string): boolean {
  return nombre === 'Única' || nombre === 'Único';
}

export function etiquetaVariante(opts: {
  productoNombre: string;
  varianteNombre: string;
  esVarianteUnicaImplicita: boolean;
}): string {
  if (opts.esVarianteUnicaImplicita) return opts.productoNombre;
  return `${opts.productoNombre} · ${opts.varianteNombre}`;
}

export function construirMotivoIngreso(opts: {
  identificador?: string | null;
  proveedor?: string | null;
  observaciones?: string | null;
}): string {
  const partes = ['Ingreso'];
  const id = opts.identificador?.trim();
  const prov = opts.proveedor?.trim();
  const obs = opts.observaciones?.trim();
  if (id) partes.push(id);
  if (prov) partes.push(prov);
  if (obs) partes.push(obs);
  return partes.join(' · ');
}
