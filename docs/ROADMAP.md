# ROADMAP — Sistema Felipa

Plan macro del proyecto, organizado en sprints. Se actualiza cuando cambia el alcance o la prioridad (no en cada tarea — eso va en `ESTADO.md`).

## Visión general

Construir un sistema web de gestión de stock y ventas para Felipa 1 (bazar en Santa Rosa, La Pampa). Arrancar con MVP funcional (Plan Base) y escalar iterativamente hacia Plan Intermedio según validación de uso real.

**Principio rector**: _"Empezar simple es empezar bien"_ (sección 8 de la propuesta). Entregar algo usable antes que algo completo.

**Hito intermedio (definido el 2026-05-08)**: antes del go-live formal hay un **demo a Felipa** desplegado en Vercel + Neon, para que el cliente vea el sistema funcionando y dé feedback con base real. El demo no incluye todas las features del MVP — incluye el flujo principal (login, ventas, stock, dashboard) suficiente para validar el rumbo.

---

## Sprint 0 — Setup técnico ✅ (2026-04-24)

**Objetivo**: dejar el proyecto arrancando en local con toda la infraestructura base lista.

**Entregables**:
- Repo Next.js 14 + TypeScript inicializado
- Tailwind configurado
- Prisma conectado a Postgres local
- Estructura de carpetas acordada
- Convenciones de código (ESLint, Prettier)
- README del proyecto con instrucciones de setup
- `.env.example` con variables necesarias

**Criterio de "listo"**: `npm run dev` levanta el proyecto en localhost, Prisma se conecta a la DB, una página de ejemplo se renderiza. **Cumplido**.

---

## Sprint 1 — Relevamiento y análisis (Etapa 1 de propuesta) — en curso

**Objetivo**: entender en detalle cómo opera hoy Felipa para no construir sobre supuestos.

**Entregables**:
- [x] Cuestionario de relevamiento respondido por el cliente (vía hijo de la dueña).
- [x] Decisiones grandes documentadas en `DECISIONES.md` (alcance Felipa 2, AFIP, variantes, roles).
- [x] Segunda ronda de preguntas (sistema actual, modelo de variantes, hardware) — respondida.
- [ ] **Tarde de observación in-situ en Felipa 1** — pendiente.
- [ ] Catálogo inicial de productos (parcial) en formato importable — se va armando junto con el inventario inicial físico de Sprint 8.

**Criterio de "listo"**: contexto operativo del local entendido al nivel necesario para no construir sobre supuestos. **Doc de requerimientos formal firmado por el cliente fue descartado** — el cliente confía en las decisiones técnicas y la documentación viva (`ESTADO.md` + `DECISIONES.md`) cubre la traza necesaria.

**Real**: Sprint 1 corre en paralelo con Sprint 2+ porque la observación in-situ no es bloqueante para arrancar el código.

---

## Sprint 2 — Scaffold de pantallas ✅ (2026-04-27)

**Objetivo**: dejar la estructura completa del sistema en código real, con navegación y protección de rutas, sin lógica de negocio.

**Entregables**:
- Estructura de rutas con route groups: `(public)/login`, `(app)/<10 pantallas>`, `/health`.
- Mock auth provisorio (cookie-based) en `lib/auth/mock.ts`. Reemplazado en Sprint 3 parte 2.
- Layouts con Sidebar (items según rol) + Header con role switcher dev-only y logout.
- Login placeholder con dos botones para entrar como Admin o Vendedor.
- 10 pantallas placeholder (P1–P10) con `requireAuth([...])` y código visible.
- Build verde, `tsc --noEmit` sin errores.

**Criterio de "listo"**: `npm run dev` levanta sin warnings, los 10 criterios de aceptación del prompt original pasan en navegador. **Verificado**.

---

## Sprint 3 parte 1 — Schema de DB y seed ✅ (2026-04-27)

**Objetivo**: armar los cimientos del backend.

