# DECISIONES — Sistema Felipa

Registro liviano de decisiones técnicas importantes. Una línea por decisión cuando alcanza, más contexto cuando hace falta.

**Formato**: fecha · decisión · por qué · alternativas descartadas

---

## 2026-04-23 · Stack principal: Next.js 14 + TypeScript + Postgres + Prisma + Tailwind

**Por qué**: TypeScript end-to-end, un solo repo para front y back, excelente tooling con Claude Code, Prisma da type-safety sobre la DB. Moderno pero estable.

**Alternativas descartadas**:
- **Laravel + MySQL**: más familiar (Agustín ya trabajó con WAMP), pero separa front y back, menos momentum con Claude Code.
- **React + Node/Express + Postgres**: válido pero requiere más setup y decisiones iniciales; Next.js viene con mucho resuelto.

---

## 2026-04-23 · Alcance inicial: MVP (Plan Base de propuesta), escalar a Intermedio por iteraciones

**Por qué**: coherente con la recomendación profesional que le hicimos al cliente en la sección 8 de la propuesta. Entregar rápido, validar con uso real, invertir después con certeza en lo que pida el negocio.

**Alternativas descartadas**:
- **Plan Intermedio completo de entrada**: riesgo de sobre-desarrollo, demora la entrega, construye features que tal vez no se usan.

---

## 2026-04-23 · Flujo de trabajo con Claude Code: mezcla

Scaffolding grande + iteraciones chicas y revisadas.

**Por qué**: Claude Code es muy eficiente en setup y andamiaje. Para features con lógica de negocio delicada (stock, ventas, permisos) conviene prompts chicos y revisión paso a paso.

---

## 2026-04-23 · Repo local hasta antes del deploy

**Por qué**: menos fricción al arranque.

**Pendiente**: migrar a GitHub privado antes del go-live (tarea ya agendada en `ROADMAP.md`).

---

## 2026-04-24 · UI: shadcn/ui sobre Tailwind

**Por qué**: copia los componentes al repo en vez de ser dependencia opaca (se pueden editar), integración nativa con Tailwind que ya elegimos, Radix UI por debajo con accesibilidad resuelta, buen soporte de Claude Code.

**Alternativas descartadas**:
- **Mantine**: más "todo incluido" pero trae su propio sistema de estilos y se pelea con Tailwind.
- **Tailwind puro**: obligaría a armar a mano modals, dropdowns, date pickers, comboboxes. Tiempo regalado.

---

## 2026-04-24 · Tema: solo light para el MVP

**Por qué**: el sistema se usa en mostrador con luz controlada, nadie pidió dark mode, y soportarlo desde día 1 obliga a pensar tokens de color duales innecesariamente. Si alguien lo pide post-MVP, Tailwind + shadcn lo resuelven en una tarde.

---

## 2026-04-24 · GitHub desde el día 1 (no antes del deploy)

**Por qué**: cambio respecto al plan original. Arrancar el repo en GitHub desde el commit inicial evita tener que migrar historial después y da backup remoto desde el arranque.

**Alternativas descartadas**:
- **Migrar antes del deploy productivo** (plan original): más fricción, riesgo de perder trabajo local si se rompe la máquina.

---

## 2026-04-24 · Prisma pineado a v6 (no v7)

**Por qué**: Prisma 7 cambió el modelo de configuración (requiere `prisma.config.ts` y rompe el `url = env(...)` clásico en el schema). Pelearse con eso en Sprint 0 no aporta nada al MVP. Quedamos en `6.19.3`.

**Plan de upgrade**: evaluar salto a v7 post-Sprint 3, cuando el schema esté más estable y tengamos más tracción.

---

## 2026-04-24 · Postgres en Docker en puerto 5433 (no 5432)

**Por qué**: evita colisión si alguna vez se instala Postgres nativo o corre otro proyecto con Postgres en paralelo. Adentro del contenedor sigue siendo 5432, solo cambia el mapeo al host.

---

## 2026-04-24 · Testing del MVP: manual + Playwright al final

**Por qué**: MVP interno para ~10 usuarios en 2 locales no justifica setup de testing pesado desde el día 1. Plan: testing manual durante desarrollo, Playwright en Sprint 8 para flujos críticos (login, nueva venta, baja de stock). Vitest se suma si aparece lógica pura no trivial.

---

## 2026-04-25 · Felipa 2 queda fuera del alcance del MVP

**Por qué**: cambió el panorama respecto a lo charlado el 2026-04-24. Felipa 2 dejó de ser un clon del bazar Felipa 1 y pasó a ser un proyecto distinto: local de ropa (King of the Kongo + marcas acompañantes), apertura tentativa primavera 2026. Modelo de negocio diferente (talles, temporadas, multi-marca, otra rotación), no es "otra sucursal" sino otro sistema.

**Implicancia**: el schema se modela mono-sucursal. Cuando Felipa 2 abra, se evalúa: extender este sistema vs. arrancar uno nuevo. La decisión queda diferida porque hoy no tenemos info suficiente.

**Reverso explícito**: esta decisión deja sin efecto la decisión "Schema multi-sucursal desde día 1" que se había considerado el 2026-04-24.

