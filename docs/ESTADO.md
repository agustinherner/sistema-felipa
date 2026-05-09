# ESTADO — Sistema Felipa

Bitácora viva del proyecto. Se actualiza después de cada sesión de trabajo.
**Este es el primer archivo que se le pega a Claude al arrancar un chat nuevo.**

---

## Sprint actual

**Sprint 6.1 cerrado (2026-05-09)** — squash commit `27641de` en `main`.

Próximo sprint a planear: **Sprint 6.2 — Historial de ventas** (pantalla `/ventas` con detalle clickeable y filtros). No hay sprint en curso.

## Tarea en curso

Ninguna. Próximo paso: arrancar Sprint 6.2 en un chat nuevo.

## Último avance

**Sprint 6.1 — Nueva venta + Stock para Vendedor completado (2026-05-09)** — squash commit `27641de` en `main`. Branch local `sprint-6-1/nueva-venta` pusheada a origin (commits granulares preservados para historial fino: `a4d9a83` Prompts 2a+2b, `257f3a5` rename, `b6a092d` refactor /stock). 25 archivos modificados, +2115 / -88.

Funcionalidad entregada:

**Pantalla `/ventas/nueva`** — venta funcional end-to-end:
- Búsqueda dual con `BusquedaInput`: modo Enter (scanner USB → match único auto-agrega + clear; 0 resultados → mensaje + clear; múltiples → dropdown) y modo tipeo (debounce 350ms, mínimo 2 chars). Token `reqIdRef` descarta respuestas fuera de orden cuando el cajero tipea rápido. Navegación con teclado (Arrow/Enter/Escape) + click-outside.
- Carrito editable con `CarritoTable`: cantidades editables inline, eliminar por fila, columna "Stock tras venta" en rojo si negativo (warning visual, no hard-block), footer con subtotal en `tabular-nums`.
- Panel de cobro `MetodosPagoPanel` (sticky desktop): hasta 4 métodos, selects con opciones ya-usadas marcadas como `disabled`, badge "Descuento 10% ✓" verde si aplica todo-o-nada, banners "Faltan: $X" (ámbar) y "Vuelto: $X" (azul). Listener F2 para disparar cobro si `cobroValido && !cobrando`.
- Modal de cobro `ModalCobro`: warnings de stock negativo si los hay, resumen de items, chips por método, `preventDefault` en pointer-down-outside y escape mientras `cobrando` (no se cierra accidentalmente durante el request).
- Página `/ventas/exito` (sin guard de turno): ícono ✓, codigoCorto en `font-mono text-3xl`, botón "Nueva venta" (vuelve con foco automático en BusquedaInput), botón "Ver historial" apuntando a `/ventas` (ruta del Sprint 6.2, todavía 404).

**Backend de ventas** (`lib/ventas/`):
- `crearVenta` + `crearVentaCore`: parse Zod (refines de no-repetidos en métodos e items), cálculo Decimal server-side de subtotal/descuento/total, validación de suma de pagos = total con tolerancia 0.01, transacción Prisma con INSERT venta + ItemVenta + MovimientoStock + UPDATE Stock con `decrement`, retry envolvente de hasta 3 intentos para colisión `P2002` en codigoCorto. ActionResult retorna `{ ventaId, codigoCorto }`.
- `buscarProducto`: server action con auth + Zod (1-100 chars) + límite 8 resultados. Tipo `ResultadoBusqueda` exportado con `precioEfectivo: number` para cruzar el boundary cliente-servidor.
- `lib/ventas/codigoCorto.ts` (renombrado desde `idCorto.ts` en este sprint): `generarCodigoCortoVenta(sucursalId, fecha, tx)`. Hardcodeado `PREFIJO_SUCURSAL_DEFAULT = 'F1'` con TODO para cuando llegue Felipa 2 con `Sucursal.codigo`.
- Smoke `scripts/smoke-venta.ts` con fixture aislado y teardown: 16/16 aserciones OK (efectivo, mixto, sin turno, suma ≠ total, método repetido, dos ventas mismo día con correlativos consecutivos).

