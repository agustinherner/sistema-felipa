# ESTADO — Sistema Felipa

Bitácora viva del proyecto. Se actualiza después de cada sesión de trabajo.
**Este es el primer archivo que se le pega a Claude al arrancar un chat nuevo.**

---

## Sprint actual

**Sprint 6.5 COMPLETO en local (2026-05-22). Items 4 (anular venta), 5 (retiro de caja) y 6 (importador de catálogo) ya deployados. Item 7 (devoluciones + WhatsApp) commiteado en `main` local, pendiente deploy.**

## Tarea en curso

Ninguna. Próximo paso: deployar item 7 a producción (migrate Neon directo + push).

## Último avance

**Sprint 6.5 — Devoluciones + comprobante WhatsApp (2026-05-22)** — commiteado en `main` local, **pendiente deploy** (mismo flujo: migrate Neon directo → push).
- Schema: nuevos modelos `Devolucion` (venta, usuario, motivo, montoTotal, creadaEn) e `ItemDevolucion` (devolucion, itemVenta, variante, cantidad, precioUnitario, subtotal) + relaciones inversas en `Venta`, `ItemVenta`, `Variante`, `User`. Migración `20260522145032_add_devoluciones` aplicada en dev.
- Backend: `crearDevolucion` (Zod: motivo min 3, items con cantidad ≥ 1) valida venta no anulada, ≤30 días, cantidad ≤ vendida − ya devuelta (permite múltiples devoluciones parciales). En una transacción: crea `Devolucion` + items, registra `MovimientoStock` tipo `DEVOLUCION` y suma stock atómicamente. Permisos Admin/Vendedor. Nueva query `obtenerDevolucionesVenta`; `obtenerVentaDetalle` y `listarVentas` ahora incluyen devoluciones y `cantidadDevueltaPorItem` / `estadoDevolucion`.
- UI Detalle (`DetalleVentaModal`): sección "Devoluciones (N)" con historial; botón "Registrar devolución" que abre form con tabla de items (vendido / ya devuelto / a devolver), botón "Devolver todo", input de cantidad por item con max, campo motivo obligatorio, preview de monto, confirmación + guard `useRef`. Botón "WhatsApp" sutil para reenvío.
- UI Tabla (`TablaVentas`): badge "Dev. parcial" (amber-200) o "Devuelta" (amber-300) junto al código según `estadoDevolucion`.
- UI Éxito (`/ventas/exito`): botón prominente verde "Enviar comprobante por WhatsApp" que abre `https://wa.me/?text=…` en pestaña nueva. Sin número precargado.
- Helper `lib/ventas/comprobante.ts`: `generarTextoComprobante(venta)` y `urlWhatsappComprobante(venta)`. Texto plano formateado con emoji 🧾, items, subtotal/descuento/total, método de pago.
- Decisión "empezar simple": el impacto en caja de devoluciones en efectivo NO se trackea automáticamente. El cajero hace retiro manual o lo anota en observaciones al cierre. Documentado.
- Verificación: `tsc --noEmit` y `npm run build` verdes. Helper de comprobante probado vía tsx (output coincide con formato pedido).

**Sprint 6.5 — Retiro de caja (2026-05-22)** — commit `331463b` en `main`, deployado a producción (migrate Neon + push).
- Schema: nuevo modelo `MovimientoCaja` (`turnoId`, `usuarioId`, `tipo` String default 'RETIRO', `monto` Decimal, `motivo`, `creadoEn`) + relación inversa en `Turno` y `User`. Migración `20260522141541_add_movimiento_caja` aplicada en dev (datos existentes intactos).
- Backend: `registrarRetiroCaja` (Zod: monto > 0, motivo min 3) usa el turno abierto del usuario actual; permisos Admin/Vendedor. `obtenerRetirosTurno` lista retiros con usuario + monto. `calcularRetirosEnTurno` suma RETIROS del turno.
- Fórmula del esperado: `efectivoInicial + ventas efectivo (excl. anuladas) − retiros`. Modificados `cerrarTurno` (snapshot al cierre) y `obtenerResumenTurnoAbierto`.
- UI Dashboard: botón "Retirar de caja" + modal (monto + motivo, useRef guard); si hay retiros, card con la lista (hora, motivo, monto, quién) y desglose "Inicial + Ventas efectivo − Retiros = Esperado".
- UI Cierre: línea "Retiros durante el turno (N): −$Z" + listado breve por motivo, y caja explicativa con la fórmula del esperado visible.
- Verificación: `tsc --noEmit` y `npm run build` verdes. Turnos sin retiros conservan el comportamiento previo.

