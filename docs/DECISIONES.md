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

---

## 2026-05-09 · Vendedor ve solo sus propias ventas en el historial

**Por qué**: en un bazar con empleadas, no hay razón operativa para que una vendedora vea las ventas de la otra. La dueña y su hijo (Admin) ven todo. Privacidad entre empleadas sin overhead de configuración.

**Implementación**: la pantalla `/ventas` (Sprint 6.2) aplica la restricción en dos niveles:
- **Query server-side** (`listarVentas`): cuando `permissions.verTodas === false`, fuerza `usuarioId = session.user.id` ignorando cualquier searchParam. El Vendedor no puede manipular la URL para ver ventas ajenas.
- **Action de detalle** (`obtenerDetalleVentaAction`): guard adicional que verifica `venta.usuarioId === user.id` si no es Admin. Protege contra acceso directo por ID.
- **UI**: el Vendedor no ve el filtro "Vendedor" ni la columna "Vendedor" en la tabla (no tiene sentido mostrar tu propio nombre en cada fila).

**Patrón de permisos aplicado**: `lib/ventas/permissions.ts` con `permisosVentas(rol)` → `{ verTodas, filtrarPorUsuario }`. Mismo patrón que `permisosStock` del Sprint 6.1.

**Alternativas descartadas**:
- **Vendedor ve todas las ventas**: más permisivo, pero sin caso de uso real. Si la dueña quiere ver todo, entra con su cuenta Admin.

---

## 2026-05-09 · `obtenerHistorialVariante` abierto a Vendedor (cambio de contrato del Sprint 5)

**Por qué**: en el Sprint 6.1 (refactor de `/stock` para Vendedor), se abrió la query `obtenerHistorialVariante` al rol Vendedor. La query solo expone movimientos de stock (tipo, cantidad, fecha, usuario, motivo) — no incluye datos de costo ni de precio. El Vendedor necesita ver el historial de movimientos de una variante para entender por qué el stock está en cierto valor (ej: "se rompieron 2 ayer").

**Decisión**: acceso permitido sin restricciones. No se filtra por usuario (el Vendedor ve todos los movimientos de la variante, no solo los suyos) porque los movimientos de stock son operativos, no sensibles como las ventas.

**Alternativas descartadas**:
- **Mantener la query solo para Admin**: obliga al Vendedor a preguntar "por qué el stock de X dice -3" sin poder verificar por su cuenta. Carga innecesaria al Admin.
- **Filtrar movimientos por usuario del Vendedor**: los movimientos de stock incluyen ingresos de mercadería y ajustes que hace el Admin. Si el Vendedor solo ve los suyos, el historial no cuadra con el stock actual.

---

## 2026-05-22 · Fase de prototipo post-demo: trabajar derecho en `main`, deploy continuo

**Por qué**: con el demo ya en producción y el cliente probándolo activamente (sabe que está en fase de prototipo), la coreografía de branch-por-sprint + squash agrega fricción sin valor en esta etapa. Se trabaja directo en `main`; Code commitea local con mensajes claros; Agustín controla el `push` (que dispara el deploy automático a Vercel) después de verificar. Worktree opcional si en algún momento conviene.

**Reverso parcial**: ajusta —solo para la fase de prototipo post-demo— la decisión del 2026-05-08 ("branch dedicada por sprint + squash merge"). Cuando se acerque el go-live formal, con usuarios reales y datos que no se pueden romper, se vuelve a un flujo con más ceremonia.

**Alternativas descartadas**:
- Mantener branch-por-sprint en prototipo: fricción innecesaria, retrasa el ciclo de feedback con el cliente.

---

## 2026-05-22 · Registro de venta robusto bajo concurrencia: advisory lock transaccional + guard de doble submit

**Contexto**: bug reportado desde el mostrador — "la primera venta sale, la segunda tira error". No se reproducía secuencialmente; solo bajo concurrencia (doble tap en la pantalla táctil sobre "Confirmar cobro", ensanchado por la latencia de Neon/Vercel).