**Refactor `/stock` para Vendedor**:
- `lib/stock/permissions.ts` (nuevo): `permisosStock(role)` retorna `{ verCosto, ajustar, verHistorialCompleto, ingresarMercaderia }`. Admin todo `true`, Vendedor todo `false`.
- `/stock/page.tsx`: guard ahora `requireAuth(['ADMIN', 'VENDEDOR'])`, deriva permissions del rol, las pasa al `StockTable`. Botones top "Ver historial" e "Ingreso de mercadería" con renderizado condicional (`{permissions.x && <...>}`, no CSS).
- `StockTable` extendido con prop `permissions`. Botón "Ajustar" condicionado, `AjusteModal` con doble guard (kind + permissions).
- `HistorialModal` (modal de historial por variante): footer "ir a Movimientos" condicional según `verHistorialCompleto`. Datos del modal sin cambios (no exponen costos, safe para Vendedor).
- `/stock/movimientos/page.tsx` y `/stock/ingreso/page.tsx`: ya tenían `requireAuth(['ADMIN'])` desde Sprint 5. Sin cambios.
- `lib/stock/actions.ts`: las mutaciones (`registrarAjuste`, `registrarIngresoBulk`, `buscarVariantesIngresoAction`) ya tenían `requireAuth(['ADMIN'])`. Solo `obtenerHistorialVariante` se loosenó a `['ADMIN', 'VENDEDOR']` con comentario explicativo (data segura, sin costos) para que el modal funcione para Vendedor.
- `lib/nav.ts`: `/stock` ahora visible para `['admin', 'vendedor']`. Href de "Nueva venta" corregido de `/nueva-venta` a `/ventas/nueva`.
- Eliminado `app/(app)/nueva-venta/page.tsx` (placeholder huérfano post-Prompt 2a).

**Cambios fuera de scope original que valieron la pena**:
- `lib/turnos/guards.ts` — `requireTurnoAbierto` ahora hace `redirect('/turno/abrir')` (o `/login` si no hay sesión) en vez de tirar `throw new Error`. Alinea con el contrato documentado del Sprint 6.0; sin esto el guard no funcionaba desde Server Component.
- Rename `idCorto` → `codigoCorto` en el ActionResult de `crearVenta` y todos sus consumers. Alinea con el naming de la columna DB y del smoke. Archivo físico también renombrado para que el grep quede limpio.

**Decisiones técnicas registradas en este sprint** (ya volcadas a `DECISIONES.md` o pendientes de volcar):
- Naming del schema en español como convención del proyecto (`usuarioId`, `creadaEn`, `descuentoTotal`, `codigoCorto`). Tablas auxiliares de Better Auth (`user`, `session`, `account`, `verification`) son la excepción documentada.
- `aplicaDescuento` se snapshotea en la venta junto con `subtotal`, `descuentoTotal`, `total`. Nunca se recalcula.
- Descuento 10% **todo-o-nada**: aplica solo si TODOS los métodos son `EFECTIVO` o `TRANSFERENCIA`. Implementado server-side, no confiable en cliente. El cliente calcula como preview con `Math.round(x * 0.1 * 100) / 100` para evitar drift.
- Suma de métodos de pago = total (tolerancia 0.01). Server-side el cálculo es Decimal exacto.
- Métodos de pago no repetidos. Si el cajero quiere "efectivo + efectivo de otra caja", suma antes de enviar.
- Stock negativo permitido al vender. Sin hard-block server. Warning visual en el carrito + advertencia explícita en el modal de cobro.
- Concurrencia: `prisma.stock.update({ data: { cantidad: { decrement: x } } })` atómico a nivel DB, NO `SELECT FOR UPDATE`.
- Código corto con retry sobre `P2002` (max 3 intentos). Gaps en el correlativo aceptables.
- Atajo F2 para cobrar sin guard de `activeElement`. Trade-off explícito: el cajero puede tipear monto y disparar cobro directamente.
- Carrito resiliente a errores: si `crearVenta` retorna `{ ok: false }`, modal se cierra pero ítems y métodos de pago se preservan para corregir.
- Permisos por rol como objeto pasado por prop, derivado en el page Server Component. Renderizado condicional a nivel HTML, nunca CSS — un Vendedor inspeccionando devtools no encuentra datos sensibles en el DOM. Defensa en profundidad: la UI esconde, las server actions validan rol independientemente.
- `obtenerHistorialVariante` abierto a Vendedor con justificación (sin costos). Decisión menor pero registrar en `DECISIONES.md` para no parecer un descuido a futuro.

**Lección operativa confirmada**: a diferencia del Sprint 6.0, este sprint cerró bien con squash + push + hash anotado. El flujo es:
1. Ejecutar último prompt → todos los commits granulares en la branch.
2. `git push -u origin <branch>` (preserva traza granular para bisect futuro).
3. `git checkout main && git pull && git merge --squash <branch>`.
4. `git commit -m "feat(...)" && git push`.
5. Anotar el hash real en ESTADO.md.
6. Recién ahí cerrar el sprint en la conversación.

