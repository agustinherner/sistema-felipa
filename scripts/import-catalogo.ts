/**
 * Importador del catálogo normalizado.
 *
 * Lee `scripts/catalogo.xlsx` (hoja "Catálogo") y crea Categorías, Productos,
 * Variantes y Stock (cantidad 0) en la DB que apunta `DATABASE_URL`.
 *
 * Idempotente: corre dos veces seguidas sin duplicar nada.
 *
 *  - Categoría: buscar por nombre (case-insensitive), crear si no existe.
 *  - Producto: buscar por nombre exacto (case-insensitive).
 *      * crear con precioBase/costoBase de la fila (0 si SIN PRECIO).
 *      * `incompleto = true` si falta precio o costo.
 *      * en re-corrida sólo actualiza precio/costo si estaba en 0 y ahora trae
 *        un valor > 0 (no pisa lo ya cargado).
 *  - Variante: si la fila no trae nombre de variante, se usa "Única".
 *      * código de barras: se setea al crear; si la variante ya existe NO se
 *        toca (puede haber sido ajustado a mano).
 *      * override de precio/costo sólo si difiere del producto.
 *  - Stock: cantidad = 0 en Felipa 1 si no existe. Si ya existe, no se toca.
 *
 * Uso (local Docker):
 *   npx tsx scripts/import-catalogo.ts
 *
 * Uso (Neon producción, conexión directa):
 *   DATABASE_URL="postgresql://..." npx tsx scripts/import-catalogo.ts
 */

