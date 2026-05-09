# ESTADO — Sistema Felipa

Bitácora viva del proyecto. Se actualiza después de cada sesión de trabajo.
**Este es el primer archivo que se le pega a Claude al arrancar un chat nuevo.**

---

## Sprint actual

**Sprint 6.4 cerrado (2026-05-09)** — commit `137bcdb` en `main`.

Todos los sub-sprints pre-demo completados (6.0 a 6.4). Próximo paso: **deploy del demo a Vercel + Neon**.

## Tarea en curso

Ninguna. Próximo paso: ejecutar el deploy del demo (crear cuenta Neon, proyecto Vercel, env vars, migraciones, seed, verificación).

## Último avance

**Sprint 6.4 — Refactor `/productos` para Vendedor con permissions (2026-05-09)** — squash commit `137bcdb` en `main`. Branch `sprint-6-4/productos-vendedor` pusheada a origin (commit `e98f535`). 3 archivos tocados (+53 / -14), 1 prompt.

Funcionalidad entregada:

- `lib/productos/permissions.ts` (nuevo): `permisosProductos(rol)` retorna `{ verCosto, crear, editar, eliminar }`. Admin todo `true`, Vendedor todo `false`. Patrón consistente con `permisosStock` y `permisosVentas`.
- `app/(app)/productos/page.tsx`: `requireAuth(['ADMIN', 'VENDEDOR'])` (antes solo ADMIN). Deriva `permissions` y las pasa a componentes.
- `ProductosTable.tsx`: columna Costo gateada con `permissions.verCosto`, columna Acciones gateada con `permissions.editar`, botón "Nuevo producto" gateado con `permissions.crear`. Todo a nivel HTML — el Vendedor no recibe datos de costo en el DOM.
- Rutas `/productos/nuevo` y `/productos/[id]/editar` ya tenían `requireAuth(['ADMIN'])` — sin cambios necesarios.
- Server actions de productos ya tenían guards de ADMIN — sin cambios necesarios.

**Sprint 6.3 — Dashboard del vendedor (2026-05-09)** — squash commit `984ac94` en `main`. Branch `sprint-6-3/dashboard-vendedor` pusheada a origin (commit `419385a`). 5 archivos tocados (+480 / -6), 1 prompt.

Funcionalidad entregada:

**Pantalla `/dashboard`** — dashboard del vendedor con turno actual y turnos del mes:
- `lib/turnos/queries.ts` extendido con `obtenerResumenTurnoAbierto` (turno abierto + agregación de ventas por método de pago en JS, cálculo de efectivo esperado) y `listarTurnosDelMes` (turnos cerrados del mes con conteo de ventas y total vendido). Helper `metodoCanonico` para normalizar variantes del JSON de `metodosPago`. Tipos `ResumenTurnoAbierto` y `TurnoMesItem` exportados. Decimals serializados a `number`.
- `app/(app)/dashboard/page.tsx`: Server Component, `requireAuth(['ADMIN', 'VENDEDOR'])`. Queries en paralelo. Renderiza `ResumenTurno` o `SinTurno` + `TablaTurnosMes`.
- `SinTurno.tsx`: Card con CTA "Abrir turno" (link a `/turno/abrir`) y "Nueva venta" deshabilitada visualmente.
- `ResumenTurno.tsx`: Client component con grid 2/4 cols (efectivo inicial, ventas, total vendido, efectivo esperado), chips por método (oculta los $0), botones "Nueva venta" y "Cerrar turno".
- `TablaTurnosMes.tsx`: Tabla de turnos cerrados del mes con diferencia coloreada (verde/rojo/—). Columnas Horario y Diferencia ocultas en mobile.

---

## Historial de sprints anteriores

**Sprint 6.2 — Historial de ventas completado (2026-05-09)** — commit `e2e9a00` en `main`. Branch `sprint-6-2/historial-ventas` pusheada a origin (vacía — Claude Code trabajó sobre `main` directamente). ~6 archivos tocados, 2 prompts.
- Pantalla `/ventas` con filtros (fecha, usuario, método), paginación 50 filas, modal de detalle.
- `permisosVentas(rol)`: Vendedor ve solo sus propias ventas (guard server-side en query y action). Admin ve todo con filtro por usuario.
- Botón "Ver historial" de `/ventas/exito` deja de ser 404.