**Causa raíz**: `generarCodigoCortoVenta` calculaba el NNN como `count(ventas del día) + 1` sin sincronización. Dos transacciones concurrentes leían el mismo count, computaban el mismo `codigoCorto`, una ganaba el unique y la otra fallaba con P2002 (que además llegaba crudo al cajero como "Unique constraint failed...").

**Decisión (dos capas)**:

1. **Generación de `codigoCorto` serializada** (commit `f3664a3`):
   - `pg_advisory_xact_lock(hashtext(sucursalId), hashtext(ddmm))` al entrar — serializa la generación por slot sucursal-día. Se libera al commit/rollback de la transacción.
   - **Por qué transaccional y no de sesión**: los advisory locks de sesión NO son seguros con pgbouncer en modo transacción (el pooler de Neon), porque la conexión se reasigna entre transacciones. El `_xact_` se libera al cerrar la transacción, antes de devolver la conexión al pool. Variante correcta para Neon.
   - NNN calculado con `max(codigoCorto)` filtrando por prefijo-día (`startsWith`), no con `count(*) + 1`.
   - **Por qué `max()` y no `count()`**: `count+1` se rompe en cuanto haya gaps (que vamos a crear con la cancelación de ventas del 6.5). `max()+1` es robusto a gaps, que ya estaban aceptados en el formato del código.

2. **Guard contra doble submit en el cobro** (commit `0c3f076`):
   - El fix de `codigoCorto` elimina el *error*, pero no el *disparador*. Con la colisión resuelta, un doble tap pasaría a crear **dos ventas duplicadas en silencio** (stock y caja duplicados) — operativamente peor que el error visible. Por eso la segunda capa.
   - Guard síncrono con `useRef(false)`, chequeado y seteado en el mismo tick al entrar al handler, antes de cualquier `await` o `setState`. El `disabled={cobrando}` queda solo como feedback visual (es async, no sirve de guard).
   - **No se resetea el ref en el camino feliz**: tras el `router.push` el form se desmonta; no resetear cierra la ventana del desmontaje. Sí se resetea en error de negocio o catch, para permitir reintento.

**Convención adoptada**: (a) para "código correlativo único por slot" con riesgo de race, usar advisory lock **transaccional** (pooler-safe) + cálculo por `max()`, no `count()`; (b) nunca filtrar mensajes crudos de Prisma/DB a la UI del usuario final: loguear el error real y mostrar un genérico. Engancha con la deuda del string-match de "cuenta desactivada" en login — misma familia, mismo criterio.

**Follow-up anotado**: idempotencia server-side (rechazo por `Idempotency-Key`) queda para otra vuelta; el guard de cliente alcanza para esta etapa.

**Alternativas descartadas**:
- Solo aumentar los reintentos del retry: no resuelve la race, la hace menos probable.
- `SELECT FOR UPDATE` / isolation serializable: más caro, serializa de más para el volumen de Felipa.
- Advisory lock de sesión: no es seguro con el pooler de Neon.
- Dejar solo el fix de `codigoCorto`: convertía un error ruidoso en un duplicado silencioso.

---

## 2026-05-22 · Descuento manual y opcional (reverso del 10% automático)

**Por qué**: el 10% todo-o-nada por efectivo/transferencia, definido al modelar `Venta`, no se aplica como regla automática en la realidad operativa. A veces se da, a veces no, a veces es otro porcentaje o un monto redondo. Forzar el 10% automático obligaba al cajero a "deshacerlo" en cada venta donde no aplicaba, que era la mayoría.

**Reverso**: el descuento automático sale. Se reemplaza por descuento **manual y opcional** sobre el total, en dos sabores: porcentaje (`descuentoTipo = 'PORCENTAJE'`) o monto fijo (`descuentoTipo = 'MONTO'`), con el valor en `descuentoValor`. El 10% por efectivo/transferencia queda como **preset de un toque** (botón que setea `tipo = 'PORCENTAJE'` y `valor = 10`), no como aplicación automática. `descuentoTotal` se sigue snapshot-eando al guardar la venta para que los reportes históricos no recalculen.

