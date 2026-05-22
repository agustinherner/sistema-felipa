/**
 * Smoke test de `crearVentaCore`.
 *
 * Cubre los escenarios originales de Sprint 6.1 (fixtures, items, métodos de
 * pago, código corto, guardas) más los del cambio de descuento de Sprint 6.5:
 *  - venta SIN descuento (sin campo `descuento` en el payload)
 *  - venta CON descuento PORCENTAJE (10%)
 *  - venta CON descuento MONTO fijo
 *  - métodos de pago solo en efectivo/transferencia NO disparan descuento
 *    automáticamente (la lógica vieja se eliminó: ahora es manual y opcional)
 *
 * Uso:
 *   npx tsx scripts/smoke-venta.ts
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { crearVentaCore } from '../lib/ventas/core';

const prisma = new PrismaClient();

const FIXTURE_TAG = `__smoke_${Date.now()}`;

type Fixture = {
  sucursalId: string;
  userId: string;
  productoId: string;
  varianteAId: string;
  varianteBId: string;
  turnoAbiertoId: string;
};

let pasos = 0;
let fallos = 0;

function ok(label: string, detalle?: string) {
  pasos += 1;
  console.log(`  ✔ ${label}${detalle ? ` — ${detalle}` : ''}`);
}

function bad(label: string, detalle: string) {
  pasos += 1;
  fallos += 1;
  console.log(`  ✘ ${label} — ${detalle}`);
}

async function setupFixture(): Promise<Fixture> {
  const sucursal = await prisma.sucursal.create({
    data: { nombre: `Smoke ${FIXTURE_TAG} 1` },
  });

  const user = await prisma.user.create({
    data: {
      email: `${FIXTURE_TAG}@example.com`,
      nombre: 'Smoke User',
      rol: 'VENDEDOR',
      sucursalId: sucursal.id,
    },
  });

  const categoria = await prisma.categoria.create({
    data: { nombre: `Cat ${FIXTURE_TAG}` },
  });

  const producto = await prisma.producto.create({
    data: {
      nombre: `Prod ${FIXTURE_TAG}`,
      categoriaId: categoria.id,
      precioBase: new Prisma.Decimal('100.00'),
      costoBase: new Prisma.Decimal('50.00'),
    },
  });

  const varianteA = await prisma.variante.create({
    data: {
      productoId: producto.id,
      nombre: 'A',
      precio: new Prisma.Decimal('100.00'),
      costo: new Prisma.Decimal('50.00'),
    },
  });
  const varianteB = await prisma.variante.create({
    data: {
      productoId: producto.id,
      nombre: 'B',
      precio: new Prisma.Decimal('250.00'),
      costo: new Prisma.Decimal('120.00'),
    },
  });

  await prisma.stock.createMany({
    data: [
      { varianteId: varianteA.id, sucursalId: sucursal.id, cantidad: 50 },
      { varianteId: varianteB.id, sucursalId: sucursal.id, cantidad: 30 },
    ],
  });

  const turno = await prisma.turno.create({
    data: {
      userId: user.id,
      efectivoInicialDeclarado: new Prisma.Decimal('1000.00'),
    },
  });

  return {
    sucursalId: sucursal.id,
    userId: user.id,
    productoId: producto.id,
    varianteAId: varianteA.id,
    varianteBId: varianteB.id,
    turnoAbiertoId: turno.id,
  };
}

async function teardownFixture(f: Fixture) {
  await prisma.movimientoStock.deleteMany({ where: { sucursalId: f.sucursalId } });
  await prisma.itemVenta.deleteMany({ where: { venta: { sucursalId: f.sucursalId } } });
  await prisma.venta.deleteMany({ where: { sucursalId: f.sucursalId } });
  await prisma.stock.deleteMany({ where: { sucursalId: f.sucursalId } });
  await prisma.turno.deleteMany({ where: { userId: f.userId } });
  await prisma.variante.deleteMany({ where: { productoId: f.productoId } });
  await prisma.producto.deleteMany({ where: { id: f.productoId } });
  await prisma.categoria.deleteMany({ where: { nombre: `Cat ${FIXTURE_TAG}` } });
  await prisma.user.deleteMany({ where: { id: f.userId } });
  await prisma.sucursal.deleteMany({ where: { id: f.sucursalId } });
}

async function ejecutar() {
  const f = await setupFixture();
  try {
    // Caso 1: venta efectivo SIN descuento → total = subtotal, aplicaDescuento false.
    // Antes este caso aplicaba el 10% automático. Ahora no se aplica.
    {
      console.log('Caso 1: efectivo, 2 ítems, SIN descuento → total = subtotal');
      // 2 * 100 + 1 * 250 = 450 (sin descuento)
      const r = await crearVentaCore(
        {
          items: [
            { varianteId: f.varianteAId, cantidad: 2 },
            { varianteId: f.varianteBId, cantidad: 1 },
          ],
          metodosPago: [{ metodo: 'EFECTIVO', monto: 450 }],
        },
        { userId: f.userId, sucursalId: f.sucursalId, turnoId: f.turnoAbiertoId },
      );
      if (!r.ok) {
        bad('Caso 1 esperaba ok', JSON.stringify(r.errores));
      } else {
        ok('Caso 1 ok', `codigoCorto=${r.codigoCorto}`);
        const v = await prisma.venta.findUniqueOrThrow({
          where: { id: r.ventaId },
          include: { items: true, movimientos: true },
        });
        if (v.aplicaDescuento) bad('Caso 1: aplicaDescuento', 'esperaba false');
        else ok('Caso 1: aplicaDescuento = false');
        if (v.descuentoTipo !== null) bad('Caso 1: descuentoTipo', `got ${v.descuentoTipo}, want null`);
        else ok('Caso 1: descuentoTipo = null');
        if (v.descuentoValor !== null) bad('Caso 1: descuentoValor', `got ${v.descuentoValor}, want null`);
        else ok('Caso 1: descuentoValor = null');
        if (Number(v.subtotal) !== 450) bad('Caso 1: subtotal', `got ${v.subtotal}, want 450`);
        else ok('Caso 1: subtotal = 450');
        if (Number(v.descuentoTotal) !== 0) bad('Caso 1: descuento', `got ${v.descuentoTotal}, want 0`);
        else ok('Caso 1: descuento = 0');
        if (Number(v.total) !== 450) bad('Caso 1: total', `got ${v.total}, want 450 (= subtotal)`);
        else ok('Caso 1: total = subtotal = 450');
        if (v.items.length !== 2) bad('Caso 1: items', `got ${v.items.length}, want 2`);
        else ok('Caso 1: 2 items');
        const movs = v.movimientos;
        if (movs.length !== 2) bad('Caso 1: movs', `got ${movs.length}, want 2`);
        else if (!movs.every((m) => m.tipo === 'VENTA' && m.cantidad < 0)) {
          bad('Caso 1: movs', 'esperaba tipo VENTA y cantidad < 0 en todos');
        } else {
          ok('Caso 1: 2 movimientos VENTA con cantidad negativa');
        }
        const stockA = await prisma.stock.findUniqueOrThrow({
          where: { varianteId_sucursalId: { varianteId: f.varianteAId, sucursalId: f.sucursalId } },
        });
        const stockB = await prisma.stock.findUniqueOrThrow({
          where: { varianteId_sucursalId: { varianteId: f.varianteBId, sucursalId: f.sucursalId } },
        });
        if (stockA.cantidad !== 48) bad('Caso 1: stock A', `got ${stockA.cantidad}, want 48`);
        else ok('Caso 1: stock A = 50 - 2 = 48');
        if (stockB.cantidad !== 29) bad('Caso 1: stock B', `got ${stockB.cantidad}, want 29`);
        else ok('Caso 1: stock B = 30 - 1 = 29');
      }
    }

    // Caso 2: efectivo + débito → sin descuento (idem; sigue siendo manual).
    {
      console.log('Caso 2: efectivo + débito, sin descuento → total = subtotal');
      const r = await crearVentaCore(
        {
          items: [{ varianteId: f.varianteAId, cantidad: 1 }],
          metodosPago: [
            { metodo: 'EFECTIVO', monto: 50 },
            { metodo: 'DEBITO', monto: 50 },
          ],
        },
        { userId: f.userId, sucursalId: f.sucursalId, turnoId: f.turnoAbiertoId },
      );
      if (!r.ok) {
        bad('Caso 2 esperaba ok', JSON.stringify(r.errores));
      } else {
        const v = await prisma.venta.findUniqueOrThrow({ where: { id: r.ventaId } });
        if (v.aplicaDescuento) bad('Caso 2: aplicaDescuento', 'esperaba false');
        else ok('Caso 2: aplicaDescuento = false');
        if (Number(v.descuentoTotal) !== 0) bad('Caso 2: descuento', `got ${v.descuentoTotal}, want 0`);
        else ok('Caso 2: descuento = 0');
        if (Number(v.subtotal) !== Number(v.total)) bad('Caso 2: total === subtotal', `${v.total} vs ${v.subtotal}`);
        else ok(`Caso 2: total = subtotal = ${v.total}`);
      }
    }

    // Caso 3: sin turno abierto. Simulamos el wrapper.
    {
      console.log('Caso 3: sin turno abierto → wrapper falla');
      await prisma.turno.update({
        where: { id: f.turnoAbiertoId },
        data: { cierreEn: new Date(), efectivoContadoCierre: new Prisma.Decimal('0') },
      });
      const turnoAbierto = await prisma.turno.findFirst({
        where: { userId: f.userId, cierreEn: null },
      });
      if (turnoAbierto !== null) {
        bad('Caso 3 setup', 'esperaba ningún turno abierto');
      } else {
        ok('Caso 3: getTurnoAbierto = null (wrapper fallaría con "Necesitás un turno abierto...")');
      }
      await prisma.turno.update({
        where: { id: f.turnoAbiertoId },
        data: { cierreEn: null, efectivoContadoCierre: null },
      });
    }

    // Caso 4: suma de métodos != total.
    {
      console.log('Caso 4: suma de métodos != total → fail');
      const r = await crearVentaCore(
        {
          items: [{ varianteId: f.varianteAId, cantidad: 1 }],
          metodosPago: [{ metodo: 'EFECTIVO', monto: 999 }],
        },
        { userId: f.userId, sucursalId: f.sucursalId, turnoId: f.turnoAbiertoId },
      );
      if (r.ok) {
        bad('Caso 4 esperaba fail', `pero retornó ok con codigoCorto=${r.codigoCorto}`);
      } else if (!r.errores.some((e) => /total cobrado/i.test(e))) {
        bad('Caso 4: mensaje', `errores no incluyen "total cobrado": ${JSON.stringify(r.errores)}`);
      } else {
        ok('Caso 4: fail con mensaje claro', r.errores[0]);
      }
    }

    // Caso 5: dos métodos EFECTIVO repetidos → fail Zod.
    {
      console.log('Caso 5: métodos repetidos → fail Zod');
      const r = await crearVentaCore(
        {
          items: [{ varianteId: f.varianteAId, cantidad: 1 }],
          metodosPago: [
            { metodo: 'EFECTIVO', monto: 50 },
            { metodo: 'EFECTIVO', monto: 50 },
          ],
        },
        { userId: f.userId, sucursalId: f.sucursalId, turnoId: f.turnoAbiertoId },
      );
      if (r.ok) {
        bad('Caso 5 esperaba fail', `pero retornó ok`);
      } else if (!r.errores.some((e) => /repetir/i.test(e))) {
        bad('Caso 5: mensaje', `${JSON.stringify(r.errores)}`);
      } else {
        ok('Caso 5: fail por método repetido', r.errores[0]);
      }
    }

    // Caso 6: dos ventas mismo día → codigoCorto NNN distintos.
    {
      console.log('Caso 6: dos ventas mismo día → NNN distintos');
      const r1 = await crearVentaCore(
        {
          items: [{ varianteId: f.varianteAId, cantidad: 1 }],
          metodosPago: [{ metodo: 'EFECTIVO', monto: 100 }],
        },
        { userId: f.userId, sucursalId: f.sucursalId, turnoId: f.turnoAbiertoId },
      );
      const r2 = await crearVentaCore(
        {
          items: [{ varianteId: f.varianteAId, cantidad: 1 }],
          metodosPago: [{ metodo: 'EFECTIVO', monto: 100 }],
        },
        { userId: f.userId, sucursalId: f.sucursalId, turnoId: f.turnoAbiertoId },
      );
      if (!r1.ok || !r2.ok) {
        bad('Caso 6: ambas ventas debían crearse', JSON.stringify({ r1, r2 }));
      } else {
        const nn1 = r1.codigoCorto.split('-').pop();
        const nn2 = r2.codigoCorto.split('-').pop();
        if (nn1 === nn2) {
          bad('Caso 6: NNN distintos', `r1=${r1.codigoCorto}, r2=${r2.codigoCorto}`);
        } else {
          ok('Caso 6: NNN distintos', `r1=${r1.codigoCorto}, r2=${r2.codigoCorto}`);
        }
      }
    }

    // Caso 7: descuento manual por PORCENTAJE (10% sobre subtotal 450 = 45).
    {
      console.log('Caso 7: descuento PORCENTAJE 10% → descuento manual aplicado');
      const r = await crearVentaCore(
        {
          items: [
            { varianteId: f.varianteAId, cantidad: 2 },
            { varianteId: f.varianteBId, cantidad: 1 },
          ],
          metodosPago: [{ metodo: 'EFECTIVO', monto: 405 }],
          descuento: { tipo: 'PORCENTAJE', valor: 10 },
        },
        { userId: f.userId, sucursalId: f.sucursalId, turnoId: f.turnoAbiertoId },
      );
      if (!r.ok) {
        bad('Caso 7 esperaba ok', JSON.stringify(r.errores));
      } else {
        const v = await prisma.venta.findUniqueOrThrow({ where: { id: r.ventaId } });
        if (!v.aplicaDescuento) bad('Caso 7: aplicaDescuento', 'esperaba true');
        else ok('Caso 7: aplicaDescuento = true');
        if (v.descuentoTipo !== 'PORCENTAJE') bad('Caso 7: descuentoTipo', `got ${v.descuentoTipo}, want PORCENTAJE`);
        else ok('Caso 7: descuentoTipo = PORCENTAJE');
        if (v.descuentoValor === null || Number(v.descuentoValor) !== 10) {
          bad('Caso 7: descuentoValor', `got ${v.descuentoValor}, want 10`);
        } else ok('Caso 7: descuentoValor = 10');
        if (Number(v.subtotal) !== 450) bad('Caso 7: subtotal', `got ${v.subtotal}, want 450`);
        else ok('Caso 7: subtotal = 450');
        if (Number(v.descuentoTotal) !== 45) bad('Caso 7: descuentoTotal', `got ${v.descuentoTotal}, want 45`);
        else ok('Caso 7: descuentoTotal = 45');
        if (Number(v.total) !== 405) bad('Caso 7: total', `got ${v.total}, want 405`);
        else ok('Caso 7: total = 405');
      }
    }

    // Caso 8: descuento manual por MONTO fijo (subtotal 100 - 30 = 70).
    {
      console.log('Caso 8: descuento MONTO fijo $30');
      const r = await crearVentaCore(
        {
          items: [{ varianteId: f.varianteAId, cantidad: 1 }],
          metodosPago: [{ metodo: 'EFECTIVO', monto: 70 }],
          descuento: { tipo: 'MONTO', valor: 30 },
        },
        { userId: f.userId, sucursalId: f.sucursalId, turnoId: f.turnoAbiertoId },
      );
      if (!r.ok) {
        bad('Caso 8 esperaba ok', JSON.stringify(r.errores));
      } else {
        const v = await prisma.venta.findUniqueOrThrow({ where: { id: r.ventaId } });
        if (!v.aplicaDescuento) bad('Caso 8: aplicaDescuento', 'esperaba true');
        else ok('Caso 8: aplicaDescuento = true');
        if (v.descuentoTipo !== 'MONTO') bad('Caso 8: descuentoTipo', `got ${v.descuentoTipo}, want MONTO`);
        else ok('Caso 8: descuentoTipo = MONTO');
        if (v.descuentoValor === null || Number(v.descuentoValor) !== 30) {
          bad('Caso 8: descuentoValor', `got ${v.descuentoValor}, want 30`);
        } else ok('Caso 8: descuentoValor = 30');
        if (Number(v.subtotal) !== 100) bad('Caso 8: subtotal', `got ${v.subtotal}, want 100`);
        else ok('Caso 8: subtotal = 100');
        if (Number(v.descuentoTotal) !== 30) bad('Caso 8: descuentoTotal', `got ${v.descuentoTotal}, want 30`);
        else ok('Caso 8: descuentoTotal = 30');
        if (Number(v.total) !== 70) bad('Caso 8: total', `got ${v.total}, want 70`);
        else ok('Caso 8: total = 70');
      }
    }

    // Caso 9: descuento por PORCENTAJE inválido (101%) → fail validación server.
    {
      console.log('Caso 9: descuento PORCENTAJE 101% → fail');
      const r = await crearVentaCore(
        {
          items: [{ varianteId: f.varianteAId, cantidad: 1 }],
          metodosPago: [{ metodo: 'EFECTIVO', monto: 0.01 }],
          descuento: { tipo: 'PORCENTAJE', valor: 101 },
        },
        { userId: f.userId, sucursalId: f.sucursalId, turnoId: f.turnoAbiertoId },
      );
      if (r.ok) {
        bad('Caso 9 esperaba fail', 'pero retornó ok');
      } else if (!r.errores.some((e) => /porcentaje/i.test(e))) {
        bad('Caso 9: mensaje', JSON.stringify(r.errores));
      } else {
        ok('Caso 9: fail por porcentaje > 100', r.errores[0]);
      }
    }

    // Caso 10: descuento por MONTO > subtotal → fail validación server.
    {
      console.log('Caso 10: descuento MONTO > subtotal → fail');
      const r = await crearVentaCore(
        {
          items: [{ varianteId: f.varianteAId, cantidad: 1 }],
          metodosPago: [{ metodo: 'EFECTIVO', monto: 0.01 }],
          descuento: { tipo: 'MONTO', valor: 1000 },
        },
        { userId: f.userId, sucursalId: f.sucursalId, turnoId: f.turnoAbiertoId },
      );
      if (r.ok) {
        bad('Caso 10 esperaba fail', 'pero retornó ok');
      } else if (!r.errores.some((e) => /superar el subtotal|subtotal/i.test(e))) {
        bad('Caso 10: mensaje', JSON.stringify(r.errores));
      } else {
        ok('Caso 10: fail por monto > subtotal', r.errores[0]);
      }
    }
  } finally {
    await teardownFixture(f);
  }
}

ejecutar()
  .then(() => {
    console.log(`\nResumen: ${pasos - fallos}/${pasos} aserciones OK.`);
    if (fallos > 0) {
      console.error(`FALLOS: ${fallos}`);
      process.exit(1);
    }
  })
  .catch(async (e) => {
    console.error('Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