**Sprint 6.1 — Nueva venta + Stock para Vendedor completado (2026-05-09)** — squash commit `27641de` en `main`. Branch local `sprint-6-1/nueva-venta` pusheada a origin. 25 archivos modificados, +2115 / -88.
- Pantalla `/ventas/nueva` funcional end-to-end: búsqueda dual (scanner USB + tipeo), carrito editable, panel de cobro con hasta 4 métodos, modal de cobro con warnings, página `/ventas/exito`.
- Backend: `crearVenta` + `crearVentaCore` con Zod + Decimal + transacción atómica + retry P2002. `buscarProducto` con auth. `codigoCorto` con formato `F1-DDMM-NNN`.
- Smoke `scripts/smoke-venta.ts`: 16/16 aserciones OK.
- Refactor `/stock` para Vendedor: `permisosStock(role)`, renderizado condicional HTML, guard en server actions.
- Fix: `requireTurnoAbierto` ahora hace redirect en vez de throw. Rename `idCorto` → `codigoCorto`.

**Sprint 6.0 completado (2026-05-09)** — commit `f3b6eab` en `main`.
- Modelo `Turno` + ciclo apertura/cierre de caja. Partial unique index. Guard de turno olvidado (>12hs). Snapshot al cerrar.

**Sprint 3 parte 2 completado (2026-05-08)** — squash commit `5ce5414` en `main`. Better Auth funcional, gestión de usuarios, schema rename `Usuario → User`.

**Sprint 5 (P6 Stock) completado (2026-04-28)** — vista de stock + ajustes + ingreso bulk + historial de movimientos con filtros y paginación.

**Sprint 4 (P5 Productos) completado (2026-04-27)** — listado, alta, edición con variantes, soft delete, markup automático 115%.

**Sprint 3 parte 1 completada (2026-04-27)** — schema, migración inicial, seed.

**Sprint 2 completado (2026-04-27)** — scaffold con mock auth.

**Sprint 1 — parcialmente avanzado**: cuestionario respondido + segunda ronda. **Pendiente**: tarde de observación in-situ en Felipa 1.

## Próxima tarea

**Deploy del demo a Vercel + Neon**. Tareas:
1. Crear cuenta Neon, proyecto `felipa`, branch `demo` con seed de bazar realista.
2. Crear proyecto Vercel conectado al repo de GitHub.
3. Configurar env vars (`DATABASE_URL` con pooler + `?pgbouncer=true&connection_limit=1`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, etc.).
4. Migraciones contra Neon (`prisma migrate deploy`).
5. Seed contra Neon (admin inicial + datos de bazar).
6. Verificación: login, apertura de turno, una venta completa, cierre de turno, historial, dashboard.
7. Crear un usuario Vendedor y verificar que ve solo lo que debe (sin costos, sin acciones de admin, solo sus ventas).
8. Compartir URL a Felipa.

Después del demo viene Sprint 6.5 (devoluciones, comprobante WhatsApp, ajustes de UX post-feedback). Ver `ROADMAP.md`.

## Bloqueos

Ninguno.

## Notas de contexto

### Stack
- Next.js 14.2.35 (App Router) + TypeScript + Postgres 16 (Docker en local) + Prisma 6 + Tailwind 3 + shadcn/ui.
- Tema: solo light (sin dark mode).
- **Auth: Better Auth 1.6.9 funcional** (DB sessions, hash scrypt gestionado por la librería, plugins `username` + `nextCookies`).

### Producción y deploy
- **Hosting decidido**: Vercel.
- **DB de producción decidida**: Neon (Postgres serverless, free tier suficiente, sin pausa por inactividad). Se va a crear un proyecto con dos branches: `demo` (con seed de bazar para mostrarle al cliente) y `prod` (con seed mínimo cuando llegue el go-live).
- **Connection pooling obligatorio** en Vercel: usar la URL del pooler de Neon con `?pgbouncer=true&connection_limit=1`.
- Docker local sigue siendo la DB de desarrollo, no se cambia.
- Big Burger queda en Supabase. Los slots free de Supabase del usuario se reservan para Big Pizza (próximo proyecto). Por eso Felipa va a Neon.

