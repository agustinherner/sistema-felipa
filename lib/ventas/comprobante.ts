import type {
  MetodoPagoItem,
  MetodoPagoVenta,
  VentaDetalle,
} from './queries';

/**
 * Datos del negocio que se inyectan en el comprobante. El módulo es puro: el
 * caller los lee de Configuracion y los pasa acá. Campos opcionales se omiten
 * (no se imprime "null").
 */
export type NegocioInfo = {
  nombreNegocio: string;
  direccion: string | null;
  telefono: string | null;
  cuit: string | null;
};

const FECHA_FMT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const METODO_LABEL: Record<MetodoPagoVenta, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
};

function fmtMoneda(n: number): string {
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

function fmtDescuentoLabel(v: VentaDetalle): string {
  if (v.descuentoTipo === 'PORCENTAJE' && v.descuentoValor !== null) {
    const n = v.descuentoValor;
    const txt = Number.isInteger(n) ? n.toString() : n.toFixed(2);
    return `Descuento (${txt}%)`;
  }
  if (v.descuentoTipo === 'MONTO' && v.descuentoValor !== null) {
    return `Descuento (${fmtMoneda(v.descuentoValor)})`;
  }
  return 'Descuento';
}

function fmtMetodos(metodos: MetodoPagoItem[]): string {
  if (metodos.length === 0) return '—';
  if (metodos.length === 1) return METODO_LABEL[metodos[0].metodo];
  return metodos
    .map((m) => `${METODO_LABEL[m.metodo]} ${fmtMoneda(m.monto)}`)
    .join(' + ');
}

function nombreItem(
  productoNombre: string,
  varianteNombre: string,
  esUnica: boolean,
): string {
  if (esUnica) return productoNombre;
  return `${productoNombre} (${varianteNombre})`;
}

/**
 * Texto plano del comprobante, listo para enviar por WhatsApp.
 */
export function generarTextoComprobante(
  venta: VentaDetalle,
  negocio: NegocioInfo,
): string {
  const fecha = FECHA_FMT.format(new Date(venta.creadaEn));
  const lineas: string[] = [];

  lineas.push(`🧾 Comprobante — ${negocio.nombreNegocio}`);
  if (negocio.direccion) lineas.push(negocio.direccion);
  if (negocio.telefono) lineas.push(`Tel: ${negocio.telefono}`);
  if (negocio.cuit) lineas.push(`CUIT: ${negocio.cuit}`);
  lineas.push(`Venta: ${venta.codigoCorto}`);
  lineas.push(`Fecha: ${fecha}`);
  lineas.push('');

  for (const it of venta.items) {
    const nombre = nombreItem(
      it.productoNombre,
      it.varianteNombre,
      it.esVarianteUnicaImplicita,
    );
    lineas.push(`• ${nombre} x${it.cantidad} — ${fmtMoneda(it.subtotal)}`);
  }
  lineas.push('');

  if (venta.aplicaDescuento) {
    lineas.push(`Subtotal: ${fmtMoneda(venta.subtotal)}`);
    lineas.push(
      `${fmtDescuentoLabel(venta)}: -${fmtMoneda(venta.descuentoTotal)}`,
    );
  }
  lineas.push(`Total: ${fmtMoneda(venta.total)}`);
  lineas.push(`Método: ${fmtMetodos(venta.metodosPago)}`);
  lineas.push('');
  lineas.push('¡Gracias por tu compra!');

  return lineas.join('\n');
}

export function urlWhatsappComprobante(
  venta: VentaDetalle,
  negocio: NegocioInfo,
): string {
  const texto = generarTextoComprobante(venta, negocio);
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}