**Alternativas descartadas**:
- **Schema multi-sucursal genérico desde día 1**: complejiza el MVP por una segunda sucursal hipotética con un modelo de negocio distinto. Construir abstracción sin saber el caso real es sobre-ingeniería.
- **Schema "preparado" para multi-rubro (bazar + ropa)**: requiere variantes complejas, multi-marca, multi-temporada desde el día 1. Eso es Plan Avanzado, no MVP.

---

## 2026-04-25 · MVP no integra facturación AFIP — convive con el sistema actual

**Por qué**: Felipa es Responsable Inscripto y ya tiene un sistema de facturación funcionando (aunque mal usado: facturan todo como producto "varios" con monto manual). Integrar AFIP en el MVP (CAE, padrones, contingencias) extendería Sprint 6 de 2-3 semanas a 6-8 semanas y agregaría riesgo regulatorio sin haber validado uso real del sistema.

**Implicancia operativa**: durante el MVP, el cajero hace dos acciones al cobrar: (1) registra la venta detallada en nuestro sistema, (2) factura "varios" en el sistema viejo. ~30 segundos extra por venta. Hay que comunicárselo a Felipa explícitamente antes del go-live.

**Plan de evolución**: post-go-live, evaluar integración con el sistema de facturación existente (si tiene API) o reemplazo completo con integración AFIP nativa. Decisión a tomar con datos de uso real.

**Sistema actual identificado** (2026-04-27): SSL Soft Gescom (versión `20251104-7023201`), desktop Windows. Sistema típico de gestión comercial argentino. Sin API REST documentada — la integración directa requeriría escribir en su DB (frágil) o usar import/export por archivos si el sistema lo soporta. **Camino más probable post-MVP**: reemplazo total con integración AFIP nativa (vía Web Service AFIP o wrapper tipo TusFacturas/iFactura), no integración con ORREGO/Gescom.

**Alternativas descartadas**:
- **Integrar AFIP en el MVP**: duplica el alcance de Sprint 6 sin validación previa. Riesgo regulatorio innecesario.
- **Integración con el sistema existente desde el MVP**: depende 100% de qué sistema tienen y si expone API. Hasta no saberlo, no es una opción evaluable.

---

## 2026-04-25 · Variantes de producto soportadas desde el MVP

**Por qué**: el cliente confirmó que las variantes (mismo producto en distintos colores, tamaños, presentaciones) "suceden mucho". Originalmente las variantes estaban marcadas como Plan Intermedio en la propuesta, pero si son frecuentes en la realidad operativa, el sistema queda inservible sin soporte.

**Modelo de datos**: el stock y la venta van a nivel de **variante**, no de producto. Cada variante tiene su propio código de barras (cuando lo tiene) y su propio stock por sucursal.

```
Producto (id, nombre, descripción, categoría, precioBase, costoBase)
  └─ Variante (id, productoId, atributos JSON, código de barras opcional, precio?, costo?)
        └─ Stock (varianteId, sucursalId, cantidad)
```

**Refinamiento (2026-04-27)**: el cliente confirmó que muchas variantes (especialmente colores) comparten precio entre sí. Para no obligar a cargar el mismo precio N veces ni duplicar datos, el precio y costo se modelan **a nivel producto con override opcional a nivel variante**.

Si la variante tiene `precio = null`, hereda de `Producto.precioBase`. Si tiene valor, sobrescribe. Misma lógica para costo. Al actualizar el precio del producto, las variantes que heredan se mueven automáticamente; las que tienen override se preservan con confirmación al usuario.

**Implicancia en UX**: para productos sin variantes, la UI debe seguir siendo simple — se crea automáticamente una "variante única" oculta para el usuario. La complejidad del modelo no se filtra a la pantalla. Para productos con variantes que comparten precio (botellas térmicas en 5 colores) tampoco se ve el override; aparece solo cuando el usuario activa el toggle "esta variante tiene precio propio".

**Alternativas descartadas**:
- **Diferir variantes a post-MVP**: el cliente sufriría desde el día 1 con productos que no puede modelar; quedaría dependiente del sistema viejo en paralelo.
- **Variantes como productos separados ("Billetera Amyra Beige" y "Billetera Amyra Negra" como dos productos distintos)**: rompe reportes de "producto más vendido" e infla el catálogo artificialmente.
- **Precio siempre a nivel variante**: obliga a cargar el mismo número N veces y mantener consistencia manualmente al actualizar.

---

## 2026-04-25 · Roles del MVP: Admin y Vendedor (no tres roles)

**Por qué**: en la realidad operativa todos hacen todo, salvo el remarcado de mercadería entrante que solo lo hacen la dueña y su hijo. Un esquema de tres roles (Administrador / Encargado / Vendedor) que estaba en el plan original es sobre-ingeniería para 4 personas en 1 sucursal.

**Roles**:
- **Admin**: dueña + hijo. Puede hacer todo, incluido cargar productos, ajustar precios y costos, y ver reportes.
- **Vendedor**: empleadas. Puede registrar ventas, consultar stock y consultar productos. No puede modificar precios ni cargar mercadería.

