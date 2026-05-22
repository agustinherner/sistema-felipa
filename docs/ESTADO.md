# ESTADO — Sistema Felipa

Bitácora viva del proyecto. Se actualiza después de cada sesión de trabajo.
**Este es el primer archivo que se le pega a Claude al arrancar un chat nuevo.**

---

## Sprint actual

**Sprint 7 cerrado (2026-05-22). Dashboard del admin (P7) + Reportes (P8) completos y deployados. Próximo: sprint de housekeeping (sugerido) — unificar naming de roles + sidebar responsive en mobile. A confirmar con Agustín.**

## Tarea en curso

Ninguna.

## Último avance

**Sprint 7 — COMPLETO + deployado (2026-05-22)**. Dashboard del admin (P7) + Reportes (P8) en producción.

**Parte 1 — Dashboard del admin (commit `3fc152c`)**. El Admin ve, además de su turno personal (sin cambios), una sección de negocio: caja del día (total + desglose por método + cierres del día con diferencia destacada + turnos abiertos con alerta >12h), top 10 productos del mes (neto de devoluciones), ventas por método del mes, y alertas (turnos largos, stock negativo, productos incompletos). Vendedor sin cambios. Nuevo dominio `lib/reportes/` + helper `lib/fecha.ts` (cortes en hora AR, UTC−3 fijo). Decimals serializados a string.

**Parte 2 — Reportes (commit `99daa6a`)**. Ruta `/reportes` Admin-only con filtro de rango (default mes actual, parseo defensivo) y 5 reportes: ventas totales por día/semana/mes, productos más vendidos, ventas por método, ventas por vendedor, horas trabajadas por vendedor. Export CSV client-side (BOM UTF-8 para Excel en Windows). Bucketing por período en hora AR. Link "Reportes" en sidebar solo Admin.

Pendiente de verificación en prod con datos reales (la DB local es seed): cuadre de métodos del día = total vendido, y que las ventas nocturnas caigan en el día AR correcto. Lo verifica Agustín en producción.

---

## Historial de sprints anteriores

**Sprint 7 — Dashboard del admin + Reportes completado (2026-05-22)** — commits `3fc152c` + `99daa6a` en `main`, deployado. P7 (dashboard de negocio del admin) + P8 (5 reportes + export CSV client-side). Sin migración. Decisiones en `DECISIONES.md`.

**Sprint 6.5 — Mejoras post-demo completado (2026-05-22)** — `main`, deployado a producción. 7 items (fix concurrencia, descuento manual, alta rápida, anular venta, retiro de caja, importador, devoluciones+WhatsApp) + 3 mejoras UX (limpiar form, tachito eliminar, links rotos). Decisiones en `DECISIONES.md`.

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

**Sprint de housekeeping** (sugerido, a confirmar):

- **Unificar naming de roles** a una sola convención en `requireAuth([...])`. Auditado en Sprint 7: 4 formas conviviendo en 16 rutas. Inventario en `DECISIONES.md`.
- **Sidebar responsive en mobile** (drawer/colapsable). Hoy el sidebar fijo de 240px estrangula el viewport <400px en todas las rutas; los reportes son los que más sufren.

Ambas son deudas acotadas y ya medidas. Ver `ROADMAP.md` para alternativas si preferimos avanzar con features.

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
- **Producción activa** — el sistema en prod ya incluye todo el Plan Base: login, ventas, stock para vendedor, historial, dashboard del vendedor, cierre de caja, consulta de productos (sin costos para vendedor), **devoluciones, comprobante por WhatsApp, dashboard del admin y reportes** (estos últimos cuatro entregados en Sprint 6.5 y Sprint 7).
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
- **Último commit en main**: `99daa6a` (Sprint 7 — reportes), más el commit de docs de este cierre.
- **Branch en curso**: ninguna.
- **Convención de branches**: una branch por sprint, squash merge a `main` al cerrar.
- **DB de desarrollo**: contenedor Docker `felipa-db` en puerto 5433.
- **Sin fecha objetivo de go-live**.

## Decisiones pendientes

- **Inconsistencia de naming de roles (AUDITADA en Sprint 7)**: 4 convenciones en `requireAuth([...])` sobre 16 rutas — `['ADMIN']`, `['admin']`, `['ADMIN','VENDEDOR']` y `['admin','vendedor']`. Funciona porque `requireAuth` normaliza, pero no está unificado. Detalle en `DECISIONES.md`. Candidato fuerte a próximo sprint.
- **Sidebar no responsive en mobile**: ancho fijo 240px estrangula el viewport en pantallas <400px, afecta a todas las rutas. Choca con la regla de responsive obligatorio. Candidato a próximo sprint.
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
