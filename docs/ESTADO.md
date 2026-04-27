# ESTADO — Sistema Felipa

Bitácora viva del proyecto. Se actualiza después de cada sesión de trabajo.
**Este es el primer archivo que se le pega a Claude al arrancar un chat nuevo.**

---

## Sprint actual

**Sprint 4 — Gestión de productos (P5)**. Parte 1 (P5.1 listado) completada el 2026-04-27. Próximo: **P5.2 — Alta y edición con variantes**.

## Tarea en curso

Ninguna. P5.1 cerrado y commiteado. Listo para arrancar P5.2.

## Último avance

**P5.1 Listado de productos completada (2026-04-27)**:

- Pantalla `/productos` reemplaza el placeholder. Server Component con queries directas a Prisma (1 `findMany` con `select` anidado + `_count` + `aggregate` para stock — sin N+1).
- Filtros via URL searchParams: búsqueda por nombre / código de barras (debounce 300ms en cliente) y filtro por categoría.
- Paginación custom (Anterior / Siguiente + "Página X de Y" + "Mostrando X–Y de Z"). 20 por página. Redirect a última página si la solicitada está fuera de rango.
- Vista diferenciada por rol:
  - **Admin**: 7 columnas (Nombre, Categoría, Variantes, Precio, Costo, Stock, Acciones). Botón "Editar" por fila + botón "Nuevo producto" arriba.
  - **Vendedor**: 5 columnas (Nombre, Categoría, Variantes, Precio, Stock). Sin costo ni acciones.
  - Diferencial verificado a nivel HTML (no CSS hidden) por curl + grep.
- Indicador visual cuando un producto tiene variantes con override de precio/costo (asterisco con tooltip implícito).
- Estado vacío diferenciado: "no hay productos" (con CTA "Cargar el primero" para Admin) vs "filtros sin resultado" (con botón "Limpiar filtros").
- Productos inactivos se muestran tachados con badge "Inactivo".
- Componentes shadcn agregados: `table`, `input`, `badge`. Para el filtro de categoría se usó `<select>` nativo estilizado para evitar instalar `@radix-ui/react-select` y no romper deps como en Sprint 2.
- Verificación: `npx tsc --noEmit` ✓, `npm run build` ✓ (16/16 páginas, `/productos` 2.04 kB / 108 kB First Load), render real con curl validó admin/vendedor y los filtros.
- Solo se modificó `app/(app)/productos/page.tsx`. Las otras 9 pantallas, `lib/auth/`, `lib/db/` y `prisma/` no se tocaron. Sin nuevas deps en `package.json`.

**Sprint 3 parte 1 completada (2026-04-27)** — schema, migración inicial, seed (commit `034ae69`).

**Sprint 2 completado (2026-04-27)** — scaffold con mock auth (commit `a461b02`).

**Sprint 1 — parcialmente avanzado**: cuestionario respondido + segunda ronda. **Pendiente**: tarde de observación in-situ en Felipa 1.

## Próxima tarea

**P5.2 — Alta y edición con variantes**:

- Páginas `/productos/nuevo` y `/productos/[id]/editar` (que hoy dan 404).
- Crear categoría inline desde el formulario de producto (sin salir del flujo).
- Variantes: agregar / quitar / editar dinámicamente. Toggle "esta variante tiene precio propio" para activar override de precio/costo.
- Markup sugerido al cargar costo: precio = costo × 2.15. Campo totalmente editable, sin tope.
- Soft delete (botón "Desactivar" → setea `activo = false`).
- UX para cargar 200 productos a mano: atajos de teclado, "guardar y cargar otro", autocompletado de categorías existentes.

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
- Markup sugerido: 115% (al cargar costo, el sistema sugiere precio de venta). **Totalmente editable, sin tope** — el Admin puede subir o bajar sin restricción ni warnings.
- Vendedor ve precio de venta en el listado de productos. Costo solo Admin (verificado a nivel HTML, no CSS).
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
