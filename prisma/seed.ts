import { Prisma, PrismaClient, Rol, TipoMovimiento } from '@prisma/client';
import { generarCodigoVenta } from '../lib/db/codigoVenta';

const prisma = new PrismaClient();

type SeedVariante = {
  nombre: string;
  atributos?: Prisma.InputJsonValue;
  codigoBarras?: string;
  precio?: number; // override; si no se pasa, hereda del producto
  costo?: number;
  stockInicial: number;
};

type SeedProducto = {
  nombre: string;
  descripcion?: string;
  categoria: string;
  precioBase: number;
  costoBase: number;
  variantes: SeedVariante[];
};

const MARKUP = 2.15;
const costoDe = (precio: number) => Math.round((precio / MARKUP) * 100) / 100;

const productos: SeedProducto[] = [
  // --- Sin variantes (variante única) ---
  {
    nombre: 'Sahumerio Sándalo Premium',
    descripcion: 'Caja x 8 varillas, aroma sándalo natural.',
    categoria: 'Aromatizantes',
    precioBase: 2500,
    costoBase: costoDe(2500),
    variantes: [
      { nombre: 'Único', codigoBarras: '7790001000011', stockInicial: 14 },
    ],
  },
  {
    nombre: 'Bomba de olor Vainilla',
    descripcion: 'Difusor en spray 250ml.',
    categoria: 'Aromatizantes',
    precioBase: 4200,
    costoBase: costoDe(4200),
    variantes: [
      { nombre: 'Único', codigoBarras: '7790001000028', stockInicial: 9 },
    ],
  },
  {
    nombre: 'Set manicura básico',
    descripcion: 'Estuche 6 piezas con cortauñas y pinza.',
    categoria: 'Belleza personal',
    precioBase: 6800,
    costoBase: costoDe(6800),
    variantes: [
      { nombre: 'Único', codigoBarras: '7790001000035', stockInicial: 7 },
    ],
  },
  {
    nombre: 'Peluche oso clásico 30cm',
    descripcion: 'Peluche relleno hipoalergénico.',
    categoria: 'Juguetes',
    precioBase: 12500,
    costoBase: costoDe(12500),
    variantes: [
      { nombre: 'Único', codigoBarras: '7790001000042', stockInicial: 5 },
    ],
  },

  // --- Con variantes mismo precio (overrides null) ---
  {
    nombre: 'Botella térmica 500ml',
    descripcion: 'Acero inoxidable, doble pared.',
    categoria: 'Accesorios',
    precioBase: 9800,
    costoBase: costoDe(9800),
    variantes: [
      {
        nombre: 'Roja',
        atributos: { color: 'rojo' },
        codigoBarras: '7790001000059',
        stockInicial: 8,
      },
      {
        nombre: 'Azul',
        atributos: { color: 'azul' },
        codigoBarras: '7790001000066',
        stockInicial: 11,
      },
      {
        nombre: 'Verde',
        atributos: { color: 'verde' },
        codigoBarras: '7790001000073',
        stockInicial: 6,
      },
      {
        nombre: 'Negra',
        atributos: { color: 'negro' },
        codigoBarras: '7790001000080',
        stockInicial: 13,
      },
      {
        nombre: 'Rosa',
        atributos: { color: 'rosa' },
        codigoBarras: '7790001000097',
        stockInicial: 9,
      },
    ],
  },
  {
    nombre: 'Billetera Amyra',
    descripcion: 'Cuero ecológico, broche magnético.',
    categoria: 'Marroquinería',
    precioBase: 14500,
    costoBase: costoDe(14500),
    variantes: [
      {
        nombre: 'Beige',
        atributos: { color: 'beige' },
        codigoBarras: '7790001000103',
        stockInicial: 7,
      },
      {
        nombre: 'Negra',
        atributos: { color: 'negro' },
        codigoBarras: '7790001000110',
        stockInicial: 12,
      },
      {
        nombre: 'Marrón',
        atributos: { color: 'marron' },
        codigoBarras: '7790001000127',
        stockInicial: 5,
      },
    ],
  },
  {
    nombre: 'Vela aromática soja 200g',
    descripcion: 'Vela artesanal de cera de soja.',
    categoria: 'Aromatizantes',
    precioBase: 5400,
    costoBase: costoDe(5400),
    variantes: [
      {
        nombre: 'Lavanda',
        atributos: { aroma: 'lavanda' },
        codigoBarras: '7790001000134',
        stockInicial: 10,
      },
      {
        nombre: 'Vainilla',
        atributos: { aroma: 'vainilla' },
        codigoBarras: '7790001000141',
        stockInicial: 15,
      },
      {
        nombre: 'Sándalo',
        atributos: { aroma: 'sandalo' },
        codigoBarras: '7790001000158',
        stockInicial: 6,
      },
      {
        nombre: 'Coco',
        atributos: { aroma: 'coco' },
        codigoBarras: '7790001000165',
        stockInicial: 8,
      },
    ],
  },
  {
    nombre: 'Riñonera urbana',
    descripcion: 'Cierre YKK, correa ajustable.',
    categoria: 'Marroquinería',
    precioBase: 11200,
    costoBase: costoDe(11200),
    variantes: [
      {
        nombre: 'Negra',
        atributos: { color: 'negro' },
        codigoBarras: '7790001000172',
        stockInicial: 9,
      },
      {
        nombre: 'Camuflada',
        atributos: { color: 'camuflado' },
        codigoBarras: '7790001000189',
        stockInicial: 5,
      },
      {
        nombre: 'Beige',
        atributos: { color: 'beige' },
        codigoBarras: '7790001000196',
        stockInicial: 7,
      },
    ],
  },

  // --- Con variantes con override de precio ---
  {
    nombre: 'Mochila escolar',
    descripcion: 'Tela impermeable, bolsillo para notebook.',
    categoria: 'Marroquinería',
    precioBase: 18500,
    costoBase: costoDe(18500),
    variantes: [
      {
        nombre: 'Talle M',
        atributos: { tamanio: 'M' },
        codigoBarras: '7790001000202',
        stockInicial: 8,
      },
      {
        nombre: 'Talle L',
        atributos: { tamanio: 'L' },
        codigoBarras: '7790001000219',
        precio: 22900,
        costo: costoDe(22900),
        stockInicial: 6,
      },
    ],
  },
  {
    nombre: 'Aros acero quirúrgico argolla',
    descripcion: 'Acero quirúrgico hipoalergénico.',
    categoria: 'Acero quirúrgico',
    precioBase: 3500,
    costoBase: costoDe(3500),
    variantes: [
      {
        nombre: '8mm',
        atributos: { diametro_mm: 8 },
        codigoBarras: '7790001000226',
        stockInicial: 14,
      },
      {
        nombre: '12mm',
        atributos: { diametro_mm: 12 },
        codigoBarras: '7790001000233',
        precio: 4200,
        costo: costoDe(4200),
        stockInicial: 11,
      },
      {
        nombre: '16mm',
        atributos: { diametro_mm: 16 },
        codigoBarras: '7790001000240',
        precio: 4900,
        costo: costoDe(4900),
        stockInicial: 8,
      },
    ],
  },
  {
    nombre: 'Pulsera acero quirúrgico',
    descripcion: 'Cadena tipo barbada, broche reforzado.',
    categoria: 'Acero quirúrgico',
    precioBase: 7800,
    costoBase: costoDe(7800),
    variantes: [
      {
        nombre: '18cm',
        atributos: { largo_cm: 18 },
        codigoBarras: '7790001000257',
        stockInicial: 10,
      },
      {
        nombre: '20cm',
        atributos: { largo_cm: 20 },
        codigoBarras: '7790001000264',
        precio: 8900,
        costo: costoDe(8900),
        stockInicial: 9,
      },
    ],
  },
  {
    nombre: 'Set pinceles maquillaje',
    descripcion: 'Estuche con cerdas sintéticas.',
    categoria: 'Belleza personal',
    precioBase: 9500,
    costoBase: costoDe(9500),
    variantes: [
      {
        nombre: '6 piezas',
        atributos: { piezas: 6 },
        codigoBarras: '7790001000271',
        stockInicial: 7,
      },
      {
        nombre: '12 piezas',
        atributos: { piezas: 12 },
        codigoBarras: '7790001000288',
        precio: 14900,
        costo: costoDe(14900),
        stockInicial: 5,
      },
    ],
  },
];

