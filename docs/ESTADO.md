# ESTADO — Sistema Felipa

Bitácora viva del proyecto. Se actualiza después de cada sesión de trabajo.
**Este es el primer archivo que se le pega a Claude al arrancar un chat nuevo.**

---

## Sprint actual

**Sprint 6.1 — Nueva venta + Stock para vendedor** en curso. Branch `sprint-6-1/nueva-venta`. **Prompt 1 (backend) completado**, Prompt 2 (pantalla `/ventas/nueva`) pendiente, Prompt 3 (refactor `/stock` para Vendedor) pendiente.

## Tarea en curso

**Prompt 2 del Sprint 6.1 — pantalla `/ventas/nueva`**. El backend ya está construido y testeado, falta la UI: búsqueda por código de barras o nombre, carrito editable, métodos de pago con descuento live, modal de cobro, redirect post-venta.

## Último avance

**Sprint 6.1 — Prompt 1 (backend) completado (2026-05-09)** — commit `2ccd733` en branch `sprint-6-1/nueva-venta`.

Backend de la nueva venta:

- **Schema**: agregado `aplicaDescuento Boolean @default(false)` a `Venta`. El resto de los campos requeridos por el sprint ya existían desde Sprint 3.1 con otro naming (ver "Diferencias de naming" más abajo). Migración `20260509031524_add_venta_id_corto_y_totales` aplicada en local.
- **`lib/ventas/idCorto.ts`** — helper `generarCodigoCortoVenta(sucursalId, fecha, tx)`. Recibe el cliente de transacción, hace `count` + return formateado en la misma tx. Formato `{CODIGO}-{DDMM}-{NNN}`.
- **`lib/ventas/queries.ts`** — `buscarProductoOVariante(termino, sucursalId, limit)` con búsqueda dual: match exacto por `Variante.codigoBarras`, fallback a `ILIKE` por nombre del producto. Filtra `activa = true` y producto no soft-deleted.
- **`lib/ventas/core.ts`** — `crearVentaCore` con la lógica completa: parse Zod (refines de no-repetidos en métodos e items), cálculo Decimal server-side de subtotal/descuento/total, validación de suma de pagos = total con tolerancia 0.01, transacción Prisma con INSERT venta + ItemVenta + MovimientoStock + UPDATE Stock con `decrement`, retry envolvente de hasta 3 intentos para colisión `P2002` en codigoCorto.
- **`lib/ventas/actions.ts`** — `crearVenta` server action (wrapper fino: auth + `getTurnoAbierto` + delega a `crearVentaCore`).
- **`lib/ventas/types.ts`** — `ActionResult`, `fail`, `CrearVentaContexto`.
- **`lib/turnos/queries.ts`** — `calcularEfectivoVendidoEnTurno` ahora case-insensitive (compatibilidad con `'efectivo'` lowercase del seed legado y `'EFECTIVO'` uppercase del nuevo contrato).
- **`scripts/smoke-venta.ts`** — smoke con fixture aislado y teardown. **16/16 aserciones OK**:
  - Caso 1 (efectivo, 2 ítems): `codigoCorto=F1-0905-001`, `aplicaDescuento=true`, descuento 10%, stock decrementado, 2 movimientos VENTA con cantidad negativa.
  - Caso 2 (efectivo+débito): `aplicaDescuento=false`, `total=subtotal`.
  - Caso 3 (sin turno): wrapper falla.
  - Caso 4 (suma ≠ total): fail con mensaje claro.
  - Caso 5 (EFECTIVO repetido): fail Zod.
  - Caso 6 (dos ventas mismo día): correlativos consecutivos.

**Diferencias de naming detectadas en el schema** (real vs lo asumido en el prompt):
- `Venta.codigoCorto` (no `idCorto`) — ya existía como `@unique`, no hubo que crearlo.
- `Venta.descuentoTotal` (no `descuento`) — ya existía con `@default(0)`.
- `Venta.usuarioId` (no `userId`) — convención del schema, español.
- Modelo de líneas se llama `ItemVenta` (no `VentaItem`).
- `MovimientoStock.usuarioId` (no `userId`) y `MovimientoStock.sucursalId` requerido.
- `Sucursal` NO tiene campo `codigo`, solo `nombre`, `direccion`, `activa`.