**Plan de evolución**: si en algún momento aparece la necesidad de un rol intermedio (Encargado), se agrega. El schema de permisos se diseña suficientemente flexible para soportarlo sin migración.

**Alternativas descartadas**:
- **Tres roles desde el día 1** (Admin / Encargado / Vendedor): no hay encargado real hoy.
- **Sin roles, todos pueden todo**: la propia respuesta del cliente identificó una excepción real (remarcado).

---

## 2026-04-27 · Sprint 2: scaffold de pantallas en código directo, sin Figma

**Por qué**: el ROADMAP original planteaba Sprint 2 como "wireframes en Figma + flujo navegable". En un equipo de uno solo (Agustín), diseñar en Figma y después transcribir a código es trabajo duplicado. shadcn/ui ya está instalado y la estética del MVP es estándar (no requiere exploración visual extensa). Saltar a HTML estático con shadcn ahorra ~1 sprint completo y deja la base de Sprint 4+ ya en código real.

**Las decisiones de diseño visual y funcional las tomamos nosotros** (Agustín como dev + Claude como tech lead), no se validan con el cliente pantalla por pantalla. El cliente decide sobre lo operativo (cómo se vende, cómo se controla stock); nosotros decidimos sobre lo técnico/visual/funcional.

**Alternativas descartadas**:
- **Wireframes en Figma + iteración con cliente**: lento, requiere herramienta extra, y el cliente no tiene criterio para opinar de UX antes de ver el sistema funcionando.
- **Wireframes en HTML pero estáticos sin auth ni rutas reales**: deja un "demo" descartable en lugar de la base sobre la que se construye Sprint 4+.

---

## 2026-04-27 · Mock auth provisorio para el scaffold (Sprint 2 → Sprint 3)

**Por qué**: el scaffold de pantallas (Sprint 2) necesita protección de rutas por rol para ser realmente útil, pero auth real es Sprint 3 e implica decisiones que dependen del schema completo (provider, sesión, tabla de usuarios). Implementar auth real ahora obliga a tomar decisiones a ciegas y mezcla dos sprints.

**Solución**: mock auth basado en cookie (`felipa-mock-role` con valor `admin` o `vendedor`), helpers `getMockUser()` y `requireAuth(allowedRoles?)` en `lib/auth/mock.ts`, y un role switcher visible solo en desarrollo (`process.env.NODE_ENV === 'development'`) en el header. El login es un placeholder con dos botones grandes ("Entrar como Admin" / "Entrar como Vendedor").

**Plan de migración**: en Sprint 3 parte 2, reemplazar `getMockUser()` por la sesión real sin tocar las páginas (la firma del helper se mantiene). Las páginas siguen llamando `await requireAuth([...])` igual.

**Reverso (2026-05-08)**: cumplido en Sprint 3 parte 2 prompt 2. `lib/auth/mock.ts` renombrado a `lib/auth/session.ts` con cuerpo nuevo basado en `auth.api.getSession()`. Firma intacta.

**Alternativas descartadas**:
- **Adelantar auth real a Sprint 2**: rompe el orden lógico de sprints y obliga a decidir provider/schema sin tener el schema completo.
- **Sin protección de rutas en el scaffold**: deja el scaffold cojo, no se prueba navegación real ni redirección por rol.

---

## 2026-05-08 · Hosting de la app: Vercel

**Por qué**: integración nativa con Next.js (mismo equipo lo mantiene), free tier suficiente, deploys automáticos desde GitHub, preview deployments por PR, integración nativa con Neon (1 click para conectar la DB).

**Alternativas descartadas**:
- **Render / Fly.io / Railway**: válidas pero menos integradas con el stack y con menos features automáticas para Next.js.
- **VPS propio con PM2 / nginx**: más control pero overhead operativo significativo (mantener servidor, certificados, backups manuales).

**Implicancia operativa**: el sistema productivo es 100% dependiente de internet. Felipa hoy tiene internet estable (no se corta), así que es aceptable. Si alguna vez se cayera internet, no se podría vender hasta que vuelva. Trade-off conocido y aceptado. Se le va a comunicar a Felipa antes del go-live.

---

## 2026-05-08 · DB de producción y demo: Neon (Postgres serverless)

**Por qué**: free tier muy generoso (0.5 GB storage por proyecto, 100 CU-hours/mes, sin pausa por inactividad — solo scale-to-zero con despertar de 1-2s), integración nativa con Vercel, **branching** para tener "demo" y "prod" como ramas separadas de la misma DB. Para el volumen de Felipa (~200 productos, ~50 ventas/día) el free tier alcanza por años.

**Alternativas descartadas**:
- **Supabase (Postgres + Auth integrado)**: hubiera sido coherente con Big Burger, pero los slots free de Supabase del usuario quedan reservados para Big Pizza (próximo proyecto). Además, Supabase pausa proyectos free tras 7 días de inactividad — fricción innecesaria para un demo que el cliente puede no abrir todos los días.
- **Vercel Postgres**: por debajo es Neon de todos modos pero más caro al escalar.
- **Postgres en Docker en VPS propio**: más control pero overhead operativo (mantener servidor, backups, certificados).