const categorias = [
  { nombre: 'Aromatizantes', descripcion: 'Sahumerios, velas, difusores.' },
  { nombre: 'Marroquinería', descripcion: 'Billeteras, mochilas, riñoneras.' },
  { nombre: 'Juguetes', descripcion: 'Peluches y juguetería general.' },
  { nombre: 'Accesorios', descripcion: 'Botellas, mates, varios.' },
  { nombre: 'Belleza personal', descripcion: 'Manicura, maquillaje, cuidado.' },
  { nombre: 'Acero quirúrgico', descripcion: 'Aros, pulseras, anillos.' },
];

const usuarios = [
  {
    email: 'felipa@felipa.local',
    nombre: 'Felipa',
    rol: Rol.ADMIN,
  },
  {
    email: 'agustin@felipa.local',
    nombre: 'Agustín',
    rol: Rol.ADMIN,
  },
  {
    email: 'andrea@felipa.local',
    nombre: 'Andrea',
    rol: Rol.VENDEDOR,
  },
  {
    email: 'gisela@felipa.local',
    nombre: 'Gisela',
    rol: Rol.VENDEDOR,
  },
];

async function main() {
  console.log('🌱 Seeding...');

  // 1. Sucursal
  const sucursal = await prisma.sucursal.upsert({
    where: { nombre: 'Felipa 1' },
    update: { direccion: 'Santa Rosa, La Pampa', activa: true },
    create: {
      nombre: 'Felipa 1',
      direccion: 'Santa Rosa, La Pampa',
      activa: true,
    },
  });
  console.log(`✔ Sucursal: ${sucursal.nombre}`);

  // 2. Usuarios
  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: {
        nombre: u.nombre,
        rol: u.rol,
        sucursalId: sucursal.id,
        activo: true,
      },
      create: {
        email: u.email,
        nombre: u.nombre,
        rol: u.rol,
        sucursalId: sucursal.id,
        activo: true,
      },
    });
  }
  console.log(`✔ Usuarios: ${usuarios.length}`);

  // 3. Categorías
  const categoriasMap = new Map<string, string>();
  for (const c of categorias) {
    const cat = await prisma.categoria.upsert({
      where: { nombre: c.nombre },
      update: { descripcion: c.descripcion },
      create: c,
    });
    categoriasMap.set(c.nombre, cat.id);
  }
  console.log(`✔ Categorías: ${categorias.length}`);

  // 4. Productos + variantes + stock
  // Idempotencia: identificamos productos por nombre (no es único en schema, pero seedeamos siempre el mismo set).
  let totalVariantes = 0;
  let totalStocks = 0;

  for (const p of productos) {
    const categoriaId = categoriasMap.get(p.categoria) ?? null;

    // Buscar producto existente por nombre exacto
    const existente = await prisma.producto.findFirst({
      where: { nombre: p.nombre },
    });

    const producto = existente
      ? await prisma.producto.update({
          where: { id: existente.id },
          data: {
            descripcion: p.descripcion,
            categoriaId,
            precioBase: new Prisma.Decimal(p.precioBase),
            costoBase: new Prisma.Decimal(p.costoBase),
            activo: true,
          },
        })
      : await prisma.producto.create({
          data: {
            nombre: p.nombre,
            descripcion: p.descripcion,
            categoriaId,
            precioBase: new Prisma.Decimal(p.precioBase),
            costoBase: new Prisma.Decimal(p.costoBase),
            activo: true,
          },
        });

    for (const v of p.variantes) {
      // Identificamos variante por (productoId, nombre) — combo estable.
      const varExistente = await prisma.variante.findFirst({
        where: { productoId: producto.id, nombre: v.nombre },
      });

      const data = {
        productoId: producto.id,
        nombre: v.nombre,
        atributos: v.atributos ?? Prisma.JsonNull,
        codigoBarras: v.codigoBarras ?? null,
        precio: v.precio !== undefined ? new Prisma.Decimal(v.precio) : null,
        costo: v.costo !== undefined ? new Prisma.Decimal(v.costo) : null,
        activa: true,
      };

      const variante = varExistente
        ? await prisma.variante.update({
            where: { id: varExistente.id },
            data,
          })
        : await prisma.variante.create({ data });

      totalVariantes += 1;

      await prisma.stock.upsert({
        where: {
          varianteId_sucursalId: {
            varianteId: variante.id,
            sucursalId: sucursal.id,
          },
        },
        update: { cantidad: v.stockInicial },
        create: {
          varianteId: variante.id,
          sucursalId: sucursal.id,
          cantidad: v.stockInicial,
        },
      });
      totalStocks += 1;
    }
  }
  console.log(
    `✔ Productos: ${productos.length}, Variantes: ${totalVariantes}, Stocks: ${totalStocks}`,
  );

  // 5. Venta de ejemplo (idempotente: una sola, identificada por whatsappCliente o flag)
  await seedVentaEjemplo(sucursal.id);

  console.log('🌱 Seed OK');
}