**Decisiones técnicas tomadas en el Prompt 1**:
- Naming del schema en español es la convención del proyecto (`usuarioId`, `creadaEn`, `descuentoTotal`). Tablas que existen por requisitos de Better Auth (`user`, `session`, `account`, `verification`) son la excepción documentada.
- `aplicaDescuento` se snapshotea en la venta junto con `subtotal`, `descuentoTotal`, `total`. No se recalcula nunca.
- Descuento del 10%: **todo-o-nada**. Aplica solo si TODOS los métodos de pago son `EFECTIVO` o `TRANSFERENCIA` (sin un peso en débito o crédito). Implementado server-side, no confiable en cliente.
- Suma de métodos de pago = total con descuento aplicado. Validación con tolerancia 0.01 para float drift.
- Métodos de pago no repetidos. Si el cajero quiere meter "efectivo + efectivo de otra caja", tiene que sumar antes de enviar.
- Stock negativo permitido al vender (sin hard-block server). El warning lo maneja la pantalla en Prompt 2.
- Concurrencia: `prisma.stock.update({ data: { cantidad: { decrement: x } } })` atómico a nivel DB. NO se usa `SELECT FOR UPDATE`.
- ID corto con retry sobre `P2002` (max 3 intentos). Gaps en el correlativo aceptables (no hay requisito legal).

**Convenciones del repo confirmadas en este sprint**:
- `lib/<dominio>/` es server-side por convención de proyecto, no por enforcement con `import 'server-only'`. La protección formal queda en el `'use server'` de los archivos `actions.ts`. Decisión de pragmatismo (smoke vía `tsx` se desbloquea, alineado con `lib/turnos/queries.ts` que tampoco usa `server-only`).
- Cuando un archivo `'use server'` necesita exponer lógica testeable a un script CLI, el patrón es: extraer el core a `lib/<dominio>/core.ts` y dejar `actions.ts` como wrapper fino. Permite que el smoke importe `core` sin chocar con la restricción de Next ("solo async functions exportables").

---

**Sprint 6.0 completado (2026-05-09)** — commit `f3b6eab` en `main`.

Tres prompts a Code, ejecutados en branch dedicada `sprint-6-0/turnos-cierre-caja`. **Mergeado a main vía fast-forward** (no squash, ver "Recuperación del Sprint 6.0" más abajo). Branch local original quedó incompleta (working tree sin commitear) y se descartó al recuperar el trabajo en Sprint 6.1. La traza fina por prompt no quedó preservada.

Lección operativa registrada: **el commit, push y merge a main son parte del cierre del sprint**, no un paso opcional posterior. La próxima vez que cerremos un sprint:
1. Ejecutar último prompt → todos los commits granulares en la branch.
2. Squash merge a main + push de main.
3. Anotar el hash real en ESTADO.md (no `<COMPLETAR-HASH>`).
4. Recién ahí cerrar el sprint en la conversación.

**Recuperación del Sprint 6.0 (2026-05-09)**: al iniciar Sprint 6.1, Code detectó trabajo del Sprint 6.0 sin commitear en el working tree (la branch `sprint-6-0/turnos-cierre-caja` estaba pelada apuntando a `5ce5414`). Code lo commiteó como commit aislado `f3b6eab` antes de empezar Sprint 6.1. Después se hizo `git merge --ff-only f3b6eab` desde main para incorporar Sprint 6.0 oficialmente.

Funcionalidad del Sprint 6.0:

