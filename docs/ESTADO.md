# ESTADO — Sistema Felipa

Bitácora viva del proyecto. Se actualiza después de cada sesión de trabajo.
**Este es el primer archivo que se le pega a Claude al arrancar un chat nuevo.**

---

## Sprint actual

**Sprint 5 — Control de stock por sucursal (P6)**. P6.1 (vista + ajustes individuales) y P6.2 (ingreso de mercadería bulk) completados el 2026-04-27. Próximo: **P6.3 — Historial completo de movimientos**.

## Tarea en curso

Ninguna. P6.2 cerrado y commiteado. Listo para arrancar P6.3.

## Último avance

**P6.2 Ingreso de mercadería bulk completada (2026-04-27)**:

- Pantalla `/stock/ingreso` (Admin only). Vendedor redirigido a `/`.
- Buscador unificado: tipear código de barras + Enter agrega la variante directamente (match exacto). Tipear nombre muestra dropdown con autocompletado (debounce 200ms, navegación con flechas, Enter para seleccionar, Escape para cerrar).
- Mismo código escaneado N veces incrementa cantidad de la línea existente (no duplica fila).
- Datos opcionales del ingreso: identificador (ej: "Remito #1234"), proveedor, observaciones. Se concatenan en el `motivo` de cada `MovimientoStock` creado.
- Una sola transacción atómica (`prisma.$transaction`) crea N filas en `MovimientoStock` con `tipo = INGRESO` y hace `upsert` de los `Stock`.
- Validación: variantes deben estar activas (cliente y servidor). Inactivas marcadas tachadas en dropdown y no agregables.
- UX: `Ctrl+Enter` confirma; foco vuelve al buscador después de cada ingreso; confirmación al salir con cambios sin guardar (`beforeunload` + confirm).
- Banner verde post-éxito con resumen ("Ingreso registrado: X líneas, Y unidades agregadas al stock"). Form se limpia.
- Verificación end-to-end con Claude Preview MCP: 12/12 tests pasados.
- Build (`npm run build`) y typecheck (`npx tsc --noEmit`) verdes. `/stock/ingreso` 5.53 kB / 112 kB First Load.
- Bug encontrado y corregido durante verificación: botón "Confirmar ingreso" inicialmente `disabled` cuando no había líneas, ocultaba el error del schema. Cambiado a `disabled={pending}` para que el error se muestre en el banner.

**P6.1 Vista de stock + ajustes individuales completada (2026-04-27)**:

- Pantalla `/stock` (Admin only). Tabla agrupada visualmente por producto con una fila por variante.
- Filtros vía URL: búsqueda por nombre, filtro por categoría, "solo con stock bajo" (≤ 3), "solo con stock negativo".
- Badges visuales: "Sin stock" (gris), "Bajo" (ámbar), "Negativo, revisar" (rojo).
- Paginación custom 30 filas por página.
- 4 tipos de ajuste manual desde modal: Rotura, Robo / pérdida, Conteo de inventario, Devolución de cliente.
- Conteo calcula delta automático contra stock actual. Si delta = 0 (stock ya coincide), no crea movimiento, mensaje informativo.
- Stock negativo permitido con confirm dialog ("Esto va a dejar el stock en -X. ¿Confirmás?"). No bloquear — la realidad del bazar diverge entre teórico y real, mejor aceptar el ajuste y que el negativo sea señal de "reconciliá".
- Modal de historial por variante: muestra los últimos 20 movimientos cronológicamente. Para `tipo = VENTA`, muestra el código corto de la venta como link (Sprint 6 lo va a tener funcional).
- `MovimientoStock.cantidad` se modela como **delta signed** (positivo si suma, negativo si resta). Facilita `SUM()` para stock acumulado.
- Server actions: `registrarAjuste` con Zod, transacción Prisma (1 INSERT + 1 UPDATE atómicos), `revalidatePath('/stock')`.
- Verificación end-to-end con Claude Preview MCP: 10/10 tests pasados.
- Bug menor encontrado y corregido durante verificación: filas tipo VENTA en historial duplicaban código corto (motivo del seed + columna). Suprimido motivo cuando hay `ventaCodigoCorto`.

**Sprint 4 (P5 Productos) completado (2026-04-27)** — listado, alta, edición con variantes y override de precio/costo, soft delete, modal de categoría inline, markup automático 115% (commits `006fd53` y previo).

**Sprint 3 parte 1 completada (2026-04-27)** — schema, migración inicial, seed (commit `034ae69`).

**Sprint 2 completado (2026-04-27)** — scaffold con mock auth (commit `a461b02`).

**Sprint 1 — parcialmente avanzado**: cuestionario respondido + segunda ronda. **Pendiente**: tarde de observación in-situ en Felipa 1.

## Próxima tarea

**P6.3 — Historial completo de movimientos**: pantalla `/stock/movimientos` (Admin only) con tabla cronológica de todos los `MovimientoStock`. Filtros por rango de fechas, tipo, variante, usuario, búsqueda en motivo. Cálculo de stock resultante por fila. Paginación 50 filas. Default últimos 30 días. Cierra Sprint 5 (P6 completo).

Después: **Sprint 6 — Ventas (P2 + P3)**. Es la pantalla más usada del sistema y la que destraba el go-live.

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
- Stock: modelado a nivel **variante** con `MovimientoStock.cantidad` como **delta signed**. `Stock.cantidad` es source of truth, cada ajuste dispara 1 INSERT en `MovimientoStock` + 1 UPDATE en `Stock` dentro de transacción Prisma.
- Variantes de producto (color, tamaño, presentación): frecuentes. Soportadas desde el MVP. Modelo: precio y costo a nivel **producto** (`precioBase` / `costoBase`) con override opcional a nivel **variante** (`precio` / `costo` nullable que sobrescriben).
- Métodos de pago: efectivo, transferencia, débito, crédito. Pagos mixtos sí (modelados en `Venta.metodosPago` como Json). Sin cuenta corriente.
- Descuento estándar: 10% por efectivo o transferencia (regla automática del sistema).
- Markup sugerido: 115% (al cargar costo, el sistema sugiere precio de venta). **Totalmente editable, sin tope**.
- Vendedor ve precio de venta en el listado de productos. Costo solo Admin (verificado a nivel HTML, no CSS).
- Roles del MVP: **Admin** (Felipa + Agustín) y **Vendedor** (Andrea + Gisela). Definidos como enum `Rol` en el schema.
- Auth en este momento: **mock provisorio basado en cookie**, conectado a DB. Se reemplaza por Auth.js real en Sprint 3 parte 2 (cerca del go-live, no es bloqueante para el resto del desarrollo).
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