**Permisos**: la Vendedora puede aplicar descuentos sin tope al inicio. Queda registrado quién aplicó qué (por la `usuarioId` de la venta). Si en algún momento aparece abuso, se agrega tope por rol — schema ya lo soporta.

**Alternativas descartadas**:
- **Mantener el 10% automático con botón "quitar descuento"**: invierte el default operativo real (no aplicar es más común que aplicar), suma fricción a la mayoría de ventas.
- **Tope inicial por rol** (ej: Vendedora hasta 20%, Admin sin tope): sin evidencia de abuso, agregar la regla ahora es ingeniería preventiva. Si pasa, se agrega después.

---

## 2026-05-22 · Alta rápida de producto desde la venta: `incompleto` + `creadoPorId`

**Por qué**: durante la fase de carga del catálogo (~200 productos a mano), el cajero se topa con productos que no están cargados. Frenar la venta para hacer el alta completa (categoría, costo, variantes) es fricción operativa real. La alta rápida con solo nombre + precio resuelve el cobro inmediato y deja la deuda anotada para que Admin complete después.

**Modelo**: dos campos nuevos en `Producto`:
- `incompleto Boolean @default(false)` — flag que marca el producto como "falta data".
- `creadoPorId String?` (FK a `User`) — quién lo dio de alta rápida (no necesariamente Admin).

`crearProductoRapido` (server action, permite Admin y Vendedora) crea el `Producto` con `incompleto=true`, `costoBase=0`, sin categoría, con una variante única, y registra `Stock` + `MovimientoStock` tipo `INGRESO` con `cantidad=1`. La acción de carga completa (`editarProducto`) **auto-desmarca** `incompleto=false` cuando el admin sube `costoBase > 0` y elige categoría — sin pasos manuales.

**UX**: el listado tiene badge "Incompleto" + filtro "Solo incompletos" para que el admin barra el pendiente. Se proyecta que esta funcionalidad se use intensivamente al principio y se vuelva marginal a medida que el catálogo madura.

**Alternativas descartadas**:
- **Bloquear venta hasta que el admin cargue el producto**: rompe la operación del local. Inaceptable.
- **Alta rápida solo para Admin**: la dueña no está siempre en el local; la empleada se quedaría sin poder cobrar.
- **Stock inicial 0 en alta rápida**: la venta se haría con stock negativo, contaminando reportes. `stockInicial=1` (corresponde a la unidad que se está vendiendo) es lo natural.

---

## 2026-05-22 · Cancelar venta: solo turno abierto, post-cierre es devolución

**Por qué**: el cierre de caja **congela un snapshot** de la sesión (efectivo esperado, diferencia, totales) en columnas de `Turno`. Permitir anular una venta de un turno ya cerrado rompería esa invariante: la diferencia guardada dejaría de ser reproducible. Hay dos eventos distintos que la UX agrupaba mal:

- **Anular**: corregir un error de carga en caliente (cobré dos veces, escaneé mal, el cliente cambió de idea antes de cobrar). Modifica el estado de la venta original, revierte stock, no afecta caja porque sucede dentro del mismo turno (el snapshot todavía no existe).
- **Devolver**: evento nuevo, posterior, registrado aparte. La venta original queda como estaba; se crea un `Devolucion` + `ItemDevolucion` que reverte el stock y deja traza. Si la devolución es en efectivo, el cajero hace retiro manual o lo anota en observaciones — el efecto en caja no se trackea automático (ver decisión separada de devoluciones).

**Implementación**: `anularVenta` (server action) valida (a) que el turno de la venta esté abierto, (b) que no esté ya anulada, (c) permisos (Admin siempre; Vendedora solo sus propias del turno). Marca `anuladaEn`, `anuladaPorId`, `motivoAnulacion` (mínimo 3 chars, obligatorio). Revierte stock en transacción atómica con `Stock.increment` + `MovimientoStock` tipo `ANULACION_VENTA` (enum nuevo). La venta no se borra — queda en el historial con badge "ANULADA" y tachado.

