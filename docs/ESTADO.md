# ESTADO — Sistema Felipa

Bitácora viva del proyecto. Se actualiza después de cada sesión de trabajo.
**Este es el primer archivo que se le pega a Claude al arrancar un chat nuevo.**

---

## Sprint actual

**Sprint 10 — Optimización de performance — Fase 1 cerrada y deployada (2026-05-23). `vercel.json` con `regions: ["gru1"]` (misma región que Neon) + 4 `loading.tsx` con skeletons (grupo app + dashboard + turno/cerrar + ventas/nueva). La navegación entre pantallas bajó de 6-10s a <2s solo con la Fase 1 —la geografía era el cuello principal. Fase 2 (dedup de queries) y cron keep-warm parqueados; ver `DECISIONES.md`.** Fix puntual post-sprint el 2026-05-23 (visibilidad del botón de alta rápida; ver `DECISIONES.md`).

## Tarea en curso

Ninguna.

## Último avance

**Fix de visibilidad del botón de alta rápida en la venta (2026-05-23)** — commit `b88c8a5` en `main`. El botón "Agregar producto rápido" aparecía solo cuando la búsqueda devolvía 0 resultados; ahora también aparece con match parcial (bar visible siempre que haya término ≥2 chars + footer "Ninguno es el que busco — agregar 'X'" dentro del dropdown). **NO fue regresión del Sprint 9**: la condición estaba así desde bd87340. Descuento estándar cableado del Sprint 9 intacto. Sin migración. Ver `DECISIONES.md`.

---

## Historial de sprints anteriores

**Fix puntual post-Sprint 10 (2026-05-23)** — commit `b88c8a5` en `main`, deployado. Visibilidad del botón de alta rápida en `/ventas/nueva` (aparecía solo con 0 resultados; ahora también con match parcial). Solo `BusquedaInput.tsx`. Sin migración. Decisiones en `DECISIONES.md`.

**Sprint 10 — Optimización de performance Fase 1 completado (2026-05-23)** — commit `75054cb` en `main`, deployado. Región `gru1` (São Paulo, alineada con Neon) + 4 `loading.tsx` con skeletons. Bajó la navegación de 6-10s a <2s. Fase 2 (dedup) y cron keep-warm parqueados. Decisiones en `DECISIONES.md`.

**Sprint 9 — Configuración del negocio completado (2026-05-23)** — commit `74cd304` en `main`, deployado. Tabla `Configuracion` singleton + pantalla `/configuracion` + "Mi cuenta" + cableado de los 5 parámetros. Migración aplicada a Neon. Decisiones en `DECISIONES.md`.

**Sprint 7.5 — Housekeeping completado (2026-05-22)** — commit `8894ba7` en `main`, deployado. Unificación de naming de roles al enum `Rol` de Prisma (eliminada la doble representación + traducción del borde) + sidebar responsive (drawer `<lg`, fija `≥lg`, fuente única de nav). Sin migración. Decisiones en `DECISIONES.md`.

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

**Ninguna activa.** Sprint 10 cerrado en Fase 1. **Parqueado** hasta que el uso real lo pida: cron keep-warm de Neon (ataca la primera carga del día —scale-to-zero del free tier) y Fase 2 de optimización (dedup de queries, ya diagnosticada). Ver `DECISIONES.md` y `ROADMAP.md`.

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
- **Ubicación local**: `C:\Users\VICTUS\Documents\Sistemas\sistema-felipa` — fuera de OneDrive (movido el 2026-05-22; resolvió el conflicto del file watcher, `next dev` arranca limpio).
- **Último commit en main**: `b88c8a5` (fix visibilidad del botón de alta rápida en `/ventas/nueva`), más el commit de docs de cierre.
- **Branch en curso**: ninguna.
- **Convención de branches**: una branch por sprint, squash merge a `main` al cerrar.
- **DB de desarrollo**: contenedor Docker `felipa-db` en puerto 5433.
- **Sin fecha objetivo de go-live**.

## Decisiones pendientes

- **`StockPermissions.verCosto` no consumido aún**.
- **`obtenerHistorialVariante` abierto a Vendedor**: decisión documentada.
- **Deuda técnica login**: error de "cuenta desactivada" matcheado por string literal. Migrar a código de error custom.
- **Vulnerabilidades npm**: 3 reportadas por `npm audit` (2 high, 1 moderate). No bloquean nada. Revisar y correr `npm audit fix` (lo que no implique breaking changes) durante el housekeeping.
- **`obtenerConfiguracion()` upsert por request**: el get-or-create del Sprint 9 hace una escritura por cada request (deduplicada por `cache()` de React). Para el sprint de optimización: pasarlo a buscar-y-crear-si-falta para que el caso normal sea solo lectura.
- **Cron keep-warm de Neon** (parqueado, Sprint 10): cuenta de cron-job.org creada; falta el ping a `/health` cada 4 min en horario del local (pendiente confirmar horarios de apertura). Ataca la primera carga del día (scale-to-zero del free tier).
- **Fase 2 de optimización — dedup de queries** (parqueado, Sprint 10, ya diagnosticada): cachear `getCurrentUser`, sacar la doble `venta.findMany` en `/turno/cerrar`, una sola `ventasPorMetodoPago` en el dashboard, romper la cascada. Con la región alineada cada RTT vale ~5ms, así que el impacto es mucho menor que antes — evaluar si vale el riesgo (toca cálculo de turno/ventas).
- **Driver serverless de Neon (HTTP) en Prisma** (parqueado, Sprint 10): última palanca para cold starts. Reemplaza el driver TCP clásico por `@prisma/adapter-neon` + `@neondatabase/serverless`.
- **Manejo silencioso del error de `buscarProducto`** (fix 2026-05-23): si la action tira excepción dentro del `startTransition` de `BusquedaInput`, el error se traga (solo cartel ámbar de "Error en la búsqueda"). El fix de visibilidad del botón lo mitiga (el alta rápida sigue accesible), pero queda como limpieza futura envolver el `await` en try/catch para no perder el error real.
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
