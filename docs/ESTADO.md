# ESTADO — Sistema Felipa

Bitácora viva del proyecto. Se actualiza después de cada sesión de trabajo.
**Este es el primer archivo que se le pega a Claude al arrancar un chat nuevo.**

---

## Sprint actual

**Sprint 4 — Gestión de productos (P5)** completado el 2026-04-27. Próximo: **Sprint 5 — Control de stock por sucursal (P6)** o **Sprint 3 parte 2 — Auth.js real**.

## Tarea en curso

Ninguna. P5.2 cerrado y commiteado. Sprint 4 completo.

## Último avance

**P5.2 Alta y edición de productos completada (2026-04-27)**:

- Páginas `/productos/nuevo` y `/productos/[id]/editar`, ambas Admin-only (Vendedor → redirect a `/`).
- Server Actions: `crearProducto`, `editarProducto`, `desactivarProducto`, `reactivarProducto`, `crearCategoria`. Todas con `requireAuth(['ADMIN'])`, escrituras dentro de `prisma.$transaction`, `revalidatePath('/productos')` después de mutar.
- Validación con Zod: schemas compartidos cliente/servidor en `lib/productos/schemas.ts`. Validación de unicidad de código de barras pre-emptiva contra DB (no depende del unique constraint).
- Modelo de variantes en UI: toggle "Este producto tiene variantes". Si está apagado, se crea 1 variante única implícita (`nombre = "Única"`, sin atributos, sin override). Si está prendido, lista dinámica con add/remove + toggle "esta variante tiene precio propio" para override.
- Markup automático 115%: precio = costo × 2.15 al salir del campo costo (onBlur) y también al submitear desde cualquier vía (Enter, Ctrl+Enter, click en botón). No sobrescribe si el usuario ya cargó precio. Aplica también a variantes con override activo.
- Soft delete inteligente al editar: variantes que estaban en DB y desaparecieron del input se marcan `activa = false` si tienen ventas/movimientos asociados, se eliminan duro si no.
- Categoría inline: modal "Nueva categoría" desde el formulario, sin perder state del producto en curso. Categoría creada queda pre-seleccionada.
- "Guardar y cargar otro" persiste la categoría seleccionada entre cargas (URL searchParam).
- Atajo `Ctrl+Enter` desde cualquier campo dispara submit. Foco automático en "Nombre" al abrir.
- Banner amarillo en `/productos/[id]/editar` cuando el producto está inactivo. Botón "Reactivar" sin confirmación cuando está inactivo, "Desactivar" con confirm dialog cuando está activo.
- Mensajes de error claros: cuando un código de barras está duplicado contra otro producto, el banner dice qué producto ya lo usa. Inputs en rojo en las variantes con error.
- Sin nuevas deps de UI: modal, checkbox, textarea, dialog hechos a mano con Tailwind (consistente con P5.1). Única dep nueva: `zod`.
- Verificación end-to-end con Claude Preview MCP (browser real) cubrió: caso happy path, caso error de duplicado intra-producto (validación cliente), caso error de duplicado contra otro producto (server con banner), recarga de página post-creación inline de categoría, y persistencia entre tabs.
- Build (`npm run build`) y typecheck (`npx tsc --noEmit`) verdes. `/productos/nuevo` 196 B / 112 kB First Load. `/productos/[id]/editar` 1.03 kB.

**Bugs encontrados y corregidos durante verificación de P5.2** (vale la pena recordarlos para próximos sprints):
- `nuevaVarianteVacia` importada desde Client Component (`ProductoForm.tsx`) hacia Server Component (`page.tsx`) → fix: movida a `lib/productos/helpers.ts` neutral.
- Markup no aplicaba al submitear con Enter (`onBlur` no dispara) → fix: aplicar markup también al inicio de `handleSubmit` antes de la action.
- `<NuevaCategoriaModal>` renderizaba `<form>` dentro del `<form>` del producto → HTML inválido, parser colapsa formularios, click en "Crear categoría" disparaba submit del form externo → fix: modal envuelto en fragment fuera del form.

**Lección operativa**: build verde + typecheck verde NO es suficiente para validar UI con Server/Client Components. Los próximos prompts a Code van a incluir verificación end-to-end con browser real como criterio de aceptación obligatorio para flujos interactivos.

**P5.1 Listado completada (2026-04-27)** — server component con queries optimizadas, filtros vía URL searchParams, paginación custom, vista diferenciada por rol verificada a nivel HTML (commit anterior).

**Sprint 3 parte 1 completada (2026-04-27)** — schema, migración inicial, seed (commit `034ae69`).

**Sprint 2 completado (2026-04-27)** — scaffold con mock auth (commit `a461b02`).

**Sprint 1 — parcialmente avanzado**: cuestionario respondido + segunda ronda. **Pendiente**: tarde de observación in-situ en Felipa 1.

## Próxima tarea

Decisión a tomar entre:

- **Opción A — Sprint 5 (P6 Stock)**: ajustes manuales de stock con motivo, historial de movimientos, ingreso bulk de mercadería. Ya tenemos productos cargables; el siguiente eslabón natural en valor para el cliente.
- **Opción B — Sprint 3 parte 2 (Auth.js real)**: reemplazar el mock auth por Auth.js + bcrypt. Saca un riesgo de encima pero no agrega valor visible al cliente. Incluye revisar 5 vulnerabilidades `npm audit`.

Recomendación del tech lead: Opción A. El sistema empieza a sentirse usable cuando podés cargar producto + ajustar stock + vender, en ese orden. Auth real puede esperar a que el flujo principal esté completo.

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
- Catálogo actual: ~200 productos estimados, sin contar variantes. **No hay catálogo digital previo**, hay que cargar desde cero. Carga manual con la UX de P5.2 (atajos + "guardar y cargar otro" + categoría inline + autocompletado de markup).
- Variantes de producto (color, tamaño, presentación): frecuentes. Soportadas desde el MVP. Modelo: precio y costo a nivel **producto** (`precioBase` / `costoBase`) con override opcional a nivel **variante** (`precio` / `costo` nullable que sobrescriben).
- Métodos de pago: efectivo, transferencia, débito, crédito. Pagos mixtos sí (modelados en `Venta.metodosPago` como Json). Sin cuenta corriente.
- Descuento estándar: 10% por efectivo o transferencia (regla automática del sistema).
- Markup sugerido: 115% (al cargar costo, el sistema sugiere precio de venta). **Totalmente editable, sin tope**.
- Vendedor ve precio de venta en el listado de productos. Costo solo Admin (verificado a nivel HTML, no CSS).
- Roles del MVP: **Admin** (Felipa + Agustín) y **Vendedor** (Andrea + Gisela). Definidos como enum `Rol` en el schema.
- Auth en este momento: **mock provisorio basado en cookie**, conectado a DB. Se reemplaza por Auth.js real en Sprint 3 parte 2.
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