Las agregaciones de caja (`calcularEfectivoVendidoEnTurno`, `obtenerResumenTurnoAbierto`, snapshot de cierre, `listarTurnosDelMes`) excluyen anuladas. Por eso anular tiene que pasar **antes** del cierre — el snapshot lee el estado actual al momento de cerrar.

**UI**: badge "ANULADA" + tachado en `/ventas`, filtro "Ocultar anuladas", info de anulación + botón "Anular venta" con motivo y confirmación en el detalle, link sutil desde `/ventas/exito` (deep link a `/ventas?venta=<id>`). Guard de doble submit (`useRef`) en el botón de anular.

**Alternativas descartadas**:
- **Anular en cualquier momento, recalcular snapshots**: rompe la idea del snapshot histórico. Los reportes pasados dejarían de ser estables. Inaceptable.
- **Anular solo Admin**: la empleada se equivoca y tiene que esperar a la dueña, fricción inaceptable en mostrador. Vendedora puede anular las suyas del turno; queda quién.
- **Anulación sin motivo**: convierte la herramienta en un undo silencioso; sin motivo es imposible auditar. Mínimo 3 chars.

---

## 2026-05-22 · Retiro de caja: `MovimientoCaja` durante el turno

**Por qué**: durante el día, el cajero saca plata de la caja por razones reales (pago a proveedor, gasto operativo, vuelto a otra caja). Sin trackearlo, al cerrar el turno el efectivo contado siempre da menos que el esperado, y la diferencia "negativa" deja de ser señal de error y pasa a ser ruido. El reporte se rompe en la práctica.

**Modelo**: nuevo `MovimientoCaja` (`turnoId`, `usuarioId`, `tipo` String default `'RETIRO'`, `monto` Decimal, `motivo`, `creadoEn`). Varios retiros por turno; el `tipo` queda como String (no enum) para no migrar si en el futuro aparecen ingresos manuales (ej: `INGRESO_EFECTIVO_DESDE_OTRO_TURNO`).

**Fórmula del esperado al cierre**: `efectivoInicial + ventas efectivo (excl. anuladas) − retiros`. La fórmula vive explícita en la UI de cierre (caja explicativa) para que el cajero entienda cómo se compone el número.

**Permisos**: la Vendedora puede registrar retiros, queda quién y por qué (motivo mínimo 3 chars). Sin tope al inicio.

**Alternativas descartadas**:
- **Trackear retiros en `observacionesCierre` como texto libre**: ilegible para reportes, no se puede sumar.
- **Solo Admin puede retirar**: lo mismo que con anular — la empleada no puede esperar al admin para sacar plata por una compra urgente.
- **Enum `TipoMovimientoCaja`**: para un solo valor (`RETIRO`) por ahora, agregar enum es ingeniería preventiva. String + default + futuro enum cuando aparezca el segundo valor.

---

## 2026-05-22 · Devoluciones: modelo separado de anulación, ≤30 días, sin tracking automático de caja

**Por qué (separado de anulación)**: ver decisión "Cancelar venta: solo turno abierto, post-cierre es devolución". Devolver es un evento posterior, no una mutación retroactiva. Modelo aparte (`Devolucion` + `ItemDevolucion`) lo deja explícito en el dominio: cada devolución es una fila propia, con su propia fecha, usuario, motivo y monto. La venta original queda intacta — solo se le calcula `cantidadDevueltaPorItem` y `estadoDevolucion` por agregación.

**Por qué ≤30 días**: ventana operativa razonable para un bazar. Más allá de 30 días el producto ya cambió de temporada/condición y no se reintegra. Validado server-side en `crearDevolucion`.

**Parcial vs total**: la UI deja elegir cantidad por item con tope = `vendida − ya devuelta` (permite múltiples devoluciones parciales de la misma venta). Botón "Devolver todo" para el caso común. Motivo obligatorio.