**Entregables**:
- Schema Prisma con tablas del MVP (Producto, Variante, Stock, MovimientoStock, Venta, ItemVenta, Usuario, Sucursal, Categoría).
- Producto con `precioBase` y `costoBase`. Variante con `precio` y `costo` opcionales (override). Stock y venta a nivel **variante**.
- Migración inicial corriendo.
- Seed con datos realistas de bazar (aromatizantes, marroquinería, juguetes, accesorios, acero quirúrgico, belleza personal).
- Roles: enum `Rol` con `ADMIN` y `VENDEDOR`.

**Commit**: `034ae69`.

**Nota retroactiva (2026-05-08)**: el modelo `Usuario` se renombró a `User` en Sprint 3 parte 2 para alinear con Better Auth. Ver `DECISIONES.md`.

---

## Sprint 4 — Gestión de productos (P5) ✅ (2026-04-27)

**Objetivo**: CRUD completo de productos con código de barras y variantes.

**Entregables**:
- Listado con filtros (categoría, nombre, código).
- Alta/edición con variantes y override de precio/costo.
- Soft delete.
- Modal de categoría inline.
- Markup automático 115% (con flexibilidad).

**Commit**: `006fd53` y previo.

---

## Sprint 5 — Control de stock por sucursal (P6) ✅ (2026-04-28)

**Objetivo**: stock real, a nivel variante.

**Entregables**:
- **P6.1 — Vista de stock + ajustes individuales**: tabla agrupada por producto, filtros (búsqueda, categoría, stock bajo, stock negativo), 4 tipos de ajuste manual (Rotura, Robo/pérdida, Conteo, Devolución), modal de historial por variante. Stock negativo permitido con confirm.
- **P6.2 — Ingreso de mercadería bulk**: pantalla `/stock/ingreso` con buscador unificado (código de barras agrega directo, nombre con autocompletado), datos opcionales (identificador, proveedor, observaciones), una sola transacción atómica para todas las líneas.
- **P6.3 — Historial completo de movimientos**: pantalla `/stock/movimientos`, tabla cronológica con filtros (fecha, tipo, variante, usuario, motivo), running total con window function, paginación 50 filas, URL-based filters compartibles.

**Modelo**: `MovimientoStock.cantidad` como **delta signed** (positivo si suma, negativo si resta). `Stock.cantidad` es source of truth, cada ajuste = 1 INSERT en `MovimientoStock` + 1 UPDATE en `Stock` dentro de transacción Prisma.

**Verificación**: 13/13 tests end-to-end con Claude Preview MCP. Build y typecheck verdes.

---

## Sprint 3 parte 2 — Auth real + Gestión de Usuarios ✅ (2026-05-08)

**Objetivo**: reemplazar el mock auth por autenticación real con Better Auth, y permitir que el admin cree y administre cuentas.

**Cambio respecto al plan original**: este sprint estaba originalmente planificado para "cerca del go-live". Se adelantó porque el demo a Felipa lo amerita (mock auth con dos botones daba mala impresión).

**Branch**: `sprint-3-2/auth-real`. Squash-mergeada a `main` el 2026-05-08 (commit `5ce5414`). Branch local borrada, branch remota preservada como traza.