**Sprint 6.5 — Anular venta (2026-05-22)** — commit `4e0b0f0` en `main`, deployado a producción.
- Schema: `Venta.anuladaEn`, `anuladaPorId`, `motivoAnulacion`; nuevo enum `TipoMovimiento.ANULACION_VENTA`. Migración `20260522135555_add_anulacion_venta` aplicada en dev (20 ventas existentes intactas, ninguna anulada).
- Backend: `anularVenta` con validaciones (turno abierto, no doble anulación, permisos Admin/dueña). Reversión de stock atómica vía `MovimientoStock` + `Stock.increment` en transacción. Motivo obligatorio (min 3 chars).
- Agregaciones que excluyen anuladas: `calcularEfectivoVendidoEnTurno`, `obtenerResumenTurnoAbierto`, `listarTurnosDelMes`, snapshot de cierre, página `/turno/cerrar`.
- UI: badge "ANULADA" + tachado en `/ventas`, filtro "Ocultar anuladas", info de anulación + botón "Anular venta" con motivo y confirmación en el detalle, link sutil en `/ventas/exito` (deep link a `/ventas?venta=<id>`).
- Guard de doble submit (`useRef`) en el botón de anular.
- Verificación: `tsc --noEmit` y `npm run build` verdes.

**Sprint 6.5 — Fix bug registro de venta bajo concurrencia (2026-05-22)** — commits `f3664a3` + `0c3f076` en `main`, deployados a producción.
- Bug de mostrador: "primera venta OK, segunda tira error". Causa: colisión de `codigoCorto` (`count+1` sin sincronización) bajo concurrencia (doble tap).
- Capa 1 (`f3664a3`): advisory lock transaccional pooler-safe + NNN por `max()`.
- Capa 2 (`0c3f076`): guard síncrono `useRef` contra doble submit + mensaje de error genérico (no filtra Prisma crudo a la UI).
- Sin migración. Verificado: 8 ventas en paralelo OK, doble click UI = 1 venta, smoke 16/16, build/tsc verdes.

---

## Historial de sprints anteriores

**Sprint 6.2 — Historial de ventas completado (2026-05-09)** — commit `e2e9a00` en `main`. Pantalla `/ventas` con filtros, paginación, modal de detalle. Vendedor ve solo sus ventas.

**Sprint 6.1 — Nueva venta + Stock para Vendedor completado (2026-05-09)** — squash commit `27641de` en `main`. Pantalla `/ventas/nueva` funcional end-to-end. Backend `crearVenta` con transacción atómica. Refactor `/stock` para Vendedor.

**Sprint 6.0 completado (2026-05-09)** — commit `f3b6eab` en `main`. Modelo `Turno` + ciclo apertura/cierre de caja.

**Sprint 3 parte 2 completado (2026-05-08)** — squash commit `5ce5414` en `main`. Better Auth funcional, gestión de usuarios.

**Sprint 5 (P6 Stock) completado (2026-04-28)** — vista de stock + ajustes + ingreso bulk + historial de movimientos.

**Sprint 4 (P5 Productos) completado (2026-04-27)** — listado, alta, edición con variantes, soft delete, markup automático 115%.

**Sprint 3 parte 1 completada (2026-04-27)** — schema, migración inicial, seed.

**Sprint 2 completado (2026-04-27)** — scaffold con mock auth.

**Sprint 1 — parcialmente avanzado**: cuestionario respondido + segunda ronda. **Pendiente**: tarde de observación in-situ en Felipa 1.

## Próxima tarea

