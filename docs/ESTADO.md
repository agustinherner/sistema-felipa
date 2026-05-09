# ESTADO — Sistema Felipa

Bitácora viva del proyecto. Se actualiza después de cada sesión de trabajo.
**Este es el primer archivo que se le pega a Claude al arrancar un chat nuevo.**

---

## Sprint actual

**Entre sprints**. Recién cerró **Sprint 6.0 — Modelo Turno + Cierre de caja simple** (squash commit `<COMPLETAR-HASH>` mergeado a `main` el 2026-05-09). Próximo: **Sprint 6.1 — Nueva venta + Stock para vendedor**.

## Tarea en curso

Ninguna — se cerró el sprint. La próxima sesión arranca con **Sprint 6.1** en una branch nueva (`sprint-6-1/nueva-venta` o similar — el nombre se define al arrancar).

## Último avance

**Sprint 6.0 completado (2026-05-09)** — squash commit `<COMPLETAR-HASH>` en `main`.

Tres prompts a Code, ejecutados en branch dedicada `sprint-6-0/turnos-cierre-caja` y commiteados como un único paquete (squash):

- **Prompt 1 — Schema + migración**: modelo `Turno` con `userId`, `aperturaEn`, `cierreEn`, `efectivoInicialDeclarado`, `efectivoContadoCierre`, `efectivoEsperadoCierre`, `diferencia`, `observacionesCierre`. Relación 1-N con `Venta` (`Venta.turnoId String?` nullable hasta Sprint 6.1). Migración generada con `--create-only` y editada para agregar el partial unique index `turno_user_abierto_unique` con `WHERE "cierreEn" IS NULL`. Smoke de concurrencia confirmado: segundo INSERT con mismo userId falla con `duplicate key value violates unique constraint`.
- **Prompt 2 — Server actions + queries + guards**: `lib/turnos/queries.ts` (`getTurnoAbierto`, `getTurnoOlvidado` con umbral 12hs, `calcularEfectivoVendidoEnTurno` parseando `Venta.metodosPago` con Zod y tolerando JSON corrupto), `lib/turnos/actions.ts` (`abrirTurno` con defensa en profundidad app+DB, `cerrarTurno` con snapshot de esperado y diferencia, validación de `cierreEnOverride`), `lib/turnos/guards.ts` (`requireTurnoAbierto` para Sprint 6.1).
- **Prompt 3 — Pantallas + guard global**: `middleware.ts` exponiendo `x-pathname` (no existía antes), guard en `(app)/layout.tsx` que redirige a `/turno/cerrar` si hay turno olvidado y no estamos ya ahí, pantallas `/turno/abrir` y `/turno/cerrar` con resumen, breakdown por método de pago, diferencia live, alert + datetime-local cuando es olvidado, ítem "Mi turno" en sidebar (link estático a `/turno/abrir`, redirect dinámico hace el resto).

**Decisiones técnicas nuevas** registradas en `DECISIONES.md`:

- **Modelo Turno aplica a Admin y Vendedor** (campo `userId`, no `vendedorId`). Cualquiera que vende abre y cierra turno.
- **"Turno olvidado" = >12 horas abierto**, con guard estricto vía middleware (`x-pathname`) + layout (redirect). Override de `cierreEn` permitido solo cuando el turno es olvidado.
- **Snapshot al cerrar**: `efectivoEsperadoCierre` y `diferencia` se guardan como columnas, no se recalculan.
- **Concurrencia**: partial unique index a nivel Postgres (`WHERE "cierreEn" IS NULL`) garantiza un solo turno abierto por user. Convención: usar partial unique indexes para invariantes "un solo X por Z cumpliendo condición Y".

**Convenciones del repo confirmadas en este sprint**:
- `prisma` se importa de `@/lib/db` (no `@/lib/prisma`).
- Server actions: `rawInput: unknown` parseado adentro con Zod, retorno `ActionResult<T>` con helper `fail()`.
- UX: inputs numéricos vacíos en cálculos derivados muestran "—", no calculan contra 0 (evita falsos visuales tipo "-$5000 faltó" cuando el usuario aún no tipeó).

