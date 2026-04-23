# Sistema Felipa

Plataforma web de gestión de stock y ventas para las dos sucursales del bazar Felipa (Argentina).

## Stack técnico

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS v3** — se usa v3 porque `shadcn/ui` está más estable con la v3 que con la v4
- **shadcn/ui** — tema light-only, color base `neutral`
- **PostgreSQL 16** (en Docker, alpine)
- **Prisma** como ORM
- **ESLint** + **Prettier** (con plugin de Tailwind para ordenar clases)

UI en español (Argentina). Código, variables y commits en inglés.

## Requisitos previos

- Node.js 20 LTS o superior
- Docker Desktop (o Docker Engine + Compose)
- Git

## Setup desde cero

```bash
git clone <repo-url> sistema-felipa
cd sistema-felipa

npm install

cp .env.example .env

docker compose up -d

npx prisma migrate dev

npm run dev
```

La app queda en [http://localhost:3000](http://localhost:3000). La home muestra el título, un indicador **DB OK** y los componentes de shadcn renderizando.

## Comandos útiles

| Acción                          | Comando                           |
| ------------------------------- | --------------------------------- |
| Levantar Postgres               | `docker compose up -d`            |
| Parar Postgres (conserva datos) | `docker compose down`             |
| Resetear DB (borra el volumen)  | `docker compose down -v`          |
| Abrir Prisma Studio             | `npx prisma studio`               |
| Crear nueva migración           | `npx prisma migrate dev --name X` |
| Generar cliente de Prisma       | `npx prisma generate`             |
| Linter                          | `npm run lint`                    |
| Formatear con Prettier          | `npx prettier --write .`          |
| Build de producción             | `npm run build`                   |

## Estructura de carpetas

```
sistema-felipa/
├── app/                  Rutas (App Router) + layout + globals.css
├── components/ui/        Componentes de shadcn (button, card, ...)
├── lib/
│   ├── prisma.ts         Cliente singleton de Prisma
│   └── utils.ts          Helper cn() de shadcn
├── prisma/
│   ├── schema.prisma     Modelo de datos
│   └── migrations/       Migraciones versionadas
├── docker-compose.yml    Postgres 16 en container `felipa-db`
└── .env.example          Plantilla de variables de entorno
```

## Notas

- **Auth.js** se integra en Sprint 3, no ahora.
- **Dark mode**: el MVP es solo light, no hay clase `dark` configurada.
- El puerto de Postgres es **5433** (no el default 5432) para no chocar con otras instancias locales.