### Alcance y demo intermedio
- Alcance inicial: **MVP (Plan Base)** de la propuesta.
- **Hito intermedio**: antes del go-live formal hay un **demo a Felipa** en Vercel + Neon. El demo incluye login, ventas, stock para vendedor, historial, dashboard del vendedor, cierre de caja, consulta de productos (sin costos para vendedor). **No incluye en el demo**: devoluciones, comprobante por WhatsApp, dashboard del admin, reportes (esos vienen en Sprint 6.5 y Sprint 7, post-demo).
- **Diferidos a post-MVP** (no entran ni al demo ni al go-live): integración AFIP (sigue conviviendo con SSL Soft Gescom), calendario de turnos, fichero formal de jornada laboral, alertas automáticas de stock bajo, gráficos avanzados.

### Cliente y operación
- **Cliente**: Felipa — confirmado. Felipa 1 (bazar en Santa Rosa, La Pampa) es el único alcance del MVP.
- **Felipa 2**: proyecto distinto (local de ropa King of the Kongo + acompañantes), apertura tentativa primavera 2026. Fuera del alcance del MVP, se evalúa por separado cuando llegue.
- **Categoría AFIP**: Responsable Inscripto. Sistema de facturación propio existente: SSL Soft Gescom (versión `20251104-7023201`). El MVP NO integra AFIP, conviven en paralelo. Camino post-MVP más probable: reemplazo total con AFIP nativo (no integración con Gescom).
- **Volumen estimado**: caja diaria promedio $280k, sábados buenos $800k, picos navideños hasta $1.5M.
- **Equipo**: 4 personas total (dueña + hijo + 2 empleadas) cubriendo Felipa 1 y Big Burger / Big Pizza. Todos hacen todo en mostrador, salvo remarcado de mercadería ingresante (solo dueña + hijo).
- **Catálogo**: ~200 productos estimados, sin contar variantes. No hay catálogo digital previo, hay que cargar desde cero. Carga manual con la UX de P5.2 (atajos + "guardar y cargar otro" + categoría inline + autocompletado de markup).
- **Hardware del local**: 1 PC con Windows 10 viejo. Lector de código de barras confirmado para compra antes del go-live (emula teclado y termina el scan con Enter — el contrato del input de búsqueda en `/ventas/nueva` ya está alineado a eso). Impresora de tickets pendiente de decisión.
- **Internet en el local**: estable, no se corta. El sistema productivo es 100% dependiente de internet — trade-off conocido y aceptado.

### Modelo de datos (vigente)
- **Stock** modelado a nivel **variante** con `MovimientoStock.cantidad` como **delta signed**. `Stock.cantidad` es source of truth, cada ajuste = 1 INSERT en `MovimientoStock` + 1 UPDATE en `Stock` dentro de transacción Prisma.
- **Variantes** (color, tamaño, presentación): frecuentes. Soportadas desde el MVP. Precio y costo a nivel **producto** (`precioBase` / `costoBase`) con override opcional a nivel **variante** (`precio` / `costo` nullable que sobrescriben).
- **Métodos de pago**: efectivo, transferencia, débito, crédito. Pagos mixtos sí (modelados en `Venta.metodosPago` como JSON con shape `[{ metodo: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEBITO' | 'CREDITO', monto: number }]`). Sin cuenta corriente. **No se permiten métodos repetidos** (validación Zod en server action).
- **Descuento estándar**: 10% por efectivo o transferencia (regla automática del sistema). **Todo-o-nada**: aplica solo si TODOS los métodos son `EFECTIVO` o `TRANSFERENCIA`. Si hay un solo peso en débito o crédito, no hay descuento. Snapshot en `Venta.aplicaDescuento` y `Venta.descuentoTotal` al crear la venta — no se recalcula.
- **Markup sugerido**: 115% (al cargar costo, el sistema sugiere precio de venta). Totalmente editable, sin tope.
- **Modelo de Usuario**: tabla SQL `user` (lowercase, mapeada por `@@map`). Modelo Prisma `User`. Custom fields del dominio en español (`nombre`, `creadoEn`, `actualizadoEn`, `rol`, `activo`, `sucursalId`) — los nombres lógicos que pide Better Auth (`name`, `createdAt`, `updatedAt`) se mapean vía `user.fields` en `lib/auth/server.ts`. Campos `rol`, `activo`, `sucursalId` con `input: false` (no aceptados desde el cliente, solo desde server actions). Tablas auxiliares `Session`, `Account`, `Verification` también lowercase.
- **Modelo `Turno`** (vigente desde Sprint 6.0): `userId` (Admin o Vendedor), `aperturaEn`, `cierreEn` (nullable, `IS NULL` = abierto), `efectivoInicialDeclarado`, `efectivoContadoCierre`, `efectivoEsperadoCierre`, `diferencia`, `observacionesCierre`. Snapshot al cerrar. Partial unique index a nivel Postgres garantiza un solo turno abierto por user (`WHERE "cierreEn" IS NULL`). Relación 1-N con `Venta` vía `Venta.turnoId String?`. A partir del Sprint 6.1 toda venta nueva tiene `turnoId` validado por server action.
- **Modelo `Venta`** (vigente desde Sprint 6.1): `codigoCorto String @unique` (formato `F1-DDMM-NNN`, gaps aceptables), `subtotal Decimal`, `descuentoTotal Decimal @default(0)`, `total Decimal`, `aplicaDescuento Boolean @default(false)`, `metodosPago Json`, `usuarioId`, `sucursalId` (NOT NULL), `turnoId String?`, `creadaEn`. Modelo de líneas: `ItemVenta` con `ventaId`, `varianteId`, `cantidad`, `precioUnitario`, `subtotal`.