**Sprint 6.5 — Mejoras post-demo** (feedback del hijo usándolo en mostrador). Orden acordado:
1. ✅ Fix bug registro de venta bajo concurrencia (2026-05-22).
2. ✅ Descuento editable (commit `33dc571`).
3. ✅ Alta rápida de producto en la venta (commit `bd87340`).
4. ✅ Cancelar venta (deployado 2026-05-22): anular solo mientras el turno esté ABIERTO. Venta marcada ANULADA + `anuladaPor` + `motivoAnulacion`, no cuenta en totales, reversión de stock atómica, Vendedora puede anular sus propias del turno.
5. ✅ Retiro de caja (deployado 2026-05-22): modelo `MovimientoCaja` (varios retiros por turno); esperado al cierre = inicial + ventas efectivo − retiros. Vendedora puede, registrado.
6. ✅ Importador de catálogo (commit `c74328a`).
7. ✅ Devoluciones (P2.2) + comprobante por WhatsApp (2026-05-22): modelos `Devolucion` + `ItemDevolucion`, ≤30 días, parcial/total con tope vs ya devuelto, stock revertido en transacción, badges en historial, botón WhatsApp prominente en éxito + sutil en detalle. **Local, pendiente deploy**.

**Permisos (decididos por PO)**: la Vendedora puede aplicar descuentos, hacer retiros y anular sus ventas del turno; todo queda registrado con quién. Sin tope al inicio.

Ver `ROADMAP.md` para el plan completo.

## Bloqueos

Ninguno.

## Notas de contexto

### Stack
- Next.js 14.2.35 (App Router) + TypeScript + Postgres 16 (Docker en local) + Prisma 6 + Tailwind 3 + shadcn/ui.
- Tema: solo light (sin dark mode).
- **Auth: Better Auth 1.6.9 funcional** (DB sessions, hash scrypt gestionado por la librería, plugins `username` + `nextCookies`).

### Producción y deploy
- **URL de producción**: https://sistema-felipa.vercel.app
- **Hosting**: Vercel. Auto-deploy desde `main` en GitHub.
- **DB de producción**: Neon (Postgres serverless, free tier, región São Paulo). Proyecto `felipa`, database `neondb`.
- **Connection pooling**: URL del pooler de Neon con `?pgbouncer=true&connection_limit=1` en `DATABASE_URL` de Vercel.
- **Conexión directa** (para migraciones): `ep-snowy-lab-ac6xv1pm.sa-east-1.aws.neon.tech` (sin `-pooler`). Usar inline: `DATABASE_URL="postgresql://neondb_owner:npg_ePYlqEBKf6L0@ep-snowy-lab-ac6xv1pm.sa-east-1.aws.neon.tech/neondb?sslmode=require" npx prisma migrate deploy`.
- Docker local sigue siendo la DB de desarrollo, no se cambia.
- Big Burger queda en Supabase. Los slots free de Supabase se reservan para Big Pizza (próximo proyecto). Por eso Felipa va a Neon.

### Alcance y demo intermedio
- Alcance inicial: **MVP (Plan Base)** de la propuesta.
- **Demo activo en producción** — incluye: login, ventas, stock para vendedor, historial, dashboard del vendedor, cierre de caja, consulta de productos (sin costos para vendedor).
- **No incluye en el demo**: devoluciones, comprobante por WhatsApp, dashboard del admin, reportes (esos vienen en Sprint 6.5 y Sprint 7, post-demo).
- **Diferidos a post-MVP**: integración AFIP, calendario de turnos, fichero formal de jornada laboral, alertas automáticas de stock bajo, gráficos avanzados.

### Cliente y operación
- **Cliente**: Felipa — confirmado. Felipa 1 (bazar en Santa Rosa, La Pampa) es el único alcance del MVP.
- **Felipa 2**: proyecto distinto (local de ropa King of the Kongo + acompañantes), apertura tentativa primavera 2026. Fuera del alcance del MVP.
- **Categoría AFIP**: Responsable Inscripto. Sistema de facturación propio existente: SSL Soft Gescom. El MVP NO integra AFIP, conviven en paralelo.
- **Volumen estimado**: caja diaria promedio $280k, sábados buenos $800k, picos navideños hasta $1.5M.
- **Equipo**: 4 personas total (dueña + hijo + 2 empleadas). Todos hacen todo en mostrador, salvo remarcado (solo dueña + hijo).
- **Catálogo**: ~200 productos estimados, sin contar variantes. Carga manual desde cero con la UX de P5.2.
- **Hardware del local**: 1 PC con Windows 10 viejo. Lector de código de barras confirmado para compra. Impresora de tickets pendiente de decisión.
- **Internet en el local**: estable. Sistema 100% dependiente de internet — trade-off aceptado.