- **Schema + migración**: modelo `Turno` con `userId`, `aperturaEn`, `cierreEn`, `efectivoInicialDeclarado`, `efectivoContadoCierre`, `efectivoEsperadoCierre`, `diferencia`, `observacionesCierre`. Relación 1-N con `Venta` (`Venta.turnoId String?` nullable hasta Sprint 6.1). Partial unique index `turno_user_abierto_unique` con `WHERE "cierreEn" IS NULL` para garantizar un solo turno abierto por user a nivel Postgres.
- **Server actions + queries + guards**: `lib/turnos/queries.ts` (`getTurnoAbierto`, `getTurnoOlvidado` con umbral 12hs, `calcularEfectivoVendidoEnTurno`), `lib/turnos/actions.ts` (`abrirTurno` con defensa app+DB, `cerrarTurno` con snapshot), `lib/turnos/guards.ts` (`requireTurnoAbierto`).
- **Pantallas + guard global**: `middleware.ts` exponiendo `x-pathname`, guard en `(app)/layout.tsx` que redirige a `/turno/cerrar` si hay turno olvidado, pantallas `/turno/abrir` y `/turno/cerrar` con resumen, breakdown por método de pago, diferencia live, alert + datetime-local para turnos olvidados.

**Decisiones técnicas registradas en `DECISIONES.md`**:
- Modelo Turno aplica a Admin y Vendedor (`userId`, no `vendedorId`).
- "Turno olvidado" = >12 horas abierto, guard estricto vía middleware + layout.
- Snapshot al cerrar (`efectivoEsperadoCierre`, `diferencia`) — no se recalcula.
- Concurrencia con partial unique index a nivel Postgres. Convención: usar partial unique indexes para invariantes "un solo X por Z cumpliendo condición Y".

DB en main: admin `felipa`, vendedor `andrea`, admin `hijo`. Tabla `turno` vacía (smokes limpiados).

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

**Sprint 6.1 — Prompt 2: pantalla `/ventas/nueva`**.

Layout, input de búsqueda con dual-mode (código de barras → match exacto, sino búsqueda por nombre), carrito editable con cantidades, panel de métodos de pago con descuento live (todo-o-nada), modal de confirmación de cobro, validación de stock pre-cobro con confirm si quedaría negativo. Guard `requireTurnoAbierto`. Redirect post-venta a una vista de confirmación con `codigoCorto` visible y opción "Nueva venta".

Después viene **Prompt 3 — refactor de `/stock` para Vendedor**: componente `StockTable` único con prop `permissions: { verCosto, ajustar, verHistorialCompleto, ingresarMercaderia }`, derivación rol→permissions en el page Server Component, ocultar columnas y acciones a nivel HTML (no CSS), bloqueo server-side de `/stock/movimientos` y `/stock/ingreso` para Vendedor.

Después de cerrar Sprint 6.1 vienen 6.2 (Historial de ventas con detalle clickeable y filtros), 6.3 (Dashboard del vendedor mostrando turno actual + turnos del mes) y el deploy del demo a Vercel + Neon. Ver `ROADMAP.md`.

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
- **Métodos de pago**: efectivo, transferencia, débito, crédito. Pagos mixtos sí (modelados en `Venta.metodosPago` como JSON con shape `[{ metodo: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEBITO' | 'CREDITO', monto: number }]`). Sin cuenta corriente. **No se permiten métodos repetidos** (validación Zod en server action).
- **Descuento estándar**: 10% por efectivo o transferencia (regla automática del sistema). **Todo-o-nada**: aplica solo si TODOS los métodos son `EFECTIVO` o `TRANSFERENCIA`. Si hay un solo peso en débito o crédito, no hay descuento. Snapshot en `Venta.aplicaDescuento` y `Venta.descuentoTotal` al crear la venta — no se recalcula.
- **Markup sugerido**: 115% (al cargar costo, el sistema sugiere precio de venta). Totalmente editable, sin tope.
- **Modelo de Usuario**: tabla SQL `user` (lowercase, mapeada por `@@map`). Modelo Prisma `User`. Custom fields del dominio en español (`nombre`, `creadoEn`, `actualizadoEn`, `rol`, `activo`, `sucursalId`) — los nombres lógicos que pide Better Auth (`name`, `createdAt`, `updatedAt`) se mapean vía `user.fields` en `lib/auth/server.ts`. Campos `rol`, `activo`, `sucursalId` con `input: false` (no aceptados desde el cliente, solo desde server actions). Tablas auxiliares `Session`, `Account`, `Verification` también lowercase.
- **Modelo `Turno`** (vigente desde Sprint 6.0): `userId` (Admin o Vendedor), `aperturaEn`, `cierreEn` (nullable, `IS NULL` = abierto), `efectivoInicialDeclarado`, `efectivoContadoCierre`, `efectivoEsperadoCierre`, `diferencia`, `observacionesCierre`. Snapshot al cerrar. Partial unique index a nivel Postgres garantiza un solo turno abierto por user (`WHERE "cierreEn" IS NULL`). Relación 1-N con `Venta` vía `Venta.turnoId String?` (nullable hasta Sprint 6.1; a partir de Prompt 2 de 6.1 toda venta nueva tiene `turnoId` validado por server action).
- **Modelo `Venta`** (campos relevantes confirmados en Sprint 6.1): `codigoCorto String @unique` (formato `F1-DDMM-NNN`, gaps aceptables), `subtotal Decimal`, `descuentoTotal Decimal @default(0)`, `total Decimal`, `aplicaDescuento Boolean @default(false)`, `metodosPago Json`, `usuarioId`, `sucursalId` (NOT NULL), `turnoId String?`, `creadaEn`. Modelo de líneas: `ItemVenta` con `ventaId`, `varianteId`, `cantidad`, `precioUnitario`, `subtotal`.