### Roles y permisos
- **Roles del MVP**: **Admin** (Felipa + hijo) y **Vendedor** (empleadas). Definidos como enum `Rol` en el schema.
- **Admin**: ve todo, incluido costos y reportes. Único que puede cargar productos, ajustar precios, hacer ingresos de mercadería, gestionar usuarios.
- **Vendedor**: registra ventas, consulta stock (sin costo, sin acciones de ajuste, sin acceso a `/stock/movimientos` ni `/stock/ingreso`), consulta productos (sin costo, sin crear/editar/eliminar — Sprint 6.4), consulta historial de ventas (solo las suyas). Costo oculto a nivel HTML, no CSS.
- **Login**: username + password (no email). Cuentas se crean desde la pantalla de Gestión de Usuarios (`/usuarios`, Admin only). Hash gestionado por Better Auth (scrypt). Email sintético `<username>@felipa.local` se genera automáticamente.
- **Defensa en profundidad para self-lockout**: la UI desactiva controles peligrosos en la fila del usuario logueado (switch de activo, campo Rol del modal de edición). Las server actions tienen guards independientes (no se puede desactivar al último admin activo, no se puede auto-degradar el rol).
- **Patrón de permisos por dominio** (vigente desde Sprint 6.1): `lib/<dominio>/permissions.ts` exporta `permisosX(rol)` que retorna un objeto tipado con flags booleanas por capacidad. El page Server Component deriva las permissions del rol del usuario, las pasa por prop a los componentes que renderizan UI condicional. Renderizado a nivel HTML (`{permissions.x && <Component />}`), nunca CSS. Las server actions del dominio validan rol independientemente — la UI esconde, el servidor rechaza. Implementaciones: `permisosStock` en `lib/stock/permissions.ts`, `permisosVentas` en `lib/ventas/permissions.ts`, `permisosProductos` en `lib/productos/permissions.ts`.