async function seedVentaEjemplo(sucursalId: string) {
  const MARCA = 'SEED-EJEMPLO';

  const yaExiste = await prisma.venta.findFirst({
    where: { whatsappCliente: MARCA },
  });
  if (yaExiste) {
    console.log(`✔ Venta ejemplo: ya existe (${yaExiste.codigoCorto})`);
    return;
  }

  const andrea = await prisma.usuario.findUniqueOrThrow({
    where: { email: 'andrea@felipa.local' },
  });

  const variantes = await prisma.variante.findMany({
    where: {
      producto: { is: { nombre: { in: ['Botella térmica 500ml', 'Vela aromática soja 200g'] } } },
    },
    include: { producto: true },
    take: 2,
  });
  if (variantes.length < 2) {
    console.warn('⚠ No hay variantes suficientes para venta ejemplo');
    return;
  }

  const items = variantes.map((v) => {
    const precio = v.precio ?? v.producto.precioBase;
    const cantidad = 1;
    const subtotal = new Prisma.Decimal(precio).mul(cantidad);
    return {
      varianteId: v.id,
      cantidad,
      precioUnitario: new Prisma.Decimal(precio),
      subtotal,
    };
  });

  const subtotal = items.reduce(
    (acc, it) => acc.add(it.subtotal),
    new Prisma.Decimal(0),
  );
  const descuento = subtotal.mul(new Prisma.Decimal('0.10'));
  const total = subtotal.sub(descuento);

  const codigoCorto = await generarCodigoVenta(sucursalId);

  await prisma.$transaction(async (tx) => {
    const venta = await tx.venta.create({
      data: {
        codigoCorto,
        sucursalId,
        usuarioId: andrea.id,
        subtotal,
        descuentoTotal: descuento,
        total,
        metodosPago: [{ metodo: 'efectivo', monto: total.toNumber() }],
        whatsappCliente: MARCA,
        items: { create: items },
      },
    });

    for (const it of items) {
      await tx.stock.update({
        where: {
          varianteId_sucursalId: {
            varianteId: it.varianteId,
            sucursalId,
          },
        },
        data: { cantidad: { decrement: it.cantidad } },
      });

      await tx.movimientoStock.create({
        data: {
          varianteId: it.varianteId,
          sucursalId,
          tipo: TipoMovimiento.VENTA,
          cantidad: -it.cantidad,
          motivo: `Venta ${venta.codigoCorto}`,
          usuarioId: andrea.id,
          ventaId: venta.id,
        },
      });
    }
  });

  console.log(`✔ Venta ejemplo: ${codigoCorto}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