**Entregables completos**:
- [x] Resolución de las 5 vulnerabilidades de `npm audit` (4 resueltas, 1 documentada como deuda técnica). Commit `822012b`.
- [x] Better Auth v1.6.9 instalado y configurado (plugins `username` + `nextCookies`, DB sessions con invalidación inmediata).
- [x] Schema Prisma actualizado: rename `Usuario → User` (con `@@map("user")`), agrega `username` único, `email` (sintético `<username>@felipa.local`), `activo`, y tablas `Session`, `Account`, `Verification`. Custom fields `rol`, `activo`, `sucursalId` con `input: false`.
- [x] Hash de passwords gestionado por Better Auth (scrypt) — bcrypt no se usa.
- [x] Pantalla de login real (username + password) reemplazando los dos botones del mock.
- [x] Logout real desde el header.
- [x] `lib/auth/mock.ts` renombrado a `lib/auth/session.ts`. Cuerpo nuevo basado en `auth.api.getSession()`. Firma de `requireAuth([...])` y `getCurrentUser()` intacta. Las pantallas no se tocaron, solo find-replace de imports en 16 archivos.
- [x] Hook `databaseHooks.session.create.before` rechaza login con `APIError('FORBIDDEN', ...)` si `activo = false`.
- [x] Eliminación del role switcher dev-only del header.
- [x] Pantalla **Gestión de Usuarios** (`/usuarios`, Admin only): listado con filtros (búsqueda, rol, estado), modales de alta / edición / reset password, switch in-line de activo. Defensa en profundidad (UI + server) para self-lockout.
- [x] Seed actualizado: solo crea **un admin inicial** (`felipa` / `felipa1234`, rol `ADMIN`).
- [x] Header muestra nombre del usuario logueado (no "Admin" / "Vendedor").

**Decisiones tomadas durante este sprint** (todas en `DECISIONES.md`):
- Librería: **Better Auth** (no Auth.js v5, no Supabase Auth).
- Estrategia de sesión: **DB sessions** (no JWT) — por invalidación inmediata.
- Hashing: **gestionado por Better Auth (scrypt)** — no bcrypt, no hash a mano.
- Login: **username + password** (no email).
- Cuentas: **se crean manualmente** desde Gestión de Usuarios (no en el seed).
- Schema: **rename `Usuario → User`** con field mapping de `name`/`createdAt`/`updatedAt` a `nombre`/`creadoEn`/`actualizadoEn`.
- Workflow: **branch dedicada por sprint** + squash merge a `main` al cerrar.
- **Crear usuarios server-side**: `prisma.user.create` directo, no `signUpEmail` desde request context (pisa la sesión del admin vía `nextCookies`).
- **Reset de password admin**: `hashPassword` de `better-auth/crypto` + write directo a `account.password`.

**Plan de prompts a Code** (ejecutado):
1. **Prompt 1 (`471d0e1`)**: install + schema + migración + seed.
2. **Prompt 2 (`852a19c`)**: login form real + logout + integración con `requireAuth` + remoción del role switcher + hook `activo`.
3. **Prompt 3 (`03406e6`)**: pantalla `/usuarios` con CRUD + reset password + activación/desactivación.

**Verificación final**: build verde, tsc verde, smoke test de 10 pasos en navegador (login Admin, crear Vendedor, login Vendedor, edit, reset password, desactivar, último-admin guard, etc.).

**Commit en main**: `5ce5414` (squash de los 3 commits anteriores).

---

## Sprint 6 — Turnos, Ventas y Demo a Felipa ✅

**Objetivo**: cerrar el flujo central del sistema (cierre de caja + ventas + historial + dashboard del vendedor) y dejarlo desplegado en Vercel + Neon para que Felipa lo pruebe.

**Reorganización respecto al plan original**: el Sprint 6 original era "Ventas (P2 + P3)". Ahora abarca también el modelo de Turno y el cierre de caja simple, que el cliente pidió y va antes de las ventas (las ventas se asocian al turno abierto). Devoluciones y WhatsApp se mueven a Sprint 6.5 (post-demo).

### Sub-sprint 6.0 — Modelo Turno + Cierre de caja simple ✅ (2026-05-09)