---

## Historial de sprints anteriores

**Sprint 6.0 completado (2026-05-09)** — commit `f3b6eab` en `main` (mergeado vía fast-forward al recuperar trabajo no commiteado de la branch original).

Modelo `Turno` + ciclo de apertura/cierre de caja:
- Schema: `Turno` con `userId`, `aperturaEn`, `cierreEn` (nullable, IS NULL = abierto), `efectivoInicialDeclarado`, `efectivoContadoCierre`, `efectivoEsperadoCierre`, `diferencia`, `observacionesCierre`. Relación 1-N con `Venta` (`Venta.turnoId String?`). Partial unique index `turno_user_abierto_unique` con `WHERE "cierreEn" IS NULL` para garantizar un solo turno abierto por user a nivel Postgres.
- Server actions, queries, guards: `lib/turnos/`. `getTurnoAbierto`, `getTurnoOlvidado` (umbral 12hs), `calcularEfectivoVendidoEnTurno`, `abrirTurno` (defensa app+DB), `cerrarTurno` (snapshot), `requireTurnoAbierto`.
- Pantallas + guard global: middleware exponiendo `x-pathname`, layout que redirige a `/turno/cerrar` si hay turno olvidado, pantallas `/turno/abrir` y `/turno/cerrar` con resumen, breakdown por método de pago, diferencia live, alert + datetime-local para olvidados.
- Modelo Turno aplica a Admin y Vendedor (`userId`, no `vendedorId`).
- Snapshot al cerrar (`efectivoEsperadoCierre`, `diferencia`) — no se recalcula.

**Sprint 3 parte 2 completado (2026-05-08)** — squash commit `5ce5414` en `main`. 46 archivos, +2371 / -294. Better Auth funcional, gestión de usuarios, schema rename `Usuario → User`, hashPassword directo para create/reset desde server actions.

**Sprint 5 (P6 Stock) completado (2026-04-28)**:
- **P6.1** vista de stock + ajustes individuales (rotura, robo, conteo, devolución), modal de historial por variante. Stock negativo permitido con confirm. `MovimientoStock.cantidad` modelado como **delta signed**.
- **P6.2** ingreso de mercadería bulk con buscador unificado, una sola transacción atómica, validaciones de variante activa.
- **P6.3** historial completo de movimientos en `/stock/movimientos` con filtros vía URL (fecha, tipo, variante, usuario, motivo), running total con window function, paginación 50 filas.

**Sprint 4 (P5 Productos) completado (2026-04-27)** — listado, alta, edición con variantes y override de precio/costo, soft delete, modal de categoría inline, markup automático 115%.

**Sprint 3 parte 1 completada (2026-04-27)** — schema, migración inicial, seed.

**Sprint 2 completado (2026-04-27)** — scaffold con mock auth.

**Sprint 1 — parcialmente avanzado**: cuestionario respondido + segunda ronda. **Pendiente**: tarde de observación in-situ en Felipa 1.

## Próxima tarea

**Sprint 6.2 — Historial de ventas con detalle clickeable y filtros**. Pantalla `/ventas` listando ventas del día/período, con filtros por fecha/usuario/método de pago, click en una fila abre detalle (items, métodos, totales, datos del turno). Al cerrar este sprint el botón "Ver historial" de `/ventas/exito` deja de ser un 404.