### Modelo de datos (vigente)
- **Stock** modelado a nivel **variante** con `MovimientoStock.cantidad` como **delta signed**. `Stock.cantidad` es source of truth.
- **Variantes** (color, tamaño, presentación): frecuentes. Precio y costo a nivel **producto** con override opcional a nivel **variante**.
- **Métodos de pago**: efectivo, transferencia, débito, crédito. Pagos mixtos sí (JSON en `Venta.metodosPago`). Sin cuenta corriente. No se permiten métodos repetidos.
- **Descuento estándar**: 10% por efectivo o transferencia. Todo-o-nada.
- **Markup sugerido**: 115%.
- **Modelo de Usuario**: tabla SQL `user` (lowercase). Custom fields del dominio en español.
- **Modelo `Turno`**: `userId`, `aperturaEn`, `cierreEn`, snapshot al cerrar. Partial unique index.
- **Modelo `Venta`**: `codigoCorto` formato `F1-DDMM-NNN`, `metodosPago` JSON, relación con `Turno` y `ItemVenta`.

### Roles y permisos
- **Admin**: ve todo. Único que puede cargar productos, ajustar precios, ingresos de mercadería, gestionar usuarios.
- **Vendedor**: registra ventas, consulta stock y productos (sin costo), consulta historial (solo sus ventas). Costo oculto a nivel HTML, no CSS.
- **Login**: username + password (no email). Email sintético `<username>@felipa.local`.
- **Patrón de permisos**: `lib/<dominio>/permissions.ts` con `permisosX(rol)`. Renderizado condicional a nivel HTML. Server actions validan rol independientemente.

### Convenciones de código
- Naming del schema en español. Campos como `usuarioId`, `creadaEn`, `descuentoTotal`, `codigoCorto`.
- Cliente Prisma: importar de `@/lib/db`.
- Server actions: reciben `rawInput: unknown`, parsean con Zod, retornan `ActionResult<T>`.
- Server actions que crean users: usar `prisma.user.create` con nested `account.create` y `hashPassword`. NO usar `auth.api.signUpEmail` desde request context.
- Pathname desde RSC: middleware setea `x-pathname` en headers.
- Concurrencia: partial unique index para unicidad, `decrement/increment` atómico para contadores.
- Tipo Decimal para plata.
- Permisos por rol como prop desde Server Component.
- Queries de lectura directas desde Server Components, sin server action wrapper.
- Filtros vía URL (searchParams).

### Repo y entornos
- **Repo**: GitHub privado `sistema-felipa`, rama base `main`.
- **Último commit en main**: por crear ahora (devoluciones + WhatsApp). Anterior deployado: `c74328a` (importador de catálogo).
- **Branch en curso**: ninguna.
- **Convención de branches**: una branch por sprint, squash merge a `main` al cerrar.
- **DB de desarrollo**: contenedor Docker `felipa-db` en puerto 5433.
- **Sin fecha objetivo de go-live**.

## Decisiones pendientes

- **Inconsistencia de naming de roles**: tres formas conviviendo (`'ADMIN'` uppercase, `Role.admin` lowercase, `roles: ['admin', 'vendedor']`). Candidato a sprint de housekeeping.
- **`StockPermissions.verCosto` no consumido aún**.
- **`obtenerHistorialVariante` abierto a Vendedor**: decisión documentada.
- **Deuda técnica login**: error de "cuenta desactivada" matcheado por string literal. Migrar a código de error custom.
- **Repo en OneDrive**: file watcher interfiere con git en Windows. Considerar mover a `C:\dev\sistema-felipa`.
- Estrategia de backups de la DB en Neon (free tier no tiene point-in-time restore).
- Dominio para go-live (`felipa.vercel.app` alcanza para el demo; dominio custom a definir con cliente).
- Compra (o no) de impresora de tickets antes del go-live.

---

## Cómo usar este archivo

- Al cerrar una sesión: actualizar "Último avance", "Tarea en curso" y "Próxima tarea".
- Al abrir una sesión nueva: pegar el contenido completo en el primer mensaje del chat.
- Decisiones importantes **no van acá**, van a `DECISIONES.md`.
- El plan macro **no va acá**, va a `ROADMAP.md`.
- Ubicación en el repo: `docs/ESTADO.md` (junto con `DECISIONES.md` y `ROADMAP.md`).