**Implicancia técnica**: 
- Docker local sigue siendo la DB de desarrollo (no cambia).
- En Neon se crea un proyecto con dos branches: `demo` (con seed de bazar para mostrarle al cliente) y `prod` (con seed mínimo cuando llegue el go-live).
- Connection pooling **obligatorio** para Vercel: usar la URL del pooler de Neon con `?pgbouncer=true&connection_limit=1`. Sin esto, los cold starts de Vercel pueden agotar conexiones.
- Las migraciones Prisma corren contra ambas branches en el orden: docker local → demo → prod.

---

## 2026-05-08 · Auth library: Better Auth (no Auth.js v5, no Supabase Auth)

**Por qué**: Auth.js v5 (la opción inicial registrada en el ROADMAP) sigue marcado como beta hace años y los maintainers se mudaron a Better Auth en 2025. Para proyectos nuevos, los propios maintainers de Auth.js recomiendan Better Auth. Better Auth tiene release estable (v1+ desde inicios de 2025), configuración 100% en código, DB sessions con invalidación inmediata, y está activamente mantenido en 2026.

**Alternativas descartadas**:
- **NextAuth v4 (estable formal)**: congelado, sin features nuevas, va a quedar deprecated. Te metés a una tecnología sin futuro.
- **Auth.js v5 (NextAuth v5)**: en beta perpetua, librería en transición de mantenedores. Riesgo real de quedar atado a algo sin futuro claro.
- **Supabase Auth**: hubiera sido coherente con Big Burger pero requiere usar Supabase como DB también (ver decisión anterior — Neon ganó). Mezclar Neon + Supabase Auth no tiene sentido (perdés la integración nativa de Supabase).

**Sesiones**: **DB sessions** (no JWT). Razón: si Felipa desactiva una empleada, el logout debe ser inmediato. Con JWT la sesión seguiría válida hasta expirar (días). Para 4 personas en un local, la invalidación inmediata es importante.

**Hashing**: lo gestiona Better Auth internamente (scrypt). No usamos bcrypt ni manejamos el hash a mano.

**Reverso explícito**: deja sin efecto la mención de "Auth.js / NextAuth v5" que figuraba en el ROADMAP de Sprint 3 parte 2. También deja sin efecto la mención original de "hash con bcrypt" — el algoritmo lo decide la librería.

---

## 2026-05-08 · Login con username + password (no email)

**Por qué**: el equipo de Felipa son 4 personas, algunas empleadas pueden no usar email habitualmente. Pedirles "tu mail" en cada login agrega fricción innecesaria. Username corto y memorable es más práctico.

**Alternativas descartadas**:
- **Email + password**: estándar pero superflua para el contexto.
- **Magic links / OTP por email**: requieren proveedor de email transaccional, agrega fricción al onboarding.

---

## 2026-05-08 · Cuentas se crean manualmente desde Gestión de Usuarios

**Por qué**: el seed solo crea **un admin inicial** con password conocida temporalmente para el primer login. Después la dueña crea las cuentas de las vendedoras desde la pantalla de Gestión de Usuarios. Evita hardcodear cuentas en el seed que se vayan a usar en producción real.

**Implicancia**: pantalla nueva **Gestión de Usuarios** (Admin only) — alta, edición, activación/desactivación, reset de password. Esta pantalla no estaba en el plan original.

**Admin inicial del seed** (definido el 2026-05-08 al armar el prompt 1 de Better Auth): username `felipa`, password `felipa1234`, rol `ADMIN`. Placeholder, se cambia desde la pantalla nueva apenas haya una sesión real funcional.

**Alternativas descartadas**:
- **Crear los 4 usuarios en el seed**: queda trazado en el código un set de credenciales que si no se cambia, queda en producción. Fricción de seguridad.

---

## 2026-05-08 · Cierre de caja simple entra al MVP — fichero formal y calendario quedan diferidos

**Por qué**: el cliente pidió que las vendedoras pudieran ver "cómo rindieron" en el mes y que el sistema sirviera también como **fichero** (control de horario laboral) con **calendario de turnos** asignados. Eso son tres features grandes (cierre formal de caja + fichaje laboral + planificación de turnos), suman entre 2 y 3 sprints adicionales, y tienen implicancia legal (registros de jornada laboral en Argentina, Ley 20.744). Va contra el principio rector "empezar simple".

**Fragmentación adoptada**:
- ✅ **Cierre de caja simple entra al MVP**: apertura del turno declarando efectivo inicial, cierre con conteo y diferencia calculada, ventas asociadas al turno abierto, dashboard del vendedor mostrando "tus turnos del mes con monto vendido y diferencia de caja".
- ⏸️ **Fichero formal de jornada laboral**: queda para post-MVP. Sin calendario no se puede detectar "llegada tarde" porque falta el dato comparativo.
- ⏸️ **Calendario de turnos asignados**: queda para post-MVP. Requiere modelo de planificación, gestión de ausencias, cambios de turno, etc.

**Modelo de datos**: nuevo modelo `Turno` en el schema, diseñado desde el día 1 con:
- `aperturaEn`, `cierreEn` (timestamps)
- `vendedorId`
- `efectivoInicialDeclarado`, `efectivoContadoCierre`, `diferencia`
- Relación 1-N con `Venta` (una venta pertenece al turno abierto del vendedor que la registró)

