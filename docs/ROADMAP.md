# ROADMAP — Sistema Felipa

Plan macro del proyecto, organizado en sprints. Se actualiza cuando cambia el alcance o la prioridad (no en cada tarea — eso va en `ESTADO.md`).

## Visión general

Construir un sistema web de gestión de stock y ventas para Felipa 1 (bazar en Santa Rosa, La Pampa). Arrancar con MVP funcional (Plan Base) y escalar iterativamente hacia Plan Intermedio según validación de uso real.

**Principio rector**: _"Empezar simple es empezar bien"_ (sección 8 de la propuesta). Entregar algo usable antes que algo completo.

---

## Sprint 0 — Setup técnico ✅ (2026-04-24)

**Objetivo**: dejar el proyecto arrancando en local con toda la infraestructura base lista.

**Entregables**:
- Repo Next.js 14 + TypeScript inicializado
- Tailwind configurado
- Prisma conectado a Postgres local
- Estructura de carpetas acordada
- Convenciones de código (ESLint, Prettier)
- README del proyecto con instrucciones de setup
- `.env.example` con variables necesarias

**Criterio de "listo"**: `npm run dev` levanta el proyecto en localhost, Prisma se conecta a la DB, una página de ejemplo se renderiza. **Cumplido**.

---

## Sprint 1 — Relevamiento y análisis (Etapa 1 de propuesta) — en curso

**Objetivo**: entender en detalle cómo opera hoy Felipa para no construir sobre supuestos.

**Entregables**:
- [x] Cuestionario de relevamiento respondido por el cliente (vía hijo de la dueña).
- [x] Decisiones grandes documentadas en `DECISIONES.md` (alcance Felipa 2, AFIP, variantes, roles).
- [x] Segunda ronda de preguntas (sistema actual, modelo de variantes, hardware) — respondida.
- [ ] **Tarde de observación in-situ en Felipa 1** — pendiente.
- [ ] Catálogo inicial de productos (parcial) en formato importable — se va armando junto con el inventario inicial físico de Sprint 8.

**Criterio de "listo"**: contexto operativo del local entendido al nivel necesario para no construir sobre supuestos. **Doc de requerimientos formal firmado por el cliente fue descartado** — el cliente confía en las decisiones técnicas y la documentación viva (`ESTADO.md` + `DECISIONES.md`) cubre la traza necesaria.

**Duración estimada original**: 2-3 semanas. **Real**: Sprint 1 corre en paralelo con Sprint 2+ porque la observación in-situ no es bloqueante para arrancar el código.

---

## Sprint 2 — Scaffold de pantallas ✅ (2026-04-27)

**Objetivo**: dejar la estructura completa del sistema en código real, con navegación y protección de rutas, sin lógica de negocio.

**Cambio respecto al ROADMAP original**: el plan original era "wireframes en Figma + flujo navegable". Lo reemplazamos por scaffold directo en código (HTML estático con shadcn ya instalado) para evitar trabajo duplicado de diseñar en Figma y transcribir después. Ver `DECISIONES.md` (2026-04-27).

**Entregables**:
- Estructura de rutas con route groups: `(public)/login`, `(app)/<10 pantallas>`, `/health`.
- Mock auth provisorio (cookie-based) en `lib/auth/mock.ts`. Reemplazado por Auth.js en Sprint 3.
- Layouts con Sidebar (items según rol) + Header con role switcher dev-only y logout.
- Login placeholder con dos botones para entrar como Admin o Vendedor.
- 10 pantallas placeholder (P1–P10) con `requireAuth([...])` y código visible.
- Build verde, `tsc --noEmit` sin errores.

**Criterio de "listo"**: `npm run dev` levanta sin warnings, los 10 criterios de aceptación del prompt original pasan en navegador. **Pendiente verificación manual de Agustín**.

---

## Sprint 3 — Schema de DB y autenticación

**Objetivo**: armar los cimientos del backend.

**Entregables**:
- Schema Prisma con las tablas del MVP (Producto, Variante, Stock, Venta, ItemVenta, Usuario, Sucursal).
- Producto con `precioBase` y `costoBase`. Variante con `precio` y `costo` opcionales (override). Stock y venta a nivel **variante**.
- Migraciones corriendo.
- Seed inicial con datos realistas de bazar (no placeholders genéricos): aromatizantes, marroquinería, juguetes, accesorios, acero quirúrgico, belleza personal.
- Sistema de login real con Auth.js / NextAuth v5, reemplazando el mock.
- Roles: **Admin y Vendedor** (no tres roles).
- Middleware de protección de rutas (la firma de `requireAuth()` se mantiene).
- Revisión y resolución de las 5 vulnerabilidades de `npm audit` antes de instalar Auth.js.

**Criterio de "listo"**: puedo loguearme con un Admin y un Vendedor reales contra la DB, y cada uno ve solo lo que le corresponde.

**Duración estimada**: 2 semanas.

**Posible fragmentación**: la parte de schema (tablas + seed) puede arrancar antes que la parte de Auth.js. P5 Gestión de productos puede empezar a implementarse contra la DB usando el mock auth todavía vigente, mientras Auth.js se hace en paralelo.

---

## Sprint 4 — Gestión de productos (P5)

**Objetivo**: CRUD completo de productos con código de barras y variantes.