**Entregables completos**:
- Modelo `Turno` con `userId` (Admin o Vendedor), `aperturaEn`, `cierreEn`, `efectivoInicialDeclarado`, `efectivoContadoCierre`, `efectivoEsperadoCierre`, `diferencia`, `observacionesCierre`. Relación 1-N con `Venta` (`turnoId String?` nullable).
- Partial unique index a nivel Postgres (`WHERE "cierreEn" IS NULL`) garantiza un solo turno abierto por user. Migración generada con `--create-only` y editada manualmente para agregar el SQL del index.
- Server actions `abrirTurno` / `cerrarTurno` con defensa en profundidad (validación a nivel app + catch de `P2002` para race condition).
- Helper `getTurnoOlvidado` con umbral 12 horas + middleware Next.js que expone `x-pathname` + guard en `(app)/layout.tsx` que redirige forzadamente a `/turno/cerrar` si hay turno olvidado.
- Pantallas `/turno/abrir` y `/turno/cerrar` con resumen, breakdown por método de pago, diferencia live, alert + datetime-local cuando es olvidado.
- Ítem "Mi turno" en sidebar (link estático a `/turno/abrir`, redirect dinámico hace el resto).
- Helper `requireTurnoAbierto` exportado desde `lib/turnos/guards.ts` para uso en Sprint 6.1.

**Branch**: `sprint-6-0/turnos-cierre-caja`. Squash-mergeada a `main` el 2026-05-09 (commit `f3b6eab`).

**Decisiones tomadas durante este sprint** (todas en `DECISIONES.md`):
- Modelo aplica a Admin y Vendedor (campo `userId`, no `vendedorId`).
- "Turno olvidado" = >12 horas abierto. Guard estricto vía middleware + layout (no banner lax).
- Snapshot al cerrar (`efectivoEsperadoCierre` + `diferencia` como columnas, no on-the-fly).
- Estado implícito (`cierreEn IS NULL = abierto`), sin enum.
- Páginas dedicadas, no modales.
- Concurrencia: partial unique index a nivel Postgres + catch P2002 en server action.
- Convenciones del repo confirmadas: `prisma` desde `@/lib/db`, server actions con `rawInput: unknown` + `ActionResult<T>` + helper `fail()`.
- Convención UX nueva: inputs vacíos en cálculos derivados muestran "—", no calculan contra 0.

### Sub-sprint 6.1 — P2.1 Nueva venta + Stock para vendedor ✅ (2026-05-09)

**Commit**: squash `27641de` en `main`. Branch `sprint-6-1/nueva-venta`.

**Entregables completos**:
- Pantalla `/ventas/nueva` funcional end-to-end: búsqueda dual (scanner USB + tipeo con debounce), carrito editable, panel de cobro con hasta 4 métodos, modal de cobro con warnings de stock negativo, página `/ventas/exito` con código corto.
- Backend `lib/ventas/`: `crearVenta` + `crearVentaCore` con Zod + Decimal + transacción atómica + retry P2002. `buscarProducto` con auth. `codigoCorto` formato `F1-DDMM-NNN`.
- Smoke `scripts/smoke-venta.ts`: 16/16 aserciones.
- Refactor `/stock` para Vendedor: `permisosStock(role)`, renderizado condicional HTML, guard en server actions.
- Fix: `requireTurnoAbierto` redirect en vez de throw. Rename `idCorto` → `codigoCorto`.

### Sub-sprint 6.2 — P3.1 Historial de ventas ✅ (2026-05-09)

**Commit**: `e2e9a00` en `main`. Branch `sprint-6-2/historial-ventas`.

**Entregables completos**:
- Pantalla `/ventas` con listado paginado (50 filas), filtros por fecha/usuario/método de pago vía searchParams.
- Modal de detalle clickeable: items con producto + variante, métodos de pago, totales con desglose de descuento, datos del turno.
- Vendedor ve solo sus propias ventas (guard server-side en query y action). Admin ve todo con filtro por usuario.
- `lib/ventas/permissions.ts`: `permisosVentas(rol)` → `{ verTodas, filtrarPorUsuario }`.
- Botón "Ver historial" de `/ventas/exito` deja de ser 404.

### Sub-sprint 6.3 — P1 Dashboard del vendedor ✅ (2026-05-09)

**Commit**: squash `984ac94` en `main`. Branch `sprint-6-3/dashboard-vendedor`.