Después vienen 6.3 (Dashboard del vendedor: turno actual + turnos del mes), 6.4 (refactor `/productos` para Vendedor con permissions, análogo al refactor de stock), y el deploy del demo a Vercel + Neon. Ver `ROADMAP.md`.

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
- **Vendedor**: registra ventas, consulta stock (sin costo, sin acciones de ajuste, sin acceso a `/stock/movimientos` ni `/stock/ingreso`), consulta productos (sin costo, refactor pendiente Sprint 6.4). Costo oculto a nivel HTML, no CSS.
- **Login**: username + password (no email). Cuentas se crean desde la pantalla de Gestión de Usuarios (`/usuarios`, Admin only). Hash gestionado por Better Auth (scrypt). Email sintético `<username>@felipa.local` se genera automáticamente.
- **Defensa en profundidad para self-lockout**: la UI desactiva controles peligrosos en la fila del usuario logueado (switch de activo, campo Rol del modal de edición). Las server actions tienen guards independientes (no se puede desactivar al último admin activo, no se puede auto-degradar el rol).
- **Patrón de permisos por dominio** (vigente desde Sprint 6.1): `lib/<dominio>/permissions.ts` exporta `permisosX(rol)` que retorna un objeto tipado con flags booleanas por capacidad. El page Server Component deriva las permissions del rol del usuario, las pasa por prop a los componentes que renderizan UI condicional. Renderizado a nivel HTML (`{permissions.x && <Component />}`), nunca CSS. Las server actions del dominio validan rol independientemente — la UI esconde, el servidor rechaza.

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
- **Permisos por rol como prop**: el page Server Component deriva un objeto `permissions` desde el rol del usuario y lo pasa a los componentes que renderizan UI condicional. Implementación de referencia: `permisosStock` en `lib/stock/permissions.ts`. Renderizado condicional a nivel HTML, NUNCA CSS — un usuario inspeccionando devtools no debe ver datos sensibles en el DOM.

### Repo y entornos
- **Repo**: GitHub privado `sistema-felipa`, rama base `main`.
- **Branch del último sprint cerrado**: `sprint-6-1/nueva-venta` (squash commit `27641de` en main, branch local pusheada a origin para preservar historial granular: `a4d9a83` Prompts 2a+2b, `257f3a5` rename, `b6a092d` refactor /stock).
- **Branch en curso**: ninguna.
- **Convención de branches**: una branch por sprint (`sprint-<n>/<descripcion>`), squash merge a `main` al cerrar. Push de la branch a origin antes del squash para preservar la traza granular si alguien necesita bisect.
- **DB de desarrollo**: contenedor Docker `felipa-db` en puerto 5433, credenciales en `.env` local (no commiteado).
- **Sin fecha objetivo de go-live**.
- Propuesta comercial aprobada disponible como referencia (PDF de abril 2026).

## Decisiones pendientes

- **Inconsistencia de naming de roles**: el sistema tiene tres formas conviviendo — `'ADMIN'` uppercase string en `requireAuth(['ADMIN'])`, `Role.admin` lowercase en el `SessionUser` y `permisosStock(role)`, y `roles: ['admin', 'vendedor']` lowercase en `lib/nav.ts`. Cualquier comparación cruzada va a romperse silenciosamente. Es deuda preexistente que el Sprint 6.1 expuso al refactorear `/stock`. Vale unificar (probablemente al naming del enum `Rol` de Prisma) en algún momento — es un cambio mecánico pero requiere tocar muchos archivos. Candidato a un sprint dedicado de housekeeping antes del demo.
- **`StockPermissions.verCosto` no consumido aún**: la pantalla actual `/stock` no tiene columna Costo, así que la flag está definida pero no se usa. Queda como anticipación útil para el Sprint 6.4 (refactor `/productos` para Vendedor) o cualquier pantalla futura con datos de costo.
- **`obtenerHistorialVariante` ahora abierto a Vendedor**: cambio de contrato del Sprint 5 tomado en el Sprint 6.1. Justificación: la query no expone costos, solo movimientos. Decisión menor pero conviene volcarla a `DECISIONES.md` para que dentro de 3 meses no parezca un descuido.
- **Botón "Ver historial" en `/ventas/exito` apunta a `/ventas` (404 hasta Sprint 6.2)**: aceptado como deuda temporal porque el siguiente sprint es justo el que crea esa pantalla. Si el Sprint 6.2 se demora, evaluar deshabilitar el botón con tooltip "próximamente".
- **Deuda técnica del Sprint 3.2 prompt 2**: el login form discrimina el error de "cuenta desactivada" matcheando el literal "deshabilitada" en `error.message`. Es frágil — si se cambia el wording o se internacionaliza, se rompe. Migrar a un código de error custom cuando haya tiempo (5 minutos). El mensaje vive en la constante `ACCOUNT_DISABLED_MESSAGE` exportada desde `lib/auth/server.ts`.
- **Repo en OneDrive**: el file watcher de OneDrive interfiere con git en Windows (genera mensajes "Deletion of directory ... failed. Should I try again?" en operaciones de checkout/merge). No rompe nada pero ensucia el output. Se manifestó otra vez en el cierre del Sprint 6.1. Considerar mover el repo fuera de la carpeta de OneDrive a algo tipo `C:\dev\sistema-felipa` cuando convenga.
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
