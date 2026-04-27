# ESTADO — Sistema Felipa

Bitácora viva del proyecto. Se actualiza después de cada sesión de trabajo.
**Este es el primer archivo que se le pega a Claude al arrancar un chat nuevo.**

---

## Sprint actual

**Sprint 3 — Schema de DB y autenticación** (parte 1 completada el 2026-04-27).

Próximo: **Sprint 4 — Gestión de productos (P5)**. Sprint 3 parte 2 (Auth.js real) puede esperar — corre en paralelo o después de P5.

## Tarea en curso

Ninguna. Sprint 3 parte 1 cerrado y commiteado, listo para arrancar P5.

## Último avance

**Sprint 3 parte 1 completada (2026-04-27)** — schema, migración inicial y seed:

- Schema Prisma con **9 modelos**: `Sucursal`, `Categoria`, `Producto`, `Variante`, `Stock`, `Usuario`, `Venta`, `ItemVenta`, `MovimientoStock`. `HealthCheck` preservado.
- Enums: `Rol` (ADMIN / VENDEDOR), `TipoMovimiento` (INGRESO / VENTA / AJUSTE_ROTURA / AJUSTE_ROBO / AJUSTE_CONTEO / DEVOLUCION).
- Migración `20260427223721_initial_schema` aplicada limpia.
- Decimal(12,2) en todo lo monetario. Herencia de precio/costo producto → variante con override opcional.
- Helpers en `lib/db/`:
  - `index.ts` — singleton Prisma hot-reload-safe.
  - `precio.ts` — `precioEfectivo()` / `costoEfectivo()` retornan `Prisma.Decimal`.
  - `codigoVenta.ts` — `generarCodigoVenta(sucursalId)` con formato `F1-DDMM-NNN`, correlativo por día y sucursal.
- Mock auth conectado a DB sin romper su firma pública. `getMockUser()` ahora resuelve el primer `Usuario` activo por rol. `requireAuth()` acepta strings minúsculas o el enum.
- Seed idempotente con datos realistas de bazar: 1 sucursal (Felipa 1), 4 usuarios (Felipa, Agustín, Andrea, Gisela), 6 categorías, 12 productos, 28 variantes (mix con/sin variantes y con/sin override de precio), 28 stocks, 1 venta de ejemplo (`F1-2704-001`) con 2 items.
- Verificación: `prisma migrate dev` ✓, `db seed` ✓ (idempotente, corre dos veces clean), `tsc --noEmit` ✓, `npm run build` ✓ (16/16 páginas).
- 10 páginas placeholder no se modificaron — la firma pública del mock auth se mantuvo intacta.

**Sprint 2 completado (2026-04-27)** — scaffold de pantallas con mock auth (commit `a461b02`).

**Sprint 1 — parcialmente avanzado**: cuestionario respondido + segunda ronda. **Pendiente**: tarde de observación in-situ en Felipa 1.

## Próxima tarea

**Sprint 4 — Gestión de productos (P5)**: CRUD completo de productos con código de barras, variantes y override de precio/costo. Importación bulk desde Excel. Es la siguiente pantalla en valor concreto para el cliente y la base para que Sprint 5 (stock) y Sprint 6 (ventas) puedan operar contra datos reales.

## Bloqueos

Ninguno.

## Notas de contexto

- Stack: Next.js 14.2.35 (App Router) + TypeScript + Postgres 16 (Docker) + Prisma 6 + Tailwind 3 + shadcn/ui.
- Tema: solo light (sin dark mode).
- Alcance inicial: MVP (Plan Base de la propuesta).
- Cliente: Felipa — confirmado. Felipa 1 (bazar en Santa Rosa, La Pampa) es el único alcance del MVP.
- Felipa 2: proyecto distinto (local de ropa King of the Kongo + acompañantes), apertura tentativa primavera 2026. **Fuera del alcance del MVP**, se evalúa por separado cuando llegue.
- Categoría AFIP del cliente: **Responsable Inscripto**. Tiene sistema de facturación propio (SSL Soft Gescom — ORREGO, versión `20251104-7023201`). **El MVP NO integra AFIP**, conviven en paralelo durante el primer tiempo. Camino post-MVP más probable: reemplazo total con AFIP nativo (no integración con Gescom).
- Volumen estimado: caja diaria promedio $280k, sábados buenos $800k, picos navideños hasta $1.5M.
- Equipo: 4 personas total (dueña + hijo + 2 empleadas) cubriendo Felipa 1 y Big Burger / Big Pizza. Todos hacen todo en mostrador, salvo remarcado de mercadería ingresante (solo dueña + hijo).
- Catálogo actual: ~200 productos estimados, sin contar variantes. **No hay catálogo digital previo**, hay que cargar desde cero.
- Variantes de producto (color, tamaño, presentación): frecuentes. Soportadas desde el MVP. Modelo: precio y costo a nivel **producto** (`precioBase` / `costoBase`) con override opcional a nivel **variante** (`precio` / `costo` nullable que sobrescriben).
- Métodos de pago: efectivo, transferencia, débito, crédito. Pagos mixtos sí (modelados en `Venta.metodosPago` como Json). Sin cuenta corriente.
- Descuento estándar: 10% por efectivo o transferencia (regla automática del sistema).
- Markup estándar: 115% (con flexibilidad ±5pp). El sistema sugiere precio de venta al cargar costo.
- Roles del MVP: **Admin** (Felipa + Agustín) y **Vendedor** (Andrea + Gisela). Definidos como enum `Rol` en el schema.
- Auth en este momento: **mock provisorio basado en cookie**, ahora conectado a DB. Se reemplaza por Auth.js real en Sprint 3 parte 2.
- Sin fecha objetivo de go-live.
- Repo: GitHub privado `sistema-felipa`, rama `main`.
- Propuesta comercial aprobada disponible como referencia (PDF de abril 2026).
- DB de desarrollo: contenedor `felipa-db`, credenciales en `.env` local (no commiteado).
- Hardware del local: 1 PC con Windows 10 viejo. **Lector de código de barras confirmado para compra antes del go-live**. Impresora de tickets pendiente de decisión.
- Internet en el local: estable, no se corta.

## Decisiones pendientes

- Librería de auth (Auth.js / NextAuth v5 es la candidata, se decide en Sprint 3 parte 2).
- **Revisar 5 vulnerabilidades de `npm audit`** (1 moderate, 4 high) antes de meter Auth.js.
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