**Entregables completos**:
- Pantalla `/dashboard` con dos estados: turno abierto (resumen con stats y desglose por método) o sin turno (CTA para abrir).
- Queries `obtenerResumenTurnoAbierto` y `listarTurnosDelMes` en `lib/turnos/queries.ts`. Agregación de ventas por método de pago en JS (JSON `metodosPago`). Helper `metodoCanonico` para normalizar variantes de casing.
- Tabla de turnos cerrados del mes con cantidad de ventas, total vendido y diferencia coloreada.
- Responsive: columnas Horario y Diferencia ocultas en mobile.
- Botones "Nueva venta" y "Cerrar turno" linkean a las pantallas existentes.

### Sub-sprint 6.4 — Refactor `/productos` para Vendedor ✅ (2026-05-09)

**Commit**: squash `137bcdb` en `main`. Branch `sprint-6-4/productos-vendedor`.

**Entregables completos**:
- `lib/productos/permissions.ts`: `permisosProductos(rol)` → `{ verCosto, crear, editar, eliminar }`. Admin todo `true`, Vendedor todo `false`.
- `/productos` abierta a VENDEDOR (`requireAuth(['ADMIN', 'VENDEDOR'])`). Columnas Costo y Acciones gateadas con permissions a nivel HTML. Botón "Nuevo producto" gateado con `permissions.crear`.
- Rutas de escritura (`/productos/nuevo`, `/productos/[id]/editar`) y server actions ya tenían `requireAuth(['ADMIN'])` — sin cambios necesarios.

### Hito 🚀 DEMO A FELIPA ✅ (2026-05-09)

Deploy completado: commit `7d70496` en `main`, URL live **https://sistema-felipa.vercel.app**.
Neon (São Paulo, sa-east-1), Vercel auto-deploy desde `main`. Login, ventas, stock, dashboard del vendedor verificados en producción.

---

## Sprint 6.5 — Mejoras post-demo ✅ (2026-05-22)

**Objetivo**: features prioritarias según el uso real del demo en el local.

**Entregables completos**:
1. ✅ **Fix bug registro de venta bajo concurrencia** — commits `f3664a3` + `0c3f076`. Advisory lock transaccional pooler-safe + NNN por `max()` + guard `useRef` contra doble submit.
2. ✅ **Descuento editable** — commit `33dc571`. Fuera el 10% automático; manual y opcional por % o monto fijo; el 10% efectivo/transferencia queda como botón de un toque. Campos `descuentoTipo` + `descuentoValor` + `descuentoTotal` snapshot.
3. ✅ **Alta rápida de producto en la venta** — commit `bd87340`. Nombre + precio, `incompleto=true` + `creadoPorId`. Auto-desmarca cuando Admin completa con `costoBase>0` y categoría. Vendedora puede.
4. ✅ **Cancelar venta** — commit `4e0b0f0`. Anular solo con el turno abierto. `anuladaEn` + `anuladaPorId` + `motivoAnulacion`. Reversión de stock atómica. Excluida de agregaciones. Vendedora anula sus propias del turno.
5. ✅ **Retiro de caja** — commit `331463b`. Modelo `MovimientoCaja` (varios por turno). Esperado al cierre = inicial + ventas efectivo − retiros. Vendedora puede.
6. ✅ **Importador de catálogo** — commit `c74328a`. Script idempotente para planilla normalizada.
7. ✅ **Devoluciones (P2.2) + comprobante por WhatsApp** — commit `8bda9bb`. Modelos `Devolucion` + `ItemDevolucion`, ≤30 días, parcial/total, stock revertido. Helper `lib/ventas/comprobante.ts` + botón en `/ventas/exito`. Migración deployada a Neon.