### Convenciones de código
- **Naming del schema en español**. Campos como `usuarioId`, `creadaEn`, `descuentoTotal`, `codigoCorto`. Modelos del dominio: `Venta`, `ItemVenta`, `MovimientoStock`, `Turno`. Excepción documentada: tablas que existen por requisitos de Better Auth (`user`, `session`, `account`, `verification`) usan los nombres que la librería espera.
- **Cliente Prisma**: importar de `@/lib/db` (no `@/lib/prisma`). Confirmado en Sprint 6.0.
- **Server actions**: reciben `rawInput: unknown`, parsean adentro con Zod, retornan `ActionResult<T>` (= `{ ok: true, ...data } | { ok: false, errores: string[] }`) usando el helper `fail()`. Convención compartida con `lib/productos/actions.ts`, `lib/usuarios/actions.ts`, `lib/turnos/actions.ts`, `lib/ventas/actions.ts`, `lib/stock/actions.ts`.
- **Server actions + script CLI testeable**: cuando un `'use server'` necesita exponer lógica a un smoke vía `tsx`, separar en `core.ts` (lógica pura, importable) y `actions.ts` (wrapper con `'use server'`, auth, redirects). Patrón confirmado en `lib/ventas/`.
- **Server actions de búsqueda con auth**: el cliente nunca envía `sucursalId`. La server action lo lee del session server-side, parsea el término con Zod (1-100 chars), llama al query subyacente y serializa los `Decimal` a `number` antes de retornar (cruce de boundary cliente-servidor). Patrón en `buscarProducto` de `lib/ventas/actions.ts`.
- **Server actions que crean users**: usar `prisma.user.create` con nested `account.create` y `hashPassword` de `better-auth/crypto`. **NO usar `auth.api.signUpEmail` desde request context** — pisa la sesión del admin logueado. El seed (CLI, sin sesión activa) sí usa `signUpEmail`.
- **Reset de password admin**: `hashPassword` + `prisma.account.updateMany` con `providerId: 'credential'`. Después `prisma.session.deleteMany({ where: { userId } })` para invalidar sesiones activas.
- **Pathname desde RSC**: middleware Next.js setea `x-pathname` en headers, layouts y pages lo leen con `headers().get('x-pathname')`. Patrón estándar para guards condicionales en Server Components que dependen de la ruta actual.
- **Invariantes de unicidad concurrente**: cuando una regla sea "un solo X por entidad Z cumpliendo condición Y", usar partial unique index a nivel Postgres (no solo validación a nivel app — race condition). Generar la migración con `prisma migrate dev --create-only` y editar el SQL para agregar el `CREATE UNIQUE INDEX ... WHERE ...` antes de aplicar.
- **Concurrencia en updates de contadores** (stock, etc.): usar `prisma.<model>.update({ data: { campo: { decrement/increment: x } } })`, que compila a UPDATE atómico con row-lock implícito de Postgres. NO leer-validar-escribir a nivel app, NO usar `SELECT FOR UPDATE` salvo necesidad explícita.
- **UX de inputs vacíos**: en cálculos derivados (diferencia = contado - esperado, etc.), si el input está vacío mostrar "—", no calcular contra 0. Calcular contra 0 da falsos negativos visuales tipo "-$5000 (faltó)" cuando el usuario aún no tipeó.
- **Server-only a nivel convención, no enforcement**: `lib/<dominio>/` es server-side por convención del proyecto. La protección formal queda en el `'use server'` de los archivos `actions.ts`. No usamos `import 'server-only'` (rompe smokes vía `tsx`).
- **Tipo Decimal para plata**: usar `Prisma.Decimal` consistentemente en cálculos. No mezclar con `Number` para evitar drift de coma flotante.
- **Validación de suma de pagos = total**: tolerancia 0.01 por float drift en el lado del cliente. Server-side el cálculo es Decimal exacto.
- **Patrón de búsqueda dual con scanner**: input con `autoFocus`, modo Enter (scanner) que dispara consulta inmediata + auto-agrega si hay match único + clear + refocus, modo tipeo con debounce (350ms recomendado, mínimo 2 chars) que muestra dropdown. Token de request (`reqIdRef`) para descartar respuestas fuera de orden cuando el usuario tipea rápido. Implementación de referencia: `BusquedaInput` en `app/(app)/ventas/nueva/_components/`.
- **Permisos por rol como prop**: el page Server Component deriva un objeto `permissions` desde el rol del usuario y lo pasa a los componentes que renderizan UI condicional. Implementaciones de referencia: `permisosStock` en `lib/stock/permissions.ts`, `permisosVentas` en `lib/ventas/permissions.ts`, `permisosProductos` en `lib/productos/permissions.ts`. Renderizado condicional a nivel HTML, NUNCA CSS — un usuario inspeccionando devtools no debe ver datos sensibles en el DOM.
- **Queries de lectura directas desde Server Components**: las queries puras (sin mutación) se llaman directamente desde el Server Component, no requieren server action wrapper. Las queries se definen en `lib/<dominio>/queries.ts`. Solo se crea server action wrapper cuando un client component necesita llamar a una query (ej: `obtenerDetalleVentaAction` para el modal de detalle).
- **Filtros vía URL (searchParams)**: los filtros de listados se manejan como searchParams en la URL, no como estado de cliente. Permite compartir URLs filtradas y navegación con back/forward. Patrón usado en `/stock/movimientos` y `/ventas`.

