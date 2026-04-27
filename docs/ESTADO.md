# ESTADO — Sistema Felipa

Bitácora viva del proyecto. Se actualiza después de cada sesión de trabajo.
**Este es el primer archivo que se le pega a Claude al arrancar un chat nuevo.**

---

## Sprint actual

**Sprint 2 — Scaffold de pantallas** (completado el 2026-04-27, pendiente verificación visual de Agustín).

Próximo: **Sprint 3 — Schema de DB y autenticación**.

## Tarea en curso

Ninguna. Esperando que Agustín haga la primera pasada por las 10 pantallas placeholder verificando los criterios de aceptación. Cuando esté OK, commit y arrancamos Sprint 3.

## Último avance

**Sprint 2 completado (2026-04-27)** — scaffold de pantallas con mock auth:

- Estructura de rutas con route groups: `(public)/login`, `(app)/<10 pantallas>`, `/health` (movida de la home).
- Mock auth en `lib/auth/mock.ts` con cookie `felipa-mock-role`, helpers `getMockUser()` y `requireAuth(allowedRoles?)`.
- Layouts con Sidebar (items según rol) + Header (con role switcher dev-only y logout).
- Login placeholder con dos botones ("Entrar como Admin" / "Entrar como Vendedor").
- 10 pantallas placeholder con código `P*N*` visible y `requireAuth([...])` correcto por rol.
- Build verde, `tsc --noEmit` sin errores, 16 rutas generadas.
- Dependencias agregadas/restauradas: `@radix-ui/react-dropdown-menu`, `@radix-ui/react-separator`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@radix-ui/react-slot`, `tailwindcss-animate`.

**Sprint 1 — parcialmente avanzado (2026-04-25 a 2026-04-27)**:
- Cuestionario de relevamiento respondido por el hijo de Felipa.
- Decisiones grandes tomadas a partir del cuestionario (Felipa 2 fuera, AFIP fuera, variantes adentro, roles 2-en-vez-de-3) — todas en `DECISIONES.md`.
- Segunda ronda de preguntas hecha (sistema actual, variantes con precio compartido, lector de código). Respondida.
- **Pendiente Sprint 1**: tarde de observación in-situ en Felipa 1.

## Próxima tarea

**Sprint 3 — Schema de DB**: arrancar por las tablas de Producto y Variante (con `precioBase`/`costoBase` en producto y override opcional en variante). Esto destraba P5 Gestión de productos.

Auth.js real (segunda parte de Sprint 3) puede esperar a que P5 esté funcional con el mock — no es bloqueante.

## Bloqueos

Ninguno.

## Notas de contexto

- Stack: Next.js 14.2.35 (App Router) + TypeScript + Postgres 16 (Docker) + Prisma 6 + Tailwind 3 + shadcn/ui
- Tema: solo light (sin dark mode)
- Alcance inicial: MVP (Plan Base de la propuesta)
- Cliente: Felipa — confirmado. Felipa 1 (bazar en Santa Rosa, La Pampa) es el único alcance del MVP.
- Felipa 2: proyecto distinto (local de ropa King of the Kongo + acompañantes), apertura tentativa primavera 2026. **Fuera del alcance del MVP**, se evalúa por separado cuando llegue.
- Categoría AFIP del cliente: **Responsable Inscripto**. Tiene sistema de facturación propio (SSL Soft Gescom — ORREGO, versión `20251104-7023201`). **El MVP NO integra AFIP**, conviven en paralelo durante el primer tiempo. Camino post-MVP más probable: reemplazo total con AFIP nativo (no integración con Gescom).
- Volumen estimado: caja diaria promedio $280k, sábados buenos $800k, picos navideños hasta $1.5M.
- Equipo: 4 personas total (dueña + hijo + 2 empleadas) cubriendo Felipa 1 y Big Burger / Big Pizza. Todos hacen todo en mostrador, salvo remarcado de mercadería ingresante (solo dueña + hijo).
- Catálogo actual: ~200 productos estimados, sin contar variantes. **No hay catálogo digital previo**, hay que cargar desde cero.
- Variantes de producto (color, tamaño, presentación): frecuentes. Soportadas desde el MVP. Modelo: precio y costo a nivel **producto** con override opcional a nivel **variante** (muchas variantes comparten precio, ej: botellas térmicas de 5 colores que salen lo mismo).
- Métodos de pago: efectivo, transferencia, débito, crédito. Pagos mixtos sí. Sin cuenta corriente.
- Descuento estándar: 10% por efectivo o transferencia (regla automática del sistema).
- Markup estándar: 115% (con flexibilidad ±5pp). El sistema sugiere precio de venta al cargar costo.
- Roles del MVP: **Admin** (dueña + hijo) y **Vendedor** (empleadas). Definidos en `DECISIONES.md`.
- Auth en este momento: **mock provisorio basado en cookie** (Sprint 2). Se reemplaza por Auth.js en Sprint 3.
- Sin fecha objetivo de go-live.
- Repo: GitHub privado `sistema-felipa`, rama `main`.
- Propuesta comercial aprobada disponible como referencia (PDF de abril 2026).
- DB de desarrollo: contenedor `felipa-db`, credenciales en `.env` local (no commiteado).
- Hardware del local: 1 PC con Windows 10 viejo. **Lector de código de barras confirmado para compra antes del go-live**. Impresora de tickets pendiente de decisión.
- Internet en el local: estable, no se corta.

## Decisiones pendientes

- Librería de auth (Auth.js / NextAuth v5 es la candidata, se decide en Sprint 3).
- **Revisar 5 vulnerabilidades de `npm audit`** (1 moderate, 4 high) antes de meter Auth.js en Sprint 3.
- Estrategia de testing (definido parcialmente: manual durante desarrollo + Playwright en Sprint 8 para flujos críticos).
- Hosting productivo.
- Dominio.
- Estrategia de backups de la DB.
- Compra (o no) de impresora de tickets antes del go-live.

---

## Cómo usar este archivo

- Al cerrar una sesión: actualizar "Último avance", "Tarea en curso" y "Próxima tarea".
- Al abrir una sesión nueva: pegar el contenido completo en el primer mensaje del chat.
- Decisiones importantes **no van acá**, van a `DECISIONES.md`.
- El plan macro **no va acá**, va a `ROADMAP.md`.
- Ubicación en el repo: `docs/ESTADO.md` (junto con `DECISIONES.md` y `ROADMAP.md`).