**3 mejoras UX post-sprint (también en `main`)**:
- ✅ **"Guardar y cargar otro" limpia el form** + feedback verde + foco al nombre — commit `5308d8e`.
- ✅ **Tachito eliminar en la tabla de productos** (solo Admin, soft delete vía `desactivarProducto`, fila desaparece) — commit `5308d8e`.
- ✅ **Fixes de links rotos**: "Cerrar turno" en dashboard → `/turno/cerrar`; links a venta desde stock/movimientos usan deep link `/ventas?venta=<id>` — commit `42bf0b3`.

**Permisos (decididos por PO)**: la Vendedora puede aplicar descuentos, hacer retiros y anular sus ventas del turno; todo queda registrado con quién. Sin tope al inicio.

**Decisiones nuevas en `DECISIONES.md`**: descuento manual (reverso del 10%), alta rápida con `incompleto`+`creadoPor`, anular solo turno abierto vs devolución post-cierre, retiros con `MovimientoCaja`, devoluciones separadas de anulación con tracking de caja manual.

---

## Sprint 7 — Dashboard del admin y reportes (P7 + P8) ✅ (2026-05-22)

**Objetivo**: dar a Felipa información útil del negocio.

**Entregables (Plan Base)**:
- **P7 Dashboard del admin** ✅ — commit `3fc152c`. Caja del día (total + desglose por método + cierres del día con diferencia destacada + turnos abiertos con alerta >12h), top 10 productos del mes (neto de devoluciones), ventas por método del mes, alertas (turnos largos, stock negativo, productos incompletos). Vendedor sin cambios.
- **P8 Reportes** ✅ — commit `99daa6a`. Ruta `/reportes` Admin-only con filtro de rango (default mes actual, parseo defensivo). 5 reportes: ventas totales por día/semana/mes (granularidad seleccionable, semana lun–dom), productos más vendidos (neto de devoluciones), ventas por método de pago, ventas por vendedor, horas trabajadas por vendedor.
- **Exportación a CSV** ✅ — client-side, escapado RFC-4180, BOM UTF-8 para Excel en Windows.

**Decisiones clave (ver `DECISIONES.md`)**:
- Timezone AR (UTC−3 fijo) para todos los cortes de día/mes y bucketing por período.
- Semántica de métodos de pago: porción del JSON, no total de la venta.
- Venta → vendedor por `Venta.usuarioId`.
- Gate de rol auditado: 4 convenciones de naming conviviendo, no unificadas en este sprint.

**Diferido al upgrade a Intermedio**:
- Gráficos interactivos avanzados.
- Comparativa entre sucursales (no aplica mono-sucursal).
- Exportación a Excel con formato.
- Alertas automáticas de stock bajo.

**Duración real**: 1 sesión (parte 1 + parte 2 + cierre).

---

## Sprint 7.5 — Housekeeping ✅ (2026-05-22)

**Objetivo**: saldar dos deudas acotadas auditadas en Sprint 7, sin tocar features.

**Entregables**:
- **Unificación de naming de roles** ✅ — commit `8894ba7`. Canónico único = enum `Rol` de `@prisma/client` (uppercase) de punta a punta. `requireAuth` tipado a `Rol[]`. Eliminados el tipo paralelo `Role`, los helpers de traducción y el `toLowerCase()` del borde. `SessionUser.role` → `.rol`. Sin migración: la columna ya estaba tipada como enum en la DB.
- **Sidebar responsive** ✅ — mismo commit. Breakpoint `lg` (1024px). Drawer off-canvas (`Sheet` de shadcn) en mobile, sidebar fija intacta en desktop. Fuente única de nav (`navGroupsForRole(rol)`).

**Fuera de alcance** (deja para más adelante):
- Overflow horizontal de tablas anchas en `/reportes` en pantallas chicas (`overflow-x-auto`).
- `npm audit fix` (las 3 vulnerabilidades reportadas no se tocaron).

**Duración real**: 1 sesión.

---

## Sprint 9 — Configuración del negocio ✅ (2026-05-23)

**Objetivo**: dar a Felipa una pantalla para editar los parámetros del negocio que estaban hardcodeados, sin tocar código.