**Entregables**:
- Pantalla de listado con filtros (categoría, nombre, código).
- Alta/edición/baja de productos.
- Código de barras editable, lectura con lector USB (que emula teclado).
- Categorías y subcategorías.
- Precio de costo y venta con cálculo de margen sugerido (115% por defecto).
- Importación bulk desde Excel/CSV para carga inicial del catálogo.
- Soporte de variantes (color, tamaño, presentación) con código de barras propio por variante.
- Modelo de precio/costo: hereda del producto por default; override por variante con toggle "esta variante tiene precio propio".
- UX simple para productos sin variantes (variante única implícita, no se ve).

**Criterio de "listo"**: Agustín puede cargar el catálogo real de Felipa en menos de 1 día.

**Duración estimada**: 2 semanas.

---

## Sprint 5 — Control de stock por sucursal (P6)

**Objetivo**: stock real, a nivel variante.

**Entregables**:
- Stock individual por variante.
- Ajustes manuales con motivo obligatorio (rotura, robo, conteo, ingreso).
- Historial de movimientos.
- Modo bulk para ingreso de mercadería (cargar factura de proveedor y ajustar varias líneas de una).
- _(Diferido al upgrade a Intermedio)_: alertas de stock bajo, transferencias entre sucursales (no aplica todavía por ser mono-sucursal).

**Criterio de "listo"**: al registrar una venta, el stock de la variante baja automáticamente.

**Duración estimada**: 2 semanas.

---

## Sprint 6 — Registro de ventas (P2 + P3)

**Objetivo**: el flujo más usado del sistema funcionando fluido.

**Entregables**:
- Pantalla de nueva venta con búsqueda por código/nombre.
- Selección de variante cuando el producto tiene varias.
- Carrito con múltiples productos.
- Métodos de pago: Visa, Mastercard, Maestro, Transferencia, Efectivo.
- Pagos mixtos (efectivo + tarjeta).
- Descuento automático del 10% al elegir efectivo o transferencia.
- ID corto de venta (ej: `F1-2604-127`).
- Comprobante por WhatsApp opcional (botón para enviar al cliente).
- Búsqueda de venta por ID para devoluciones (≤30 días).
- Historial de ventas (P3) con filtros por fecha, método de pago, vendedor.

**NO incluye en el MVP**:
- Integración con AFIP (queda en sistema actual del cliente — SSL Soft Gescom).
- Impresión de tickets físicos (se evalúa si el cliente compra impresora antes del go-live).

**Criterio de "listo"**: una venta promedio se registra en menos de 30 segundos y el cliente puede identificar esa venta si vuelve a devolver dentro de 30 días.

**Duración estimada**: 2-3 semanas.

---

## Sprint 7 — Reportes básicos (P7 + P8)

**Objetivo**: dar al dueño información útil del negocio.

**Entregables (Plan Base)**:
- Dashboard (P7) con caja del día, productos más vendidos del mes, ventas por método de pago, alertas básicas.
- Reportes (P8): ventas totales por día/semana/mes, productos más vendidos, ventas por método de pago, ventas por vendedor.
- Exportación a CSV.

**Diferido al upgrade a Intermedio**:
- Gráficos interactivos avanzados.
- Comparativa entre sucursales (no aplica mono-sucursal).
- Exportación a Excel con formato.
- Alertas automáticas de stock bajo.

**Duración estimada**: 2 semanas.

---

## Sprint 8 — Testing, implementación y capacitación (Etapa 4 de propuesta)

**Objetivo**: que el sistema funcione en el local y el equipo lo use bien.

**Entregables**:
- Testing manual exhaustivo de flujos críticos.
- Playwright para los 3-4 flujos más críticos (login, nueva venta, baja de stock).
- Deploy a servidor productivo.
- Carga completa del catálogo real.
- **Inventario inicial físico** asistido: contar todo el local, cargar al sistema. Estimar 1-2 días con todo el equipo.
- Verificación de hardware: PC del local con Chrome/Edge actualizado, lector de código de barras conectado y probado, impresora de tickets (si se compró) configurada.
- Capacitación al equipo de Felipa (admin + vendedoras).
- Manual de usuario (PDF corto con capturas).
- Período de acompañamiento de 1-2 semanas.
- Capacitación con énfasis en doble registro (sistema nuevo + facturación AFIP existente en SSL Soft Gescom) hasta integración futura.

**Criterio de "listo"**: el equipo de Felipa opera el sistema sin ayuda de Agustín durante 1 semana completa.

**Duración estimada**: 2-3 semanas.

---

## Evolución post-MVP (Etapa 5 de propuesta)

Features que quedan para después del go-live, priorizadas según uso real:

- **Reemplazo total del sistema de facturación actual** (SSL Soft Gescom) con integración AFIP nativa vía Web Service o wrapper (TusFacturas / iFactura / Facturante). Sin esto el doble registro persiste.
- Historial de precios.
- Alertas de stock bajo automáticas.
- Dashboard con gráficos avanzados.
- Exportación a Excel con formato.
- Preparación para e-commerce.
- Evaluación: extender este sistema a Felipa 2 (local de ropa) o arrancar uno nuevo cuando abra.

Cada una se evalúa y cotiza por separado. No se promete nada en el MVP.

---

## Tareas transversales pendientes

- [x] Migrar repo de local a GitHub privado ✅ 2026-04-24
- [ ] Revisar 5 vulnerabilidades `npm audit` (1 moderate, 4 high) antes de Sprint 3 / Auth.js
- [ ] Tarde de observación in-situ en Felipa 1
- [ ] Definir estrategia de backups de la DB
- [ ] Definir hosting productivo
- [ ] Definir dominio
- [ ] Definir política de actualizaciones post-entrega
- [ ] Decisión del cliente sobre compra de impresora de tickets