### Roles y permisos
- **Roles del MVP**: **Admin** (Felipa + hijo) y **Vendedor** (empleadas). Definidos como enum `Rol` en el schema.
- **Admin**: ve todo, incluido costos y reportes. Único que puede cargar productos, ajustar precios, hacer ingresos de mercadería, gestionar usuarios.
- **Vendedor**: registra ventas, consulta stock (sin costo, sin acciones de ajuste), consulta productos (sin costo). Costo oculto a nivel HTML, no CSS.
- **Login**: username + password (no email). Cuentas se crean desde la pantalla de Gestión de Usuarios (`/usuarios`, Admin only). Hash gestionado por Better Auth (scrypt). Email sintético `<username>@felipa.local` se genera automáticamente.
- **Defensa en profundidad para self-lockout**: la UI desactiva controles peligrosos en la fila del usuario logueado (switch de activo, campo Rol del modal de edición). Las server actions tienen guards independientes (no se puede desactivar al último admin activo, no se puede auto-degradar el rol).

### Convenciones de código
- **Naming del schema en español**. Campos como `usuarioId`, `creadaEn`, `descuentoTotal`, `codigoCorto`. Modelos del dominio: `Venta`, `ItemVenta`, `MovimientoStock`, `Turno`. Excepción documentada: tablas que existen por requisitos de Better Auth (`user`, `session`, `account`, `verification`) usan los nombres que la librería espera.
- **Cliente Prisma**: importar de `@/lib/db` (no `@/lib/prisma`). Confirmado en Sprint 6.0.
- **Server actions**: reciben `rawInput: unknown`, parsean adentro con Zod, retornan `ActionResult<T>` (= `{ ok: true, ...data } | { ok: false, errores: string[] }`) usando el helper `fail()`. Convención compartida con `lib/productos/actions.ts`, `lib/usuarios/actions.ts`, `lib/turnos/actions.ts`, `lib/ventas/actions.ts`.
- **Server actions + script CLI testeable**: cuando un `'use server'` necesita exponer lógica a un smoke vía `tsx`, separar en `core.ts` (lógica pura, importable) y `actions.ts` (wrapper con `'use server'`, auth, redirects). Patrón confirmado en `lib/ventas/`.
- **Server actions que crean users**: usar `prisma.user.create` con nested `account.create` y `hashPassword` de `better-auth/crypto`. **NO usar `auth.api.signUpEmail` desde request context** — pisa la sesión del admin logueado. El seed (CLI, sin sesión activa) sí usa `signUpEmail`.
- **Reset de password admin**: `hashPassword` + `prisma.account.updateMany` con `providerId: 'credential'`. Después `prisma.session.deleteMany({ where: { userId } })` para invalidar sesiones activas.
- **Pathname desde RSC**: middleware Next.js setea `x-pathname` en headers, layouts y pages lo leen con `headers().get('x-pathname')`. Patrón estándar para guards condicionales en Server Components que dependen de la ruta actual.
- **Invariantes de unicidad concurrente**: cuando una regla sea "un solo X por entidad Z cumpliendo condición Y", usar partial unique index a nivel Postgres (no solo validación a nivel app — race condition). Generar la migración con `prisma migrate dev --create-only` y editar el SQL para agregar el `CREATE UNIQUE INDEX ... WHERE ...` antes de aplicar.
- **Concurrencia en updates de contadores** (stock, etc.): usar `prisma.<model>.update({ data: { campo: { decrement/increment: x } } })`, que compila a UPDATE atómico con row-lock implícito de Postgres. NO leer-validar-escribir a nivel app, NO usar `SELECT FOR UPDATE` salvo necesidad explícita.
- **UX de inputs vacíos**: en cálculos derivados (diferencia = contado - esperado, etc.), si el input está vacío mostrar "—", no calcular contra 0. Calcular contra 0 da falsos negativos visuales tipo "-$5000 (faltó)" cuando el usuario aún no tipeó.
- **Server-only a nivel convención, no enforcement**: `lib/<dominio>/` es server-side por convención del proyecto. La protección formal queda en el `'use server'` de los archivos `actions.ts`. No usamos `import 'server-only'` (rompe smokes vía `tsx`).
- **Tipo Decimal para plata**: usar `Prisma.Decimal` consistentemente en cálculos. No mezclar con `Number` para evitar drift de coma flotante.
- **Validación de suma de pagos = total**: tolerancia 0.01 por float drift en el lado del cliente. Server-side el cálculo es Decimal exacto.

