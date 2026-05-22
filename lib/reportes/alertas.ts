import { prisma } from '@/lib/db';

const HORAS_TURNO_LARGO = 12;

export type TurnoLargo = {
  id: string;
  vendedor: string;
  aperturaEn: string;
  horasAbierto: number;
};

export type StockNegativoItem = {
  varianteId: string;
  productoNombre: string;
  varianteNombre: string;
  cantidad: number;
};

export type ProductoIncompleto = {
  productoId: string;
  nombre: string;
};

export type Alertas = {
  turnosLargos: TurnoLargo[];
  stockNegativo: StockNegativoItem[];
  productosIncompletos: ProductoIncompleto[];
};

/**
 * Alertas operativas para el dashboard del admin:
 *  - turnosLargos: turnos abiertos hace más de 12 h (probablemente se olvidaron de cerrar).
 *  - stockNegativo: variantes con stock < 0 (rotura de invariante; debería ser 0 raro).
 *  - productosIncompletos: productos cargados rápido desde la venta y aún sin completar
 *    (costoBase / categoría faltantes). Se auto-desmarcan cuando el admin los completa.
 *
 * Devoluciones pendientes NO va: no existe ese estado en el modelo (las devoluciones
 * son atómicas).
 */
export async function alertas(): Promise<Alertas> {
  const ahora = new Date();
  const hace12h = new Date(ahora.getTime() - HORAS_TURNO_LARGO * 60 * 60 * 1000);

  const [turnosAbiertosLargos, stocksNeg, incompletos] = await Promise.all([
    prisma.turno.findMany({
      where: { cierreEn: null, aperturaEn: { lt: hace12h } },
      orderBy: { aperturaEn: 'asc' },
      select: {
        id: true,
        aperturaEn: true,
        user: { select: { nombre: true } },
      },
    }),
    prisma.stock.findMany({
      where: { cantidad: { lt: 0 } },
      orderBy: { cantidad: 'asc' },
      select: {
        varianteId: true,
        cantidad: true,
        variante: {
          select: {
            nombre: true,
            producto: { select: { nombre: true } },
          },
        },
      },
    }),
    prisma.producto.findMany({
      where: { incompleto: true, activo: true },
      orderBy: { creadoEn: 'desc' },
      select: { id: true, nombre: true },
    }),
  ]);

  return {
    turnosLargos: turnosAbiertosLargos.map((t) => ({
      id: t.id,
      vendedor: t.user.nombre,
      aperturaEn: t.aperturaEn.toISOString(),
      horasAbierto:
        (ahora.getTime() - t.aperturaEn.getTime()) / (1000 * 60 * 60),
    })),
    stockNegativo: stocksNeg.map((s) => ({
      varianteId: s.varianteId,
      productoNombre: s.variante.producto.nombre,
      varianteNombre: s.variante.nombre,
      cantidad: s.cantidad,
    })),
    productosIncompletos: incompletos.map((p) => ({
      productoId: p.id,
      nombre: p.nombre,
    })),
  };
}