DB final post-sprint (en main): admin `felipa`, vendedor `andrea`, admin `hijo`. Tabla `turno` vacía (smoke limpiado).

Branch remota `origin/sprint-6-0/turnos-cierre-caja` preservada en GitHub como traza fina del sprint.

---

**Sprint 3 parte 2 completado (2026-05-08)** — squash commit `5ce5414` en `main`. 46 archivos, +2371 / -294. Better Auth funcional, gestión de usuarios, schema rename `Usuario → User`, hashPassword directo para create/reset desde server actions.

---

**Sprint 5 (P6 Stock) completado (2026-04-28)**:

- **P6.1** vista de stock + ajustes individuales (rotura, robo, conteo, devolución), modal de historial por variante. Stock negativo permitido con confirm. `MovimientoStock.cantidad` modelado como **delta signed**.
- **P6.2** ingreso de mercadería bulk con buscador unificado, una sola transacción atómica, validaciones de variante activa.
- **P6.3** historial completo de movimientos en `/stock/movimientos` con filtros vía URL (fecha, tipo, variante, usuario, motivo), running total con window function, paginación 50 filas.

**Sprint 4 (P5 Productos) completado (2026-04-27)** — listado, alta, edición con variantes y override de precio/costo, soft delete, modal de categoría inline, markup automático 115%.

**Sprint 3 parte 1 completada (2026-04-27)** — schema, migración inicial, seed.

**Sprint 2 completado (2026-04-27)** — scaffold con mock auth.

**Sprint 1 — parcialmente avanzado**: cuestionario respondido + segunda ronda. **Pendiente**: tarde de observación in-situ en Felipa 1.

## Próxima tarea

**Sprint 6.1 — Nueva venta + Stock para vendedor**.

- Pantalla `/ventas/nueva` con búsqueda por código de barras (lector USB que emula teclado) o nombre, selección de variante cuando hay varias, carrito editable, métodos de pago (efectivo, transferencia, débito, crédito) con pagos mixtos, descuento automático 10% por efectivo/transferencia, ID corto formato `F1-DDMM-NNN`.
- **Asociación automática al turno abierto** del usuario logueado vía `requireTurnoAbierto()` (helper ya creado en Sprint 6.0). Sin turno abierto, la pantalla redirige a `/turno/abrir`.
- Baja de stock atómica: 1 INSERT en `MovimientoStock` (tipo VENTA, cantidad negativa) + 1 UPDATE en `Stock` por cada ítem, todo en transacción Prisma.
- **Modificación de la pantalla `/stock`** para soportar modo lectura del Vendedor: sin costo (oculto a nivel HTML, no CSS), sin acciones de ajuste, sin acceso a `/stock/movimientos` ni `/stock/ingreso`.

Después de 6.1 vienen 6.2 (Historial de ventas con detalle clickeable y filtros), 6.3 (Dashboard del vendedor mostrando turno actual + turnos del mes) y el deploy del demo a Vercel + Neon. Ver `ROADMAP.md`.

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
- **Hito intermedio**: antes del go-live formal hay un **demo a Felipa** en Vercel + Neon. El demo incluye login, ventas, stock para vendedor, historial, dashboard del vendedor, cierre de caja. **No incluye en el demo**: devoluciones, comprobante por WhatsApp, dashboard del admin, reportes (esos vienen en Sprint 6.5 y Sprint 7, post-demo).
- **Diferidos a post-MVP** (no entran ni al demo ni al go-live): integración AFIP (sigue conviviendo con SSL Soft Gescom), calendario de turnos, fichero formal de jornada laboral, alertas automáticas de stock bajo, gráficos avanzados.