### Repo y entornos
- **Repo**: GitHub privado `sistema-felipa`, rama base `main`.
- **Branch del último sprint cerrado**: ninguna actualmente — Sprint 6.0 mergeado vía fast-forward al recuperar el trabajo. Próximo cierre con squash será Sprint 6.1 cuando termine.
- **Branch en curso**: `sprint-6-1/nueva-venta` (commit `2ccd733` con Prompt 1 de Sprint 6.1).
- **Convención de branches**: una branch por sprint (`sprint-<n>/<descripcion>`), squash merge a `main` al cerrar.
- **DB de desarrollo**: contenedor Docker `felipa-db` en puerto 5433, credenciales en `.env` local (no commiteado).
- **Sin fecha objetivo de go-live**.
- Propuesta comercial aprobada disponible como referencia (PDF de abril 2026).

## Decisiones pendientes

- **Deuda técnica de `lib/ventas/idCorto.ts`**: la función `prefijoDesdeNombre` deriva el prefijo del codigoCorto desde el nombre de la sucursal vía regex (busca un número al final del string). Es frágil: si el nombre de Felipa 2 no termina en `2`, las ventas de Felipa 2 van a salir con prefijo `F1` igual que las de Felipa 1, generando colisiones que el retry no puede resolver (regenera el mismo prefijo siempre). **Fix sugerido**: hardcodear `CODIGO_SUCURSAL_DEFAULT = 'F1'` directo, sin heurística, hasta que se agregue `Sucursal.codigo` para multisucursal en el sprint dedicado a Felipa 2. Cambio menor (un commit), bajo riesgo, alto retorno de claridad.
- **Deuda técnica del Sprint 3.2 prompt 2**: el login form discrimina el error de "cuenta desactivada" matcheando el literal "deshabilitada" en `error.message`. Es frágil — si se cambia el wording o se internacionaliza, se rompe. Migrar a un código de error custom cuando haya tiempo (5 minutos). El mensaje vive en la constante `ACCOUNT_DISABLED_MESSAGE` exportada desde `lib/auth/server.ts`.
- **Repo en OneDrive**: el file watcher de OneDrive interfiere con git en Windows (genera mensajes "Deletion of directory ... failed. Should I try again?" en operaciones de checkout/merge). No rompe nada pero ensucia el output. Considerar mover el repo fuera de la carpeta de OneDrive a algo tipo `C:\dev\sistema-felipa` cuando convenga.
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
