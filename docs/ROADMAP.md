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

## Sprint 6 — Turnos, Ventas y Demo a Felipa 🔄 (en curso)

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

**Branch**: `sprint-6-0/turnos-cierre-caja`. Squash-mergeada a `main` el 2026-05-09 (commit `<COMPLETAR-HASH>`).

**Decisiones tomadas durante este sprint** (todas en `DECISIONES.md`):
- Modelo aplica a Admin y Vendedor (campo `userId`, no `vendedorId`).
- "Turno olvidado" = >12 horas abierto. Guard estricto vía middleware + layout (no banner lax).
- Snapshot al cerrar (`efectivoEsperadoCierre` + `diferencia` como columnas, no on-the-fly).
- Estado implícito (`cierreEn IS NULL = abierto`), sin enum.
- Páginas dedicadas, no modales.
- Concurrencia: partial unique index a nivel Postgres + catch P2002 en server action.
- Convenciones del repo confirmadas: `prisma` desde `@/lib/db`, server actions con `rawInput: unknown` + `ActionResult<T>` + helper `fail()`.
- Convención UX nueva: inputs vacíos en cálculos derivados muestran "—", no calculan contra 0.

### Sub-sprint 6.1 — P2.1 Nueva venta + Stock para vendedor 🔄 (próximo)

- Pantalla **Nueva venta** con búsqueda por código de barras (lector USB que emula teclado) o nombre.
- Selección de variante cuando el producto tiene varias.
- Carrito con múltiples productos y cantidades editables.
- Métodos de pago: efectivo, transferencia, débito, crédito. Pagos mixtos (`Venta.metodosPago` como JSON).
- Descuento automático del 10% al elegir efectivo o transferencia.
- ID corto de venta (formato: `F1-DDMM-NNN`, ej: `F1-2604-127`).
- **Asociación al turno abierto del vendedor**: al guardar la venta, se vincula automáticamente al `Turno` activo del vendedor.
- Baja de stock atómica: 1 INSERT en `MovimientoStock` (tipo VENTA, cantidad negativa) + 1 UPDATE en `Stock` por cada ítem, todo en transacción.
- **Stock para vendedor**: la pantalla `/stock` se modifica para que el vendedor la pueda ver en modo solo lectura, sin costo. Sin acceso a `/stock/movimientos` ni `/stock/ingreso`. Costo oculto a nivel HTML, no CSS.

### Sub-sprint 6.2 — P3.1 Historial de ventas

- Tabla cronológica con filtros (rango de fechas, método de pago, vendedor, estado).
- Detalle de venta clickeable (líneas, totales, métodos de pago, vendedor, turno asociado, ID corto, fecha/hora).
- Búsqueda por ID corto.
- Paginación.

### Sub-sprint 6.3 — P1 Dashboard del vendedor

- Resumen de **turno actual** (si hay uno abierto): efectivo inicial declarado, ventas hechas hasta ahora, monto por método de pago, esperado de caja vs real (calculado en tiempo real).
- **Mis turnos del mes**: tabla con cada turno cerrado del vendedor logueado — fecha, duración, ventas, monto vendido, diferencia de caja. Permite ver "cómo rindió" sin entrar a un sistema separado.
- Atajo grande a "Nueva venta".
- Si no hay turno abierto, prompt para abrir uno.

### Hito 🚀 DEMO A FELIPA

Después de cerrar 6.0 + 6.1 + 6.2 + 6.3, deploy del sistema a Vercel + Neon para que Felipa lo pruebe.

**Tareas del deploy**:
- Crear cuenta Neon, proyecto `felipa`, branch `demo` con seed de bazar realista.
- Crear proyecto Vercel conectado al repo de GitHub.
- Configurar env vars (`DATABASE_URL` con pooler, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, etc.).
- Migraciones contra Neon (`prisma migrate deploy`).
- Seed contra Neon una vez (con admin inicial + datos de bazar).
- Verificación: login, apertura de turno, una venta completa, cierre de turno.
- Compartir URL a Felipa.
- **Comunicación al cliente**: avisarle explícitamente que (a) las devoluciones, comprobante por WhatsApp, dashboard del admin y reportes vienen en la próxima fase; (b) el fichero formal y el calendario de turnos quedan para post-MVP; (c) el sistema sigue conviviendo con SSL Soft Gescom para facturación AFIP.

**Criterio de "listo"**: Felipa entra a la URL del demo desde su PC, se loguea con sus credenciales, abre un turno, registra una venta y la ve en el historial. Dashboard del vendedor le muestra el turno actual con datos reales.

**Duración estimada total** (Sprint 6 hasta demo): 4-5 sesiones.

---

## Sprint 6.5 — Post-demo, pre-go-live

**Objetivo**: features que quedaron fuera del demo pero son parte del MVP comprometido al cliente.

**Entregables**:
- **P2.2 — Devoluciones**: buscar venta por ID corto (≤30 días), devolución total o parcial, reversión de stock atómica.
- **Comprobante por WhatsApp**: botón en la confirmación de venta que abre `wa.me/<numero>` con un mensaje pre-armado (ID corto, total, ítems).
- **Ajustes de UX en función del feedback del demo**: lo que Felipa pida durante el período de prueba.

**Duración estimada**: 1-2 sesiones (depende del feedback del demo).

---

## Sprint 7 — Dashboard del admin y reportes (P7 + P8)

**Objetivo**: dar a Felipa información útil del negocio.

**Entregables (Plan Base)**:
- **P7 Dashboard del admin**: caja del día (suma de ventas + cierres de caja del día con diferencias), productos más vendidos del mes, ventas por método de pago, alertas básicas (turnos abiertos sin cerrar, stock negativo, ventas con devolución pendiente).
- **P8 Reportes**: ventas totales por día/semana/mes, productos más vendidos, ventas por método de pago, ventas por vendedor, **horas trabajadas por vendedor** (suma de duración de turnos cerrados).
- Exportación a CSV.

**Diferido al upgrade a Intermedio**:
- Gráficos interactivos avanzados.
- Comparativa entre sucursales (no aplica mono-sucursal).
- Exportación a Excel con formato.
- Alertas automáticas de stock bajo.

**Duración estimada**: 2 semanas.

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
- [x] Sprint 6.0 (modelo Turno + cierre de caja simple) ✅ 2026-05-09 — squash commit `<COMPLETAR-HASH>` en main
- [ ] Definir estrategia de backups de la DB (Neon tiene point-in-time restore en plan pago, en free tier evaluar `pg_dump` programado o aceptar el riesgo durante el demo)
- [ ] Definir dominio (`felipa.vercel.app` para el demo está bien; dominio custom para go-live a definir con cliente)
- [ ] Definir política de actualizaciones post-entrega
- [ ] Decisión del cliente sobre compra de impresora de tickets
- [ ] Comunicar al cliente antes del demo: alcance del demo, qué no entra al MVP (calendario, fichero, AFIP), doble registro durante el primer tiempo
- [ ] Migración a Next 15/16 (deuda técnica abierta) — post-go-live
- [ ] Migrar error de "cuenta desactivada" a código (deuda del Sprint 3.2 prompt 2)