### Cliente y operación
- **Cliente**: Felipa — confirmado. Felipa 1 (bazar en Santa Rosa, La Pampa) es el único alcance del MVP.
- **Felipa 2**: proyecto distinto (local de ropa King of the Kongo + acompañantes), apertura tentativa primavera 2026. Fuera del alcance del MVP, se evalúa por separado cuando llegue.
- **Categoría AFIP**: Responsable Inscripto. Sistema de facturación propio existente: SSL Soft Gescom (versión `20251104-7023201`). El MVP NO integra AFIP, conviven en paralelo. Camino post-MVP más probable: reemplazo total con AFIP nativo (no integración con Gescom).
- **Volumen estimado**: caja diaria promedio $280k, sábados buenos $800k, picos navideños hasta $1.5M.
- **Equipo**: 4 personas total (dueña + hijo + 2 empleadas) cubriendo Felipa 1 y Big Burger / Big Pizza. Todos hacen todo en mostrador, salvo remarcado de mercadería ingresante (solo dueña + hijo).
- **Catálogo**: ~200 productos estimados, sin contar variantes. No hay catálogo digital previo, hay que cargar desde cero. Carga manual con la UX de P5.2 (atajos + "guardar y cargar otro" + categoría inline + autocompletado de markup).
- **Hardware del local**: 1 PC con Windows 10 viejo. Lector de código de barras confirmado para compra antes del go-live. Impresora de tickets pendiente de decisión.
- **Internet en el local**: estable, no se corta. El sistema productivo es 100% dependiente de internet — trade-off conocido y aceptado.

### Modelo de datos (vigente)
- **Stock** modelado a nivel **variante** con `MovimientoStock.cantidad` como **delta signed**. `Stock.cantidad` es source of truth, cada ajuste = 1 INSERT en `MovimientoStock` + 1 UPDATE en `Stock` dentro de transacción Prisma.
- **Variantes** (color, tamaño, presentación): frecuentes. Soportadas desde el MVP. Precio y costo a nivel **producto** (`precioBase` / `costoBase`) con override opcional a nivel **variante** (`precio` / `costo` nullable que sobrescriben).
- **Métodos de pago**: efectivo, transferencia, débito, crédito. Pagos mixtos sí (modelados en `Venta.metodosPago` como JSON). Sin cuenta corriente.
- **Descuento estándar**: 10% por efectivo o transferencia (regla automática del sistema).
- **Markup sugerido**: 115% (al cargar costo, el sistema sugiere precio de venta). Totalmente editable, sin tope.
- **Modelo de Usuario**: tabla SQL `user` (lowercase, mapeada por `@@map`). Modelo Prisma `User`. Custom fields del dominio en español (`nombre`, `creadoEn`, `actualizadoEn`, `rol`, `activo`, `sucursalId`) — los nombres lógicos que pide Better Auth (`name`, `createdAt`, `updatedAt`) se mapean vía `user.fields` en `lib/auth/server.ts`. Campos `rol`, `activo`, `sucursalId` con `input: false` (no aceptados desde el cliente, solo desde server actions). Tablas auxiliares `Session`, `Account`, `Verification` también lowercase.
- **Modelo `Turno`** (vigente desde Sprint 6.0): `userId` (Admin o Vendedor, no solo Vendedor), `aperturaEn`, `cierreEn` (nullable, `IS NULL` = abierto), `efectivoInicialDeclarado`, `efectivoContadoCierre`, `efectivoEsperadoCierre`, `diferencia`, `observacionesCierre`. Snapshot al cerrar (no se recalcula). Partial unique index a nivel Postgres garantiza un solo turno abierto por user (`WHERE "cierreEn" IS NULL`). Relación 1-N con `Venta` vía `Venta.turnoId String?` (nullable hasta Sprint 6.1; a partir de 6.1, toda venta nueva tiene `turnoId` validado por server action).