Cuando se construya el fichero formal post-MVP, los timestamps ya están guardados desde el día 1 — solo se agregan pantallas de reporte y comparación contra planificación.

**Implicancia comercial**: hay que avisarle a Felipa **explícitamente antes del demo** que el fichero y el calendario quedan para una segunda etapa, así no llega esperando ver eso.

**Implicancia legal**: si en algún momento se quiere usar el fichero como registro formal de jornada (presentable ante AFIP / sindicato), hay requisitos regulatorios que charlamos por separado. Para uso interno (Felipa controlando asistencia entre ellas) no hay tema.

**Alternativas descartadas**:
- **Las tres features completas al MVP**: 4-6 semanas más al cronograma, scope creep no acordado comercialmente.
- **Fichero "ligero" sin calendario**: sin planificación, el fichero solo informa horas trabajadas — no puede detectar llegadas tarde. Media feature, sin valor real para el caso de uso pedido.

---

## 2026-05-08 · Vendedor puede consultar stock (modo lectura, sin costo)

**Por qué**: el vendedor necesita responderle al cliente "tengo o no tengo X" sin tener que pedirle al admin. La consulta de stock es un caso de uso real y frecuente. La decisión original "`/stock` es Admin only" era demasiado restrictiva.

**Implicancia**: la pantalla `/stock` se modifica para soportar dos modos según el rol:
- **Admin**: ve stock + costo + acceso a ajustes manuales (P6.1) y al historial de movimientos (P6.3) y al ingreso bulk (P6.2).
- **Vendedor**: ve stock únicamente. Sin costo. Sin acciones de ajuste. Sin acceso a `/stock/movimientos` ni `/stock/ingreso`.

**El costo se oculta a nivel HTML** (server-side), no CSS. Si está en el HTML aunque sea oculto por CSS, un vendedor curioso podría leerlo desde DevTools.

**Reverso explícito**: deja sin efecto la decisión original de `/stock` como Admin only que se aplicó en Sprint 5 (P6.1).

---

## 2026-05-08 · Adelantamiento de auth real antes del demo

**Por qué**: el ROADMAP original ubicaba auth real en "Sprint 3 parte 2", cerca del go-live. Ahora vamos a entregar un demo a Felipa antes del go-live formal, y el mock auth (dos botones "Entrar como Admin / Vendedor") da una primera impresión poco profesional. Adelantar Better Auth ~3 sesiones a cambio de un demo serio vale la pena.

**Implicancia técnica**: la firma de `requireAuth([...])` en las pantallas se mantiene (decisión tomada en Sprint 2 justamente para esto). Solo cambia el cuerpo del helper — pasa de leer la cookie de mock a leer la sesión real de Better Auth. Las pantallas existentes no se tocan.

**Implicancia de plan**: el orden de tareas se reorganiza (ver `ROADMAP.md`). Auth + Gestión de Usuarios + Cierre de caja (modelo Turno) van **antes** del Sprint 6 de Ventas, porque las ventas ya tienen que asociarse al turno abierto del vendedor logueado.

---

## 2026-05-08 · Vulnerabilidades de `npm audit` — 4 resueltas, 1 documentada como deuda técnica

**Por qué**: el `npm audit fix` resolvió 4 de 5 vulnerabilidades:
- `postcss` (moderate, transitiva) → bump a `^8.5.10` + override top-level
- `glob` (high, transitiva via `eslint-config-next`) → override `^10.5.0` (la vuln era en el CLI, que no usamos)

Queda 1 vulnerabilidad **high** sin resolver: 4 advisories agrupados de Next.js 14.2.35 (4 DoS + 1 request smuggling). El fix solo existe en Next 15+, pero el proyecto está pineado a Next 14 — saltar a 15 implica migración no trivial (`params` async, `fetch` sin cache por default, breaking changes en App Router) que no es razonable hacer ahora.

**Riesgo aceptado**: el sistema corre detrás de Vercel (que mitiga DoS y request smuggling a nivel infra) y atiende a 4 usuarios internos sin tráfico hostil. Riesgo real bajo.

**Plan**: evaluar migración a Next 15 (o Next 16, si ya está estable cuando lleguemos) como tarea aparte post-go-live, con el sistema en producción estable y una sesión dedicada a la migración.

**Commit del fix**: `822012b chore: resolve npm audit vulnerabilities` (2026-05-08).

---

## 2026-05-08 · Renombrar `Usuario` → `User` en el schema Prisma

**Por qué**: Better Auth requiere una tabla `user` (lowercase) con campos específicos (`email`, `emailVerified`, `name`, `image`, `createdAt`, `updatedAt`) y crea además 3 tablas adicionales (`session`, `account`, `verification`). Las tres opciones evaluadas:

- **(a) Renombrar `Usuario` → `User`** y absorber el modelo existente en el `user` de Better Auth. Custom fields (`rol`, `activo`) se mantienen en el modelo. Las 4 tablas de auth quedan en inglés porque son infraestructura de la librería; el resto del schema sigue en español.
- **(b) Mantener `Usuario` aparte y tener `User` separado**: dos tablas para el mismo concepto. Mala idea.
- **(c) Configurar Better Auth con field mapping a `Usuario`**: posible pero introduce fricción permanente con la librería en cada upgrade y en cada plugin nuevo.