**Stock**: se revierte por item en transacción atómica (`MovimientoStock` tipo `DEVOLUCION` + `Stock.increment`). Igual que anular pero con tipo distinto en el historial — el reporte puede distinguir entre stock devuelto por anulación (error de carga) y devolución real (cliente cambió de idea).

**Por qué no se trackea el efecto en caja automáticamente**: una devolución en efectivo significa que el cajero le devolvió plata al cliente. En teoría correspondería un `MovimientoCaja` automático que descuente del esperado. Decisión: **empezar simple** — el cajero hace retiro manual con motivo "devolución" o lo anota en `observacionesCierre`. Razones:
- No sabemos todavía qué proporción de devoluciones son en efectivo vs transferencia vs débito (donde el efecto en caja es nulo o distinto).
- Automatizar mal es peor que no automatizar — si una devolución parcial se hace en mitad efectivo / mitad transferencia, el sistema no tiene forma de saberlo sin pedirlo, y eso suma fricción a un flujo poco frecuente.
- Cuando haya datos de uso real (¿cuántas devoluciones, qué métodos, qué tamaños?) se decide la automatización con evidencia.

**Alternativas descartadas**:
- **Mutar la venta original** (descontar del total, eliminar items): rompe la traza histórica. La venta como evento es inmutable.
- **Sin límite de días**: el bazar no quiere reintegros de productos comprados hace 6 meses. La regla operativa real es ~30 días.
- **`MovimientoCaja` automático en devolución en efectivo**: descrito arriba — diferido hasta tener datos. Si más adelante se decide automatizar, se hace en una sola transacción junto con `Devolucion` + `MovimientoStock`.

---

## 2026-05-22 · Semántica de métodos de pago (dashboard y reportes)

**Por qué**: la cantidad de ventas por método se cuenta una vez por cada método usado en la venta (un pago mixto suma a cada método). El monto por método es la **porción** pagada con ese método, tomada del JSON `Venta.metodosPago`, **no** el total de la venta — así la suma por método cuadra con el total vendido.

**Agregación**: en memoria. `Venta.metodosPago` es un campo JSON, no relacional, y `groupBy` de Prisma no opera dentro de JSON. Para el volumen de Felipa (caja diaria ~$280k, picos navideños hasta $1.5M, ~50–150 ventas/día) traer las ventas del rango y agregar en JS está perfecto, sin SQL raw.

**Normalización**: el agregador acepta `'EFECTIVO'`/`'efectivo'` indistintamente, porque en la DB conviven seeds del Sprint 6.0 (lowercase) con ventas del Sprint 6.1 en adelante (uppercase). Mientras no se migren los datos viejos, el helper `metodoCanonico` cubre ambos casos.

**Alternativas descartadas**:
- **Contar 1 venta una sola vez (en su método "principal")**: arbitrario en pagos mixtos. La métrica "cuántas ventas tocaron este método" es más accionable.
- **Sumar el total de la venta a todos los métodos usados**: doble conteo de plata; rompe el cuadre con el total vendido.

---

## 2026-05-22 · Gate de rol y auditoría de naming de `requireAuth`

**Por qué**: las páginas chequean rol con `requireAuth()` + comparación sobre `SessionUser.role` (normalizado a lowercase). El dashboard del admin (bifurcación de UI) y `/reportes` (acceso Admin-only) usan `user.role === 'admin'`. `requireAuth([...])` también acepta una whitelist de roles y hace el redirect server-side cuando no matchea — ambos caminos llegan al mismo lugar porque la función normaliza internamente.

**Auditoría de Sprint 7**: 4 convenciones conviviendo en `requireAuth([...])` sobre 16 rutas:
- `['ADMIN']` (uppercase, Admin-only): `productos/nuevo`, `productos/[id]/editar`, `stock/ingreso`, `stock/movimientos`, `usuarios`.
- `['admin']` (lowercase, Admin-only): `configuracion`, `reportes` (placeholder previo, reemplazado).
- `['ADMIN', 'VENDEDOR']` (uppercase, ambos): `dashboard`, `stock`, `productos`, `ventas`.
- `['admin', 'vendedor']` (lowercase, ambos): `ventas/nueva`.