### Repo y entornos
- **Repo**: GitHub privado `sistema-felipa`, rama base `main`.
- **Branch del último sprint cerrado**: `sprint-6-4/productos-vendedor` (commit `e98f535` en la branch, squash `137bcdb` en main).
- **Branch en curso**: ninguna.
- **Convención de branches**: una branch por sprint (`sprint-<n>/<descripcion>`), squash merge a `main` al cerrar. Push de la branch a origin antes del squash para preservar la traza granular si alguien necesita bisect. **Gotcha**: verificar que Claude Code haga commits en la branch, no en main directamente — si trabaja en main, el squash no tiene efecto.
- **DB de desarrollo**: contenedor Docker `felipa-db` en puerto 5433, credenciales en `.env` local (no commiteado).
- **Sin fecha objetivo de go-live**.
- Propuesta comercial aprobada disponible como referencia (PDF de abril 2026).

## Decisiones pendientes

- **Inconsistencia de naming de roles**: el sistema tiene tres formas conviviendo — `'ADMIN'` uppercase string en `requireAuth(['ADMIN'])`, `Role.admin` lowercase en el `SessionUser` y `permisosStock(role)`, y `roles: ['admin', 'vendedor']` lowercase en `lib/nav.ts`. Cualquier comparación cruzada va a romperse silenciosamente. Es deuda preexistente que el Sprint 6.1 expuso al refactorear `/stock`. Vale unificar (probablemente al naming del enum `Rol` de Prisma) en algún momento — es un cambio mecánico pero requiere tocar muchos archivos. Candidato a un sprint dedicado de housekeeping antes del demo.
- **`StockPermissions.verCosto` no consumido aún**: la pantalla actual `/stock` no tiene columna Costo, así que la flag está definida pero no se usa. `ProductoPermissions.verCosto` sí se consume en `/productos` (Sprint 6.4). Queda como anticipación útil para cualquier pantalla futura de stock con datos de costo.
- **`obtenerHistorialVariante` ahora abierto a Vendedor**: cambio de contrato del Sprint 5 tomado en el Sprint 6.1. Justificación: la query no expone costos, solo movimientos. Decisión menor pero conviene volcarla a `DECISIONES.md` para que dentro de 3 meses no parezca un descuido.
- **Deuda técnica del Sprint 3.2 prompt 2**: el login form discrimina el error de "cuenta desactivada" matcheando el literal "deshabilitada" en `error.message`. Es frágil — si se cambia el wording o se internacionaliza, se rompe. Migrar a un código de error custom cuando haya tiempo (5 minutos). El mensaje vive en la constante `ACCOUNT_DISABLED_MESSAGE` exportada desde `lib/auth/server.ts`.
- **Repo en OneDrive**: el file watcher de OneDrive interfiere con git en Windows (genera mensajes "Deletion of directory ... failed. Should I try again?" en operaciones de checkout/merge). No rompe nada pero ensucia el output. Se manifestó en el cierre de los Sprints 6.1, 6.3 y 6.4. Considerar mover el repo fuera de la carpeta de OneDrive a algo tipo `C:\dev\sistema-felipa` cuando convenga.
- Estrategia de backups de la DB en Neon (point-in-time restore es plan pago; en free tier evaluar `pg_dump` programado o aceptar riesgo durante el demo).
- Dominio para el demo y para go-live (`felipa.vercel.app` alcanza para el demo; dominio custom para go-live a definir con cliente).
- Política de actualizaciones post-entrega.
- Compra (o no) de impresora de tickets antes del go-live.

---

## Cómo usar este archivo

- Al cerrar una sesión: actualizar "Último avance", "Tarea en curso" y "Próxima tarea".
- Al abrir una sesión nueva: pegar el contenido completo en el primer mensaje del chat.
- Decisiones importantes **no van acá**, van a `DECISIONES.md`.
- El plan macro **no va acá**, va a `ROADMAP.md`.
- Ubicación en el repo: `docs/ESTADO.md` (junto con `DECISIONES.md` y `ROADMAP.md`).