**Entregables**:
- **Tabla `Configuracion` singleton** ✅ — un único row (id fijo) con datos del negocio (nombre, dirección, teléfono, CUIT), parámetros de venta (`markupDefault` como multiplicador, `descuentoEstandar` como %) y stock/devoluciones (`diasDevolucion`, `umbralStockBajo`). Migración propia, aplicada a Neon previo al deploy.
- **Pantalla `/configuracion`** ✅ — Admin edita las 3 secciones del negocio; cualquier rol logueado ve "Mi cuenta" para cambiar su propia password (`auth.api.changePassword`, requiere la actual).
- **Helper get-or-create** ✅ — `obtenerConfiguracion()` autocrea el row con `CONFIGURACION_DEFAULTS` si no existe, envuelto en `cache()` de React. Única fuente de defaults; el seed quedó reducido a llamar al helper. En prod alcanza con aplicar la migración —el row se autocrea en la primera lectura.
- **Cableado de los 5 parámetros** ✅ — markup en `ProductoForm`, descuento del botón "1 toque" Ef/Transf, días de devolución en `crearDevolucion` **y** en `DetalleVentaModal` (tenía un segundo hardcode), umbral de stock bajo en queries + helpers puros + componentes de display, datos del negocio en el comprobante de WhatsApp. Patrón: la config se lee en el borde (RSC / server actions) y se pasa como prop a los client components; los helpers puros reciben los valores como parámetro.

**Cerrado en un commit de código + un commit de docs**: `74cd304`.

**Duración real**: 2 sesiones (fundación + cableado).

---

## Sprint 10 — Optimización de performance (próximo)

**Objetivo**: bajar el tiempo de carga percibido por el usuario. La app se siente lenta en uso real.

**Hipótesis a investigar (orden tentativo)**:
- **Cold starts**: Vercel functions + Neon scale-to-zero en free tier. Medir y decidir si vale upgrade o mitigar (warm-up cron, fluid compute, etc.).
- **Queries pesadas / N+1**: auditar las consultas de las pantallas más usadas (ventas, stock, dashboard, reportes).
- **Bundles client demasiado grandes** o JS hidratando de más en pantallas que podrían ser server-only.
- **`obtenerConfiguracion()` upsert por request** (deuda anotada del Sprint 9): pasar a buscar-y-crear-si-falta para que el caso normal sea solo lectura.

**Entregables**: medición antes/después documentada, cambios aplicados, criterio de "ok" definido al arrancar.

---

## Sprint 8 — Testing, implementación y capacitación (Etapa 4 de propuesta)

**Objetivo**: que el sistema funcione en el local productivo y el equipo lo use bien.

**Entregables**:
- Testing manual exhaustivo de flujos críticos.
- Playwright para los 3-4 flujos más críticos (login, apertura/cierre de turno, nueva venta, baja de stock).
- Crear branch `prod` en Neon (paralela a `demo`) con seed limpio (solo admin inicial + categorías base).
- Deploy productivo (mismo Vercel project con env vars apuntando a `prod`).
- **Carga completa del catálogo real** de Felipa (manual con la UX de P5.2 — atajos, "guardar y cargar otro", autocompletado de markup).
- **Inventario inicial físico** asistido: contar todo el local, cargar al sistema. Estimar 1-2 días con todo el equipo.
- Verificación de hardware: PC del local con Chrome/Edge actualizado, lector de código de barras conectado y probado, impresora de tickets (si se compró) configurada.
- **Capacitación al equipo**: dueña + hijo + 2 empleadas. Énfasis en doble registro (sistema nuevo + facturación AFIP en SSL Soft Gescom existente) hasta integración futura.
- Manual de usuario (PDF corto con capturas).
- Período de acompañamiento de 1-2 semanas.

**Criterio de "listo"**: el equipo de Felipa opera el sistema sin ayuda de Agustín durante 1 semana completa.

**Duración estimada**: 2-3 semanas.