**Decisión**: NO unificar en Sprint 7 (scope/riesgo). Funciona porque `requireAuth` normaliza, pero la convención no está unificada. Queda para un sprint de housekeeping con el inventario ya hecho. `/reportes` usa el patrón del dashboard (`user.role === 'admin'`) para no introducir una quinta forma.

---

## 2026-05-22 · Venta → vendedor en reportes

**Por qué**: "Ventas por vendedor" resuelve el vendedor por `Venta.usuarioId` (campo directo del schema, canónico, siempre presente), set por `crearVenta` con el id del usuario logueado en el momento de la venta. No usamos `Venta.turnoId → Turno.userId` porque `turnoId` es `nullable` y `usuarioId` es el dato canónico de la venta.

**Caveat aceptado**: "Horas trabajadas por vendedor" sale de `Turno.userId`. En la operación normal de Felipa los dos coinciden (el usuario que abre el turno es el que registra las ventas de ese turno), pero si una venta se registra con un usuario distinto al dueño del turno, los dos reportes pueden no cruzar. Aceptado por improbable — 4 personas en mostrador, todas hacen todo, no hay turnos compartidos.

**Alternativas descartadas**:
- **Resolver vendedor por `Turno.userId`**: forzaría a tener turno asignado para contabilizar la venta. Ventas seedeadas sin turno romperían el reporte.
- **Tomar el primer movimiento de stock asociado a la venta**: redundante y frágil — el `usuarioId` de la venta ya es la verdad.

---

## 2026-05-22 · Timezone en dashboard y reportes: hora AR fija

**Por qué**: todos los cortes de día/mes y el bucketing por período se calculan en hora de Argentina (`America/Argentina/Buenos_Aires`, UTC−3 fijo, sin DST desde 2009), no en UTC ni en la TZ del runtime. Vercel corre UTC y Neon en São Paulo; filtrar "hoy" o "este mes" con la fecha del server metería las ventas nocturnas (21:00–23:59 hora AR) en el día equivocado.

**Implementación**: `lib/fecha.ts` con `rangoDiaAR`, `rangoMesAR`, `rangoEntreFechasAR` (para `/reportes`, recibe `YYYY-MM-DD` civiles) y `bucketDiaAR`/`bucketSemanaAR`/`bucketMesAR` para el agrupamiento. Construidos con `Intl.DateTimeFormat` (timezone explícito) + `Date.UTC` (que normaliza overflow), no con `Date.getMonth()` del runtime.

**Semana**: lunes a domingo. La clave del bucket es el lunes de esa semana en hora AR.

**Notas adicionales**:
- Las duraciones de turnos ("horas trabajadas") son resta de timestamps, timezone-independiente — no necesitan conversión.
- Un turno cuenta en "horas trabajadas" si su `cierreEn` cae dentro del rango (cuenta entero aunque haya abierto antes del rango).
- El CSV lleva BOM UTF-8 para que Excel en el Windows del local abra bien los acentos.

**Alternativas descartadas**:
- **Confiar en la TZ del runtime**: Vercel UTC y la PC local AR darían resultados distintos para los mismos datos.
- **Usar una librería tipo `date-fns-tz` o `luxon`**: agregar dependencia + bundle size por una operación que UTC−3 fijo + `Intl` resuelven en 30 líneas.

---
## 2026-05-22 · Unificación de naming de roles: canónico = enum `Rol` de Prisma