### Roles y permisos
- **Roles del MVP**: **Admin** (Felipa + hijo) y **Vendedor** (empleadas). Definidos como enum `Rol` en el schema.
- **Admin**: ve todo, incluido costos y reportes. Único que puede cargar productos, ajustar precios, hacer ingresos de mercadería, gestionar usuarios.
- **Vendedor**: registra ventas, consulta stock (sin costo, sin acciones de ajuste), consulta productos (sin costo). Costo oculto a nivel HTML, no CSS.
- **Login**: username + password (no email). Cuentas se crean desde la pantalla de Gestión de Usuarios (`/usuarios`, Admin only). Hash gestionado por Better Auth (scrypt). Email sintético `<username>@felipa.local` se genera automáticamente.
- **Defensa en profundidad para self-lockout**: la UI desactiva controles peligrosos en la fila del usuario logueado (switch de activo, campo Rol del modal de edición). Las server actions tienen guards independientes (no se puede desactivar al último admin activo, no se puede auto-degradar el rol).

### Convenciones de código
- **Cliente Prisma**: importar de `@/lib/db` (no `@/lib/prisma`). Confirmado en Sprint 6.0.
- **Server actions**: reciben `rawInput: unknown`, parsean adentro con Zod, retornan `ActionResult<T>` (= `{ ok: true, ...data } | { ok: false, errores: string[] }`) usando el helper `fail()`. Convención compartida con `lib/productos/actions.ts`, `lib/usuarios/actions.ts`, `lib/turnos/actions.ts`.
- **Server actions que crean users**: usar `prisma.user.create` con nested `account.create` y `hashPassword` de `better-auth/crypto`. **NO usar `auth.api.signUpEmail` desde request context** — pisa la sesión del admin logueado. El seed (CLI, sin sesión activa) sí usa `signUpEmail`.
- **Reset de password admin**: `hashPassword` + `prisma.account.updateMany` con `providerId: 'credential'`. Después `prisma.session.deleteMany({ where: { userId } })` para invalidar sesiones activas.
- **Pathname desde RSC**: middleware Next.js setea `x-pathname` en headers, layouts y pages lo leen con `headers().get('x-pathname')`. Patrón estándar para guards condicionales en Server Components que dependen de la ruta actual.
- **Invariantes de unicidad concurrente**: cuando una regla sea "un solo X por entidad Z cumpliendo condición Y", usar partial unique index a nivel Postgres (no solo validación a nivel app — race condition). Generar la migración con `prisma migrate dev --create-only` y editar el SQL para agregar el `CREATE UNIQUE INDEX ... WHERE ...` antes de aplicar.
- **UX de inputs vacíos**: en cálculos derivados (diferencia = contado - esperado, etc.), si el input está vacío mostrar "—", no calcular contra 0. Calcular contra 0 da falsos negativos visuales tipo "-$5000 (faltó)" cuando el usuario aún no tipeó.
- **Naming**: dominio en español (campos, modelos de negocio), tablas que existen por requisitos de librerías externas pueden quedar en los nombres que la librería espera (caso Better Auth: `user`, `session`, `account`, `verification`).

### Repo y entornos
- **Repo**: GitHub privado `sistema-felipa`, rama base `main`.
- **Branch del último sprint**: `sprint-6-0/turnos-cierre-caja` mergeada a main con squash. Branch local borrada, branch remota preservada como traza.
- **Convención de branches**: una branch por sprint (`sprint-<n>/<descripcion>`), squash merge a `main` al cerrar.
- **DB de desarrollo**: contenedor Docker `felipa-db` en puerto 5433, credenciales en `.env` local (no commiteado).
- **Sin fecha objetivo de go-live**.
- Propuesta comercial aprobada disponible como referencia (PDF de abril 2026).

## Decisiones pendientes

- **Deuda técnica del Sprint 3.2 prompt 2**: el login form discrimina el error de "cuenta desactivada" matcheando el literal "deshabilitada" en `error.message`. Es frágil — si se cambia el wording o se internacionaliza, se rompe. Migrar a un código de error custom cuando haya tiempo (5 minutos). El mensaje vive en la constante `ACCOUNT_DISABLED_MESSAGE` exportada desde `lib/auth/server.ts`.
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
