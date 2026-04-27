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

**Por qué**: el scaffold de pantallas (Sprint 2) necesita protección de rutas por rol para ser realmente útil, pero Auth.js real es Sprint 3 e implica decisiones que dependen del schema completo (provider, sesión, tabla de usuarios). Implementar Auth.js ahora obliga a tomar decisiones a ciegas y mezcla dos sprints.

**Solución**: mock auth basado en cookie (`felipa-mock-role` con valor `admin` o `vendedor`), helpers `getMockUser()` y `requireAuth(allowedRoles?)` en `lib/auth/mock.ts`, y un role switcher visible solo en desarrollo (`process.env.NODE_ENV === 'development'`) en el header. El login es un placeholder con dos botones grandes ("Entrar como Admin" / "Entrar como Vendedor").

**Plan de migración**: en Sprint 3, reemplazar `getMockUser()` por `auth()` de Auth.js sin tocar las páginas (la firma del helper se mantiene). Las páginas siguen llamando `await requireAuth([...])` igual.

**Alternativas descartadas**:
- **Adelantar Auth.js a Sprint 2**: rompe el orden lógico de sprints y obliga a decidir provider/schema sin tener el schema completo.
- **Sin protección de rutas en el scaffold**: deja el scaffold cojo, no se prueba navegación real ni redirección por rol.

---

## 2026-04-27 · Markup sugerido editable libremente (sin tope de ±5pp)

**Por qué**: originalmente se anotó "115% con flexibilidad ±5pp" como regla del sistema, pero el cliente confirmó que en la realidad operativa suben o bajan el markup según contexto sin ceñirse a un tope rígido. Bloquear el campo o forzar validación a ±5pp sería entorpecer un proceso que hoy ya hacen libre.

**Comportamiento del sistema**:
- Al cargar un producto/variante, **al ingresar el costo, el sistema calcula y sugiere el precio de venta** con markup 115% (`precio = costo * 2.15`).
- El campo de precio queda **totalmente editable** sin tope ni validación de rango. El Admin escribe lo que quiere.
- Si el Admin no quiere usar la sugerencia, puede ignorarla o sobrescribirla sin pasos extra.

**Implicancia en UX**: el markup 115% es ayuda visual, no reglas de negocio. No hay alertas "el precio difiere más del 5% de lo sugerido". El Admin sabe lo que hace.

**Alternativas descartadas**:
- **Tope ±5pp con validación bloqueante**: entorpece el flujo real del cliente.
- **Tope ±5pp con warning suave**: agrega ruido visual sin valor — el Admin ya sabe cuándo se aparta.
- **Sin sugerencia automática del sistema**: pierde una ayuda barata para el caso común (115%).

---

## 2026-04-27 · Importación bulk Excel/CSV queda fuera del MVP

**Por qué**: al evaluar el alcance de P5 Gestión de productos, la importación CSV/Excel apareció como un sub-feature pesado: parseo con encoding (UTF-8 vs Latin-1), mapeo de columnas, modelado de variantes en filas/columnas, validaciones, manejo de errores, UX de preview, auto-creación de categorías. Implementarla bien es un sprint chico en sí mismo.

**Por el lado del cliente**: no hay catálogo digital previo en ningún formato. El relevamiento de los ~200 productos va a ocurrir en simultáneo con el inventario inicial físico de Sprint 8 — hay que tocar producto por producto sí o sí, contando físicamente. Una buena UX de carga manual con creación de categorías inline, atajos de teclado y autocompletado carga 200 productos en una tarde con menos fricción que armar primero un Excel ordenado para importar.

**Plan de evolución**: si post-go-live aparece un caso real (ej: actualización masiva de precios al cambiar lista de proveedor, o integración con sistema externo que exporta Excel), se evalúa y cotiza por separado.

**Alternativas descartadas**:
- **Importación bulk en MVP**: agrega ~1 sprint de complejidad sin un caso de uso inmediato real. El cliente cargaría manual igual durante el inventario inicial.
- **Importación bulk simplificada (solo nombre + precio, sin variantes)**: media solución que igual requiere parseo y validaciones, y deja afuera lo más complejo (variantes) que es justo donde el bulk ahorraría más.

---

_(Próximas decisiones van acá abajo, en orden cronológico.)_