**Por qué**: cerrar la deuda auditada en Sprint 7 (4 convenciones en `requireAuth` sobre 16 rutas + comparaciones sueltas). La causa raíz no eran los strings sueltos sino una doble representación del rol con traducción en el medio: la DB guarda el enum `Rol` uppercase (`ADMIN`/`VENDEDOR`), pero la app consumía un tipo paralelo `Role = 'admin' | 'vendedor'` (`lib/auth/types.ts`) con helpers `rolToRole`/`roleToRol` y un `toLowerCase()` en el lector de sesión.

**Decisión**: canónico único = enum `Rol` de `@prisma/client`, uppercase, como `Rol.ADMIN` / `Rol.VENDEDOR` de punta a punta. `requireAuth` tipado a `Rol[]` (el compilador audita los call sites). Eliminados el tipo `Role`, los helpers de traducción y el `toLowerCase()` del borde. `SessionUser.role` renombrado a `SessionUser.rol` para alinear con la columna y el enum.

**Better Auth**: el additionalField `rol` queda declarado `type: 'string'` porque la librería no soporta enums de Prisma en additionalFields. El narrow `string → Rol` (con guard runtime) vive en un único punto, `getCurrentUser` (`lib/auth/session.ts`). No es drift de tipo en la DB: la columna está realmente tipada como enum (verificado en las migraciones); no hubo migración de datos —el lowercase era puramente un artefacto de la capa app.

**Alternativas descartadas**:
- **Canonizar en lowercase (union type de TS)**: más barato a corto plazo (sesión y UI ya eran lowercase) pero perpetúa la doble representación y la traducción del borde. El enum la elimina.
- **Renombrar la columna `rol` o el campo de Better Auth**: fuera de alcance, es coherencia de infra de librería (decisión del 2026-05-08). Solo se unificó el valor/casing y el tipo.

---
## 2026-05-22 · Sidebar responsive: drawer en mobile, fija en desktop

**Por qué**: la sidebar fija de 240px estrangulaba el viewport <1024px (inusable en celular <400px); los reportes (tablas anchas) eran los más afectados. Chocaba con la regla de responsive obligatorio.

**Decisión**: breakpoint en `lg` (1024px). Abajo de `lg` la sidebar fija se oculta (`hidden lg:flex`) y aparece un drawer off-canvas (`Sheet` de shadcn, reusa `@radix-ui/react-dialog` ya instalado) abierto por una hamburguesa en el Header (`lg:hidden`). De `lg` para arriba, idéntico a antes (cero cambio en desktop).

**Fuente única de navegación**: drawer y sidebar consumen el mismo `navGroupsForRole(rol)` de `lib/nav.ts` (ya tipado a `Rol`). Sin lista duplicada. El drawer cierra al navegar (`useEffect` sobre `usePathname`). A11y vía Radix + `SheetTitle` sr-only.

**Por qué `lg` y no `md`**: en tablet portrait (768px) la sidebar fija le robaba ancho a las tablas de reportes. Si en uso real molesta, bajar a `md` es cambiar una clase.

**Fuera de alcance**: el overflow horizontal de tablas anchas (`overflow-x-auto`) queda para un ajuste aparte.

---

## 2026-05-23 · Configuración del negocio: tabla singleton + parámetros cableados

**Por qué**: la pantalla `/configuracion` era el último placeholder del scaffold ("se implementa en Sprint 9"). Varios valores de negocio estaban hardcodeados y el dueño no podía tocarlos sin pedir un cambio de código.

**Modelo**: tabla `Configuracion` singleton (un row, id fijo) con datos del negocio (nombre, dirección, teléfono, CUIT), parámetros de venta (markupDefault, descuentoEstandar) y de stock/devoluciones (diasDevolucion, umbralStockBajo). Decimals para los porcentajes.

**get-or-create como única fuente de defaults**: `obtenerConfiguracion()` (`lib/configuracion/queries.ts`) autocrea el row con `CONFIGURACION_DEFAULTS` si no existe, envuelto en `cache()` de React. En prod alcanza con aplicar la migración —el row se autocrea en la primera lectura, no hay que seedear. El seed quedó reducido a llamar al helper.