**Decisión: opción (a).** Mantener nombres en español para tablas que existen solo porque la librería las pide es coherencia de fachada que pelea contra la herramienta. Las FKs desde otros modelos (`MovimientoStock.usuarioId`, etc.) siguen funcionando porque Prisma maneja el rename del modelo sin tocar los nombres de campos del lado dueño.

**Refinamiento aplicado**: en lugar de absorber los nombres en inglés tal cual, se usa `user.fields` en `lib/auth/server.ts` para mapear los nombres lógicos de Better Auth a las columnas SQL en español: `name → nombre`, `createdAt → creadoEn`, `updatedAt → actualizadoEn`. Esto mantiene el dominio en español incluso para los campos lógicos de la librería, no solo los custom. Resultado: a nivel SQL las columnas siguen siendo `nombre`/`creadoEn`/`actualizadoEn`, y Better Auth las lee transparentemente.

**Implicancia técnica**: la migración tiene un `RENAME TABLE`. La DB Docker en dev queda con datos del seed nuevo (admin único `felipa`); los datos previos del seed se pierden — está OK porque no hay producción todavía.

**Convención que adoptamos a partir de acá**: tablas que existen por requisitos de librerías externas pueden mantener los nombres que la librería espera. El dominio de negocio (productos, ventas, stock, turnos, etc.) se mantiene en español.

**Alternativas descartadas**: ver opciones (b) y (c) arriba.

---

## 2026-05-08 · Workflow de branches: una branch por sprint, no main directo, no worktree

**Por qué**: Sprint 3 parte 2 son 9 sub-tareas y cada una es un prompt separado para Code. Trabajar directo en `main` deja commits intermedios con el sistema en estados raros (ej: "Better Auth instalado pero desconectado de las pantallas"). Una branch dedicada por sprint permite agrupar el trabajo y mergear limpio (squash o merge regular) al cerrar.

**Convención adoptada**: cada sprint vive en una branch nombrada `sprint-<n>/<descripcion-corta>`. Para el primer caso fue `sprint-3-2/auth-real`. Al cerrar el sprint, **squash merge a `main`** con un único commit resumen (decidido el 2026-05-08 al cerrar Sprint 3.2). La branch local se borra con `-D`; la remota se preserva en GitHub como traza fina.

**Worktrees descartados** para este caso específico: el aislamiento del worktree es a nivel filesystem, no a nivel datos. La DB Docker se comparte entre branches y worktrees, y la migración del Sprint 3.2 era destructiva (rename de tabla `Usuario` → `user`). Una vez aplicada, `main` no compila contra esa DB sin reset. El worktree no resuelve el factor limitante (la DB).

**Cuándo sí usaríamos worktree en el futuro**: si en algún sprint se necesita trabajar en paralelo en dos features que NO toquen el schema, o si Agustín prefiere arrancar `npm run dev` en `main` mientras Code trabaja en otra branch. Por ahora, branch dedicada alcanza.

**Alternativas descartadas**:
- **Trabajar en `main` directo**: log raro con commits intermedios funcionales pero confusos, sin posibilidad de tirar el sprint si el approach falla.
- **Branch + worktree**: overhead innecesario porque la DB es compartida, no resuelve nada concreto en este caso.

---

## 2026-05-08 · Crear usuarios server-side con `prisma.user.create` directo (no `signUpEmail`)

**Por qué**: descubierto durante el smoke test del prompt 3 del Sprint 3.2 (Gestión de Usuarios). El primer intento usaba `auth.api.signUpEmail` (igual que el seed), pero ese método **crea una sesión para el nuevo user** y el plugin `nextCookies` la escribe en el `Set-Cookie` de la response, **pisando la sesión del admin que estaba creando la cuenta**. Resultado: después de crear "Andrea", el admin quedaba logueado como Andrea sin haberlo querido.

**Solución adoptada**: en server actions que se ejecutan dentro de un request context (es decir, donde puede haber una sesión activa), crear el user con `prisma.user.create` con nested `account.create`, usando `hashPassword` de `better-auth/crypto` para generar el hash de la password. Byte-compatible con lo que `signUpEmail` haría internamente.

```ts
// lib/usuarios/actions.ts
import { hashPassword } from 'better-auth/crypto';

const passwordHash = await hashPassword(input.password);
await prisma.user.create({
  data: {
    email: `${input.username}@felipa.local`,
    name: input.nombre,
    username: input.username,
    rol: input.rol,
    sucursalId: input.sucursalId,
    activo: true,
    emailVerified: true,
    accounts: {
      create: {
        accountId: createId(),
        providerId: 'credential',
        password: passwordHash,
      },
    },
  },
});
```

**El seed sigue usando `signUpEmail`** porque corre en CLI sin request context — no hay sesión activa que pisar.

**Documentación**: hay un comentario explícito en `lib/usuarios/actions.ts` recordando esta razón, para que no aparezca alguien en el futuro y "simplifique" el código volviendo a `signUpEmail`.