---

## Evolución post-MVP (Etapa 5 de propuesta)

Features que quedan para después del go-live, priorizadas según uso real:

- **Reemplazo total del sistema de facturación actual** (SSL Soft Gescom) con integración AFIP nativa vía Web Service o wrapper (TusFacturas / iFactura / Facturante). Sin esto el doble registro persiste.
- **Calendario de turnos** asignados por vendedora (vista mensual, gestión de ausencias, cambios de turno).
- **Fichero formal de jornada laboral** (basado en los timestamps `aperturaEn` / `cierreEn` que ya guarda el modelo `Turno` desde el día 1) — comparación contra calendario para detectar llegadas tarde, reporte de horas, etc.
- **Migración a Next 15 / 16** (cierra la deuda técnica de la vulnerabilidad pendiente).
- **Migración a Prisma 7** (decisión diferida desde Sprint 0).
- **Migración del error de "cuenta desactivada" a código de error** (deuda técnica del Sprint 3.2 prompt 2 — hoy se discrimina por string match contra el literal "deshabilitada"; cuando haya tiempo migrar a un código custom).
- Historial de precios.
- Alertas de stock bajo automáticas.
- Dashboard con gráficos avanzados.
- Exportación a Excel con formato.
- Preparación para e-commerce.
- Evaluación: extender este sistema a Felipa 2 (local de ropa) o arrancar uno nuevo cuando abra.

Cada una se evalúa y cotiza por separado. No se promete nada en el MVP.

---

## Tareas transversales

- [x] Migrar repo de local a GitHub privado ✅ 2026-04-24
- [x] Revisar 5 vulnerabilidades `npm audit` ✅ 2026-05-08 (4 resueltas, 1 documentada como deuda técnica — Next.js)
- [ ] Tarde de observación in-situ en Felipa 1
- [x] Definir hosting productivo ✅ 2026-05-08 — **Vercel**
- [x] Definir DB de producción ✅ 2026-05-08 — **Neon** (con branches `demo` y `prod`)
- [x] Definir librería de auth ✅ 2026-05-08 — **Better Auth con DB sessions, hash scrypt**
- [x] Definir workflow de branches ✅ 2026-05-08 — **branch dedicada por sprint** + squash merge a `main` al cerrar
- [x] Sprint 3.2 (auth real + gestión de usuarios) ✅ 2026-05-08 — squash commit `5ce5414` en main
- [x] Sprint 6.0 (modelo Turno + cierre de caja simple) ✅ 2026-05-09 — commit `f3b6eab` en main
- [x] Sprint 6.1 (nueva venta + stock para vendedor) ✅ 2026-05-09 — squash commit `27641de` en main
- [x] Sprint 6.2 (historial de ventas) ✅ 2026-05-09 — commit `e2e9a00` en main
- [x] Sprint 6.3 (dashboard del vendedor) ✅ 2026-05-09 — squash commit `984ac94` en main
- [x] Sprint 6.4 (refactor /productos para vendedor) ✅ 2026-05-09 — squash commit `137bcdb` en main
- [x] Deploy del demo a Vercel + Neon ✅ 2026-05-09
- [ ] Definir estrategia de backups de la DB (Neon tiene point-in-time restore en plan pago, en free tier evaluar `pg_dump` programado o aceptar el riesgo durante el demo)
- [ ] Definir dominio (`felipa.vercel.app` para el demo está bien; dominio custom para go-live a definir con cliente)
- [ ] Definir política de actualizaciones post-entrega
- [ ] Decisión del cliente sobre compra de impresora de tickets
- [ ] Comunicar al cliente antes del demo: alcance del demo, qué no entra al MVP (calendario, fichero, AFIP), doble registro durante el primer tiempo
- [ ] Migración a Next 15/16 (deuda técnica abierta) — post-go-live
- [ ] Migrar error de "cuenta desactivada" a código (deuda del Sprint 3.2 prompt 2)