**Parámetros cableados** (comportamiento idéntico al previo con los defaults):
- Markup: se mantiene como **multiplicador 2.15** (no se reinterpretó; la UI lo muestra como 115% con un helper que limpia el drift de floating point). El `MARKUP` del seed de productos queda determinista, no se cablea.
- Descuento estándar, días de devolución (en `crearDevolucion` **y** en `DetalleVentaModal`, que tenía un segundo hardcode), umbral de stock bajo (queries + helpers + componentes de display), y datos del negocio en el comprobante de WhatsApp.

**Patrón de cableado**: la config se lee en el borde (RSC / server actions) y se pasa como **prop** a los client components; los helpers puros (clasificación de stock, armado del comprobante) reciben los valores como parámetro, no leen la DB.

**Permisos**: `/configuracion` se abrió a `[ADMIN, VENDEDOR]` a nivel ruta para que la vendedora acceda a "Mi cuenta"; las cards del negocio se renderizan solo para Admin (a nivel HTML, no CSS) y el server action `actualizarConfiguracion` valida Admin independientemente.

**Cambio de password propia**: `auth.api.changePassword` (requiere la actual, `revokeOtherSessions: false`). Distinto del reset-by-admin del 2026-05-08 (hashPassword directo + revoca sesiones), porque el caso de uso es otro.

**Deuda anotada**: el get-or-create hace un upsert (escritura) por request (deduplicado por `cache()`). Para el sprint de optimización: pasarlo a buscar-y-crear-si-falta para que el caso normal sea solo lectura.

---

## 2026-05-23 · Optimización de performance — Fase 1 (geografía + percepción)

**Síntoma**: cada navegación a una pantalla nueva tardaba 6-10s; fluida una vez cargada.

**Diagnóstico** (preservado para retomar): tres causas sumadas — (1) las Serverless Functions corrían en iad1 (US-East) y Neon está en São Paulo → ~120ms por round-trip; (2) driver TCP clásico de Prisma (handshake completo por cold start); (3) cascadas de queries secuenciales en las pantallas pesadas (dashboard ~5-6 RTTs en serie con dos `ventasPorMetodoPago` idénticos; `/turno/cerrar` 5 RTTs con una `venta.findMany` duplicada; `/ventas/nueva` 4 RTTs con `getCurrentUser` duplicado). Además, cero `loading.tsx`.

**Fase 1 hecha** (commit `75054cb`): `vercel.json` con `regions: ["gru1"]` (misma región que Neon) → RTT de ~120ms a ~5-20ms; 4 `loading.tsx` con skeletons (grupo app + dashboard + turno/cerrar + ventas/nueva); `/health` ya hacía `SELECT 1`.

**Resultado**: la navegación entre pantallas bajó de 6-10s a menos de 2s solo con la Fase 1 —la geografía era el cuello principal. La primera carga del día conserva el cold start de Neon pero no molesta en uso. Se cierra el sprint en Fase 1; la Fase 2 (dedup de queries) se descarta por ahora: con <2s no justifica tocar el cálculo de turno/ventas. Cron keep-warm parqueado (cuenta creada, falta horario del local).

**Parqueado, para retomar si el uso real lo pide**:
- Keep-warm de Neon: cuenta de cron-job.org creada; falta el ping a `/health` cada 4 min en horario del local (pendiente confirmar horarios de apertura). Ataca la lentitud de la primera carga del día (scale-to-zero del free tier).
- Fase 2 (dedup de queries, ya diagnosticada): cachear `getCurrentUser`, sacar la doble `venta.findMany` en `/turno/cerrar`, una sola `ventasPorMetodoPago` en el dashboard, romper la cascada. Nota: con la región alineada cada RTT vale ~5ms, así que el impacto de esta fase es mucho menor que antes — evaluar si vale el riesgo, porque toca cálculo de turno/ventas (plata).
- Driver serverless de Neon (HTTP) en Prisma: última palanca para cold starts.

---

_(Próximas decisiones van acá abajo, en orden cronológico.)_