**Alternativas descartadas**:
- **Usar `signUpEmail` y restaurar la sesión del admin después**: frágil — depende de poder restaurar la cookie correcta del admin, race conditions, etc.
- **Hacer el create vía un endpoint custom de Better Auth**: requiere armar un endpoint y un plugin, más complejidad para el mismo resultado.
- **Plugin `admin` de Better Auth**: agrega columnas (`role`, `banned`, `banReason`, `banExpires`) que pisarían el dominio. Descartado.

---

## 2026-05-08 · Reset de password admin: `hashPassword` + write directo a `account.password`

**Por qué**: Better Auth core no expone un `auth.api.adminResetPassword` ni equivalente. El plugin `admin` agrega `setUserPassword` pero también clava cuatro columnas en `user` (`role`, `banned`, `banReason`, `banExpires`) que chocan con nuestras columnas de dominio (`rol`, `activo`). Las opciones evaluadas:

- **(a) Importar `hashPassword` de `better-auth/crypto`** (la misma función que `signUpEmail` usa internamente) y escribir el hash directo en `account.password` con `prisma.account.updateMany({ where: { userId, providerId: 'credential' } })`. Byte-compatible con el flujo de login.
- **(b) Usar `auth.api.changePassword`**: requiere la password actual. NO sirve para "admin resetea password de otro user".
- **(c) Plugin `admin` con `setUserPassword`**: agrega columnas que pisan el dominio.
- **(d) Borrar el row de `account` y crear uno nuevo**: doble round-trip, riesgo de dejar inconsistencia si falla el segundo paso.

**Decisión: opción (a)**.

```ts
// lib/usuarios/actions.ts (resetUsuarioPassword)
import { hashPassword } from 'better-auth/crypto';

const passwordHash = await hashPassword(input.nuevaPassword);
await prisma.account.updateMany({
  where: { userId: input.userId, providerId: 'credential' },
  data: { password: passwordHash },
});
// Invalidar sesiones activas del usuario afectado
await prisma.session.deleteMany({ where: { userId: input.userId } });
```

**Caveats**:
- Es ligeramente "white-box" — depende de un detalle interno de Better Auth (el formato del hash). Mitigado por el hecho de que `hashPassword` es API pública y explícitamente exportada de `better-auth/crypto`, no estado oculto. Si en el futuro Better Auth cambiara el algoritmo, `hashPassword` sigue siendo el punto de entrada estable.
- Después del reset, las sesiones activas del usuario afectado se eliminan (`session.deleteMany`) para que la próxima request lo patee al login. Importante si el motivo del reset fue "se le filtró la password".

**Alternativas descartadas**: ver (b), (c), (d) arriba.

---

## 2026-05-09 · Modelo Turno aplica a Admin y Vendedor (campo `userId`, no `vendedorId`)

**Por qué**: en Felipa todos venden — la dueña, el hijo y las dos empleadas. Si el modelo asociara turno solo a Vendedor, las ventas hechas por los Admin quedarían huérfanas (sin `turnoId`) y el cierre de caja no incluiría su efectivo. La realidad operativa pide que cualquier persona que vende abra y cierre turno.

**Implicancia**: el campo se llama `userId` (no `vendedorId`). La obligación de tener turno abierto para registrar venta se va a aplicar a nivel "ruta `/ventas/nueva`" (Sprint 6.1), no a nivel rol. Admin que solo consulta reportes no necesita turno.

**Alternativas descartadas**:
- **Solo Vendedor maneja turnos, Admin vende sin turno**: rompe la semántica del cierre de caja. Si Felipa vendió $50k en efectivo durante el día, ¿en el conteo de quién aparecen?
- **Solo Vendedor maneja turnos, Admin no vende**: contradice la realidad operativa.

---

## 2026-05-09 · "Turno olvidado" = más de 12 horas abierto. Guard estricto vía middleware + layout

**Por qué**: al loguearse o navegar con un turno abierto desde hace >12 horas, el sistema redirige forzadamente a `/turno/cerrar` y no deja hacer otra cosa hasta cerrar. La regla original "redirect si hay turno abierto" rompía el caso normal (turno fresh de la mañana, sigo trabajando a la tarde). El umbral de 12 horas separa los dos casos sin depender de TZ.

**Por qué 12 horas y no día calendario**: predecible, no depende de zona horaria del server (Vercel corre en UTC, el local está en America/Argentina/Buenos_Aires). 12 hs cubre los casos reales: turno mañana 9–13 + turno tarde 17–21 no se confunden, pero "abrí ayer y me olvidé" sí salta.

**Por qué guard estricto y no banner**: si fuera lax (banner "tenés turno abierto desde hace X horas"), el usuario podría seguir vendiendo y cerrar mucho después con la fecha del cierre real, contaminando el reporte de horas trabajadas que viene en Sprint 7. Forzar cierre + permitir editar `cierreEn` mantiene el dato limpio.