import path from 'path';
import { Prisma, PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

const SUCURSAL_NOMBRE = 'Felipa 1';
const HOJA = 'Catálogo';
const VARIANTE_UNICA = 'Única';
const ARCHIVO = path.resolve(__dirname, 'catalogo.xlsx');

type Fila = {
  categoria: string;
  producto: string;
  variante: string;
  costo: number;
  precio: number;
  codigoBarras: string | null;
  notas: string | null;
  estado: string;
};

type Stats = {
  categoriasCreadas: number;
  categoriasExistentes: number;
  productosCreados: number;
  productosActualizados: number;
  productosSinCambios: number;
  variantesCreadas: number;
  variantesExistentes: number;
  stocksCreados: number;
  stocksExistentes: number;
  filasIgnoradas: number;
};

function toStr(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function toNum(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function leerFilas(): Fila[] {
  const wb = XLSX.readFile(ARCHIVO);
  const ws = wb.Sheets[HOJA];
  if (!ws) {
    throw new Error(`No se encontró la hoja "${HOJA}" en ${ARCHIVO}`);
  }
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: null,
    raw: true,
  });

  return rawRows
    .map((r) => ({
      categoria: toStr(r['Categoría']),
      producto: toStr(r['Producto']),
      variante: toStr(r['Variante']),
      costo: toNum(r['Costo $']),
      precio: toNum(r['Precio venta $']),
      codigoBarras: toStr(r['Código barras']) || null,
      notas: toStr(r['Notas']) || null,
      estado: toStr(r['Estado']),
    }))
    .filter((r) => r.categoria && r.producto);
}

async function obtenerSucursalId(): Promise<string> {
  const s = await prisma.sucursal.findFirst({
    where: { nombre: { equals: SUCURSAL_NOMBRE, mode: 'insensitive' } },
  });
  if (s) return s.id;
  const alt = await prisma.sucursal.findFirst({ orderBy: { creadaEn: 'asc' } });
  if (!alt) {
    throw new Error(
      `No existe ninguna sucursal en la DB. Corré el seed primero.`,
    );
  }
  console.warn(
    `⚠ No se encontró sucursal "${SUCURSAL_NOMBRE}", usando "${alt.nombre}".`,
  );
  return alt.id;
}

async function obtenerOCrearCategoria(
  nombre: string,
  cache: Map<string, string>,
  stats: Stats,
): Promise<string> {
  const key = nombre.toLowerCase();
  const hit = cache.get(key);
  if (hit) return hit;

  const existente = await prisma.categoria.findFirst({
    where: { nombre: { equals: nombre, mode: 'insensitive' } },
  });
  if (existente) {
    stats.categoriasExistentes += 1;
    cache.set(key, existente.id);
    return existente.id;
  }

  const creada = await prisma.categoria.create({ data: { nombre } });
  stats.categoriasCreadas += 1;
  cache.set(key, creada.id);
  return creada.id;
}

async function obtenerOCrearProducto(
  filas: Fila[],
  categoriaId: string,
  stats: Stats,
): Promise<{ id: string; precioBase: Prisma.Decimal; costoBase: Prisma.Decimal }> {
  // Precio/costo base: primer valor > 0 encontrado entre las filas del producto.
  const filaConPrecio = filas.find((f) => f.precio > 0);
  const filaConCosto = filas.find((f) => f.costo > 0);
  const precioXlsx = filaConPrecio?.precio ?? 0;
  const costoXlsx = filaConCosto?.costo ?? 0;
  const incompletoXlsx = !(precioXlsx > 0 && costoXlsx > 0);

  const nombre = filas[0].producto;

  const existente = await prisma.producto.findFirst({
    where: { nombre: { equals: nombre, mode: 'insensitive' } },
  });

  if (!existente) {
    const creado = await prisma.producto.create({
      data: {
        nombre,
        categoriaId,
        precioBase: new Prisma.Decimal(precioXlsx),
        costoBase: new Prisma.Decimal(costoXlsx),
        incompleto: incompletoXlsx,
        activo: true,
      },
    });
    stats.productosCreados += 1;
    return {
      id: creado.id,
      precioBase: creado.precioBase,
      costoBase: creado.costoBase,
    };
  }

  // Idempotencia: sólo subir 0 → valor cargado. No pisar precios existentes.
  const precioActual = Number(existente.precioBase);
  const costoActual = Number(existente.costoBase);
  const nuevoPrecio = precioActual === 0 && precioXlsx > 0 ? precioXlsx : precioActual;
  const nuevoCosto = costoActual === 0 && costoXlsx > 0 ? costoXlsx : costoActual;
  const nuevoIncompleto = !(nuevoPrecio > 0 && nuevoCosto > 0);

  const cambia =
    nuevoPrecio !== precioActual ||
    nuevoCosto !== costoActual ||
    nuevoIncompleto !== existente.incompleto;

  if (!cambia) {
    stats.productosSinCambios += 1;
    return {
      id: existente.id,
      precioBase: existente.precioBase,
      costoBase: existente.costoBase,
    };
  }

  const actualizado = await prisma.producto.update({
    where: { id: existente.id },
    data: {
      precioBase: new Prisma.Decimal(nuevoPrecio),
      costoBase: new Prisma.Decimal(nuevoCosto),
      incompleto: nuevoIncompleto,
    },
  });
  stats.productosActualizados += 1;
  return {
    id: actualizado.id,
    precioBase: actualizado.precioBase,
    costoBase: actualizado.costoBase,
  };
}

async function obtenerOCrearVariante(
  fila: Fila,
  producto: { id: string; precioBase: Prisma.Decimal; costoBase: Prisma.Decimal },
  stats: Stats,
): Promise<string> {
  const nombreVar = fila.variante || VARIANTE_UNICA;

  const existente = await prisma.variante.findFirst({
    where: {
      productoId: producto.id,
      nombre: { equals: nombreVar, mode: 'insensitive' },
    },
  });
  if (existente) {
    stats.variantesExistentes += 1;
    return existente.id;
  }

  // Override sólo si el valor de la fila difiere del producto y es > 0.
  const precioBaseNum = Number(producto.precioBase);
  const costoBaseNum = Number(producto.costoBase);
  const precioOverride =
    fila.precio > 0 && fila.precio !== precioBaseNum
      ? new Prisma.Decimal(fila.precio)
      : null;
  const costoOverride =
    fila.costo > 0 && fila.costo !== costoBaseNum
      ? new Prisma.Decimal(fila.costo)
      : null;

  const creada = await prisma.variante.create({
    data: {
      productoId: producto.id,
      nombre: nombreVar,
      codigoBarras: fila.codigoBarras,
      precio: precioOverride,
      costo: costoOverride,
      activa: true,
    },
  });
  stats.variantesCreadas += 1;
  return creada.id;
}

async function asegurarStock(
  varianteId: string,
  sucursalId: string,
  stats: Stats,
): Promise<void> {
  const existente = await prisma.stock.findUnique({
    where: { varianteId_sucursalId: { varianteId, sucursalId } },
  });
  if (existente) {
    stats.stocksExistentes += 1;
    return;
  }
  await prisma.stock.create({
    data: { varianteId, sucursalId, cantidad: 0 },
  });
  stats.stocksCreados += 1;
}

async function main() {
  console.log(`📄 Leyendo ${ARCHIVO}`);
  const filas = leerFilas();
  console.log(`✔ ${filas.length} filas válidas`);

  const sucursalId = await obtenerSucursalId();
  console.log(`✔ Sucursal destino: ${sucursalId}`);

  const stats: Stats = {
    categoriasCreadas: 0,
    categoriasExistentes: 0,
    productosCreados: 0,
    productosActualizados: 0,
    productosSinCambios: 0,
    variantesCreadas: 0,
    variantesExistentes: 0,
    stocksCreados: 0,
    stocksExistentes: 0,
    filasIgnoradas: 0,
  };
  const categoriaCache = new Map<string, string>();

  // Agrupar filas por producto (case-insensitive) para crearlo una sola vez.
  const grupos = new Map<string, Fila[]>();
  for (const f of filas) {
    const key = `${f.categoria.toLowerCase()}|${f.producto.toLowerCase()}`;
    const arr = grupos.get(key) ?? [];
    arr.push(f);
    grupos.set(key, arr);
  }

  for (const grupoFilas of Array.from(grupos.values())) {
    const primera = grupoFilas[0];
    const categoriaId = await obtenerOCrearCategoria(
      primera.categoria,
      categoriaCache,
      stats,
    );
    const producto = await obtenerOCrearProducto(grupoFilas, categoriaId, stats);

    // Si el grupo tiene una sola fila sin nombre de variante, mapea a "Única".
    // Si tiene varias filas, cada una es una variante distinta.
    for (const fila of grupoFilas) {
      const varianteId = await obtenerOCrearVariante(fila, producto, stats);
      await asegurarStock(varianteId, sucursalId, stats);
    }
  }

  console.log('\n📊 Resumen');
  console.log(
    `  Categorías  — creadas: ${stats.categoriasCreadas}, existentes: ${stats.categoriasExistentes}`,
  );
  console.log(
    `  Productos   — creados: ${stats.productosCreados}, actualizados: ${stats.productosActualizados}, sin cambios: ${stats.productosSinCambios}`,
  );
  console.log(
    `  Variantes   — creadas: ${stats.variantesCreadas}, existentes: ${stats.variantesExistentes}`,
  );
  console.log(
    `  Stocks F1   — creados: ${stats.stocksCreados}, existentes: ${stats.stocksExistentes}`,
  );
}

main()
  .catch((err) => {
    console.error('Error fatal:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