**Implementación técnica**: middleware Next.js mínimo expone `x-pathname` en headers (en `middleware.ts` raíz). El layout `(app)/layout.tsx` lee el pathname con `headers().get('x-pathname')`, llama a `getTurnoOlvidado(user.id)`, y si devuelve no-null y la ruta no es ya `/turno/cerrar`, hace `redirect('/turno/cerrar')`. La exclusión de la propia ruta evita loop infinito.

**Override de `cierreEn`**: cuando el turno es olvidado, el form de cierre muestra un campo `datetime-local` adicional con la fecha real de cierre (default = now()). Validado server-side: `>= aperturaEn` y `<= now()`. Para turnos no olvidados el campo no aparece.

**Convención adoptada para futuro**: cuando se necesite saber el pathname desde un Server Component (RSC) en Next App Router, usar el patrón middleware + `x-pathname` header. El middleware corre en Edge Runtime (no llamar Prisma desde ahí); el query a la DB se hace en el RSC, que corre en Node runtime.

**Alternativas descartadas**:
- **Por día calendario**: TZ-dependent, complica testing y deploys cross-region.
- **Solo banner sin redirect**: usuario puede ignorarlo y arrastrar turnos contaminando reportes.
- **Middleware con call a Prisma**: middleware corre en Edge Runtime, Prisma client estándar no funciona ahí.

---

## 2026-05-09 · Modelo Turno: snapshot al cerrar, estado implícito, observaciones opcionales, páginas dedicadas

**Por qué (snapshot)**: `efectivoEsperadoCierre` y `diferencia` se calculan al momento del cierre y se guardan como columnas. No se recalculan on-the-fly después. Fórmula: `efectivoEsperado = efectivoInicialDeclarado + Σ(monto en efectivo de ventas del turno)`, `diferencia = efectivoContado - efectivoEsperado`. Ventaja: reportes históricos consultan una columna, no joinean ventas. Las ventas del turno son inmutables (no se editan post-cierre), así que el snapshot no queda desactualizado.

**Por qué (estado implícito)**: `cierreEn IS NULL = abierto`. Sin enum `EstadoTurno`. Para el MVP alcanza. Si en el futuro aparece "anulado" o "en disputa", se agrega el enum entonces.

**Por qué (observaciones opcionales)**: la diferencia ≠ 0 no obliga a comentar. Si el cliente lo pide required cuando hay diferencia, son 5 minutos de cambio.

**Por qué (páginas dedicadas)**: `/turno/abrir` y `/turno/cerrar` son rutas, no modales. Modal post-login obliga a manejar "¿qué pasa si lo cierra?" (¿adónde lo mando? ¿lo desloguéo?). Página dedicada con guard es más simple, testeable y permite deep-link.

**Convención de UX adoptada**: cuando un input numérico está vacío en cálculos derivados (caso: efectivo contado vacío → diferencia), mostrar "—" en lugar de calcular contra 0. Calcular contra 0 da falsos negativos visuales (ej: "-$5.000 (faltó)" cuando el usuario aún no tipeó nada). Aplicable a futuros formularios de Sprint 6.1+ (carrito de venta, etc.).

**Cálculo del efectivo esperado contra `Venta` vacía**: en este sprint la query `calcularEfectivoVendidoEnTurno` corre contra una tabla `Venta` que está vacía (las ventas se crean en Sprint 6.1). Devuelve 0 limpio. Cuando 6.1 empiece a crear ventas, el cálculo arranca a sumar sin tocar nada acá. La función parsea `Venta.metodosPago` (JSON `[{ metodo, monto }]`) con Zod y tolera JSON corrupto sumando 0.

---

## 2026-05-09 · Concurrencia de turnos: partial unique index a nivel Postgres

**Por qué**: la regla "un solo turno abierto por user a la vez" no se puede garantizar con validación a nivel server action porque tiene race condition (dos requests concurrentes pasan el check antes de que cualquiera escriba). La única forma robusta es a nivel DB con un partial unique index:

```sql
CREATE UNIQUE INDEX "turno_user_abierto_unique"
  ON "turno"("userId")
  WHERE "cierreEn" IS NULL;
```

**Implementación**: Prisma 6 todavía no soporta partial unique indexes de forma declarativa en `schema.prisma`. La migración se generó con `prisma migrate dev --create-only` y se editó el SQL para agregar el `CREATE UNIQUE INDEX` a mano antes de aplicar. El `try/catch` de `P2002` en `abrirTurno` cubre el caso real (testeado: el segundo INSERT concurrente falla con `duplicate key value violates unique constraint`).

**Defensa en profundidad**: el server action también verifica con `getTurnoAbierto` antes de crear. La verificación a nivel app evita el round-trip del INSERT cuando se sabe que va a fallar; el index a nivel DB cubre la race condition.

**Convención adoptada para futuro**: cuando una invariante de negocio sea "un solo X cumpliendo condición Y por entidad Z", evaluar siempre partial unique index. Es cheap (2 líneas de SQL) y evita una clase entera de bugs concurrentes.

**Alternativas descartadas**:
- **Solo validación a nivel server action**: race condition real, no aceptable en producción.
- **Lock pesimista (`SELECT ... FOR UPDATE`)**: serializa requests, mucho más caro que el partial index.

---

_(Próximas decisiones van acá abajo, en orden cronológico.)_
