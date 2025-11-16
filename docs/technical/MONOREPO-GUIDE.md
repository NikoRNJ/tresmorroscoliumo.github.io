# Guía Técnica del Monorepo · Tres Morros

Este documento sirve como **molde completo** para operar y escalar la aplicación de reservas construida con Next.js dentro de un monorepo pnpm. Resume la arquitectura, convenciones, dependencias críticas y flujos de trabajo recomendados.

---

## 1. Visión general

- **Objetivo**: mantener el sitio actual sin regresiones, pero estructurado para crecer hacia múltiples apps/servicios.
- **Monorepo** con pnpm workspaces + Turborepo.
- **Separación lógica**:
  - `apps/web`: interfaz pública + API Routes.
  - `packages/core`: lógica de negocio, integraciones y tipos.
  - `packages/ui`: componentes visuales reutilizables.
  - `packages/database`: definiciones SQL, seeds y migraciones.

---

## 2. Estructura de carpetas (detallada)

```
.
├── apps/
│   └── web/
│       ├── app/                 # Rutas App Router (publico + admin + API)
│       ├── public/              # Assets estáticos
│       ├── globals.css          # Estilos globales
│       ├── package.json         # Dependencias exclusivas de la app
│       ├── next.config.mjs      # Config basada en Flow + CSP
│       └── tsconfig.json        # Alias locales + referencia a paquetes
├── packages/
│   ├── core/
│   │   ├── src/lib/             # Auth, Flow, Supabase, email, pricing, hooks
│   │   ├── src/types/           # Tipos compartidos (DB, booking, email, flow)
│   │   └── package.json
│   ├── ui/
│   │   ├── src/booking/         # Wizard, Calendar, Sidebar, Form, etc.
│   │   ├── src/cabin/           # Secciones públicas (cards, hero, gallery)
│   │   ├── src/ui/              # Botón, Card, Container, layout
│   │   └── package.json
│   └── database/
│       ├── migrations/
│       ├── supabase-schema.sql
│       └── package.json         # Describe artefactos empaquetables
├── docs/                        # Manuales técnicos y business
├── Documentacion/               # Archivo histórico iterativo
├── tests/                       # Unitarios con Vitest
├── tests-e2e-no-server/         # Flujo end-to-end sin levantar backend aparte
├── turbo.json                   # Pipeline de tareas
├── pnpm-workspace.yaml          # Declaración de workspaces
└── tsconfig.base.json           # Opciones TypeScript compartidas
```

---

## 3. Workspaces y dependencias

| Workspace | Scripts Clave | Dependencias relevantes |
| --- | --- | --- |
| `@tresmorros/web` | `dev`, `build`, `start`, `lint` | `next`, `react`, `react-dom`, `zod`, `lucide-react` |
| `@tresmorros/core` | (biblioteca, sin scripts) | `@supabase/supabase-js`, `@sendgrid/mail`, `date-fns`, `zod`, `tailwind-merge`, `clsx` |
| `@tresmorros/ui` | (biblioteca, sin scripts) | `react-hook-form`, `@hookform/resolvers`, `react-day-picker`, `lucide-react`, `date-fns` |
| `@tresmorros/database` | (artefactos SQL) | — |

> `packages/ui` y `apps/web` dependen implícitamente de `packages/core` mediante los alias TypeScript (`@core/*`, `@/lib/*`). Si se publica la librería, basta con apuntar a `@tresmorros/core` gracias al campo `exports`.

---

## 4. Convenciones técnicas

- **Idioma del código**: TypeScript estricto (`strict: true`).
- **Imports**:
  - `@/` → raíz de `apps/web` para mantener compatibilidad.
  - `@core/*` → `packages/core/src/*` (definido en cada `tsconfig`).
  - `@ui/*` → `packages/ui/src/*` (para ampliar reutilización).
- **Estilos**: Tailwind CSS + utilidad `cn` ubicada en `packages/core/src/lib/utils/cn.ts`.
- **Componentes cliente**: marcar `‘use client’` explícitamente (ya migrado).
- **Naming**: carpetas en minúsculas, archivos PascalCase para componentes, camelCase para helpers.
- **Rutas API**: continúan en `apps/web/app/api/...` para no alterar despliegues.

---

## 5. Flujo de desarrollo recomendado

1. **Instalar**: `pnpm install`
2. **Levantar servidor**: `pnpm dev`
3. **Trabajar en paquetes**:
   - Si modificas `packages/core` o `packages/ui`, no se requiere build manual: Next los transpila gracias a `transpilePackages`.
4. **Lint**: `pnpm lint` (usa `next lint`).
5. **Tests unitarios**: `pnpm test`
6. **Tests E2E**: `pnpm test:e2e` (Automatiza `start-server-and-test`).  
   - Antes de correrlo en CI se recomienda `pnpm build && pnpm start` en otra terminal.
7. **Commits**: agrupar cambios por paquete; usar `changeset` o convención `feat(pkg): ...` si se habilita en el futuro.

---

## 6. Entorno y variables

| Variable | Uso | Paquete |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL pública | core / web |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | core / web |
| `SUPABASE_SERVICE_ROLE_KEY` | Cliente admin (solo servidor) | core |
| `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_BASE_URL` | Flow API real | core |
| `FLOW_FORCE_MOCK` | `"true"` evita llamadas reales a Flow (recomendado para dev/e2e) | core |
| `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` | Envío de correos | core |
| `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | Panel admin | core |
| `PUBLIC_EXTERNAL_URL`, `NEXT_PUBLIC_SITE_URL` | Links absolutos en correos / Flow | core / web |

> Mantén los secretos fuera del repo. Para CI se recomienda inyectarlos como variables de entorno o usar un proveedor de secretos (Vercel, Doppler, etc.).  
> **Importante:** Next.js sólo carga `.env*` que estén dentro de `apps/web`. Copia tu `.env.local` a esa carpeta cada vez que lo actualices en la raíz (o mantenlo directamente allí) para evitar errores como `Missing Supabase environment variables`.

---

## 7. Integraciones clave

- **Supabase**:
  - `packages/core/src/lib/supabase/client.ts` → consumo desde cliente.
  - `packages/core/src/lib/supabase/server.ts` → uso para API Routes / Server Actions.
  - `packages/core/src/lib/data/cabins.ts` usa `React.cache` para memoizar fetches.
- **Flow Chile**:
  - `packages/core/src/lib/flow/client.ts` abstrae `createPayment`, `getPaymentStatus`, firma HMAC y validación de webhooks (modo mock incluido).
  - API Routes actuales (`apps/web/app/api/payments/flow`) lo usan sin cambios.
- **SendGrid**:
  - Cliente y servicio desacoplados para mocking local.
  - Templates HTML/Text en `packages/core/src/lib/email/templates/`.

---

## 8. Testing y calidad

- **Vitest (unitarios)**:
  - Config en `vitest.config.ts` con `vite-tsconfig-paths` para respetar alias.
  - Cobertura sobre `packages/core` (pricing, validaciones) y lógica pura.
- **Vitest (E2E sin servidor)**:
  - Config dedicada en `vitest.e2e.config.ts` (incluye únicamente `tests-e2e-no-server`).
  - Script `pnpm test:e2e` ejecuta `start-server-and-test` + `vitest` con esa configuración.
  - El `.env.local` usado por `pnpm --filter @tresmorros/web dev` debe tener `FLOW_FORCE_MOCK=true` para que las pruebas usen el modo simulado de Flow.
- **Lint**: `next lint` + reglas `next/core-web-vitals`. Se puede extender con ESLint custom por paquete si se requiere.
- **Formateo**: Prettier + plugin Tailwind (config en `.prettierrc.json`).

---

## 9. Deploy / CI (sugerencia)

1. **Pipeline** (ejemplo con GitHub Actions):
   - `pnpm install --frozen-lockfile`
   - `pnpm lint`
   - `pnpm test`
   - `pnpm build`
2. **Artefactos**: subir `.next` o usar plataforma (Vercel/DigitalOcean Apps).
3. **Variables**: definir environment secrets para Flow/Supabase/SendGrid.
4. **Migrations**: ejecutar `packages/database/migrations/*.sql` como job separado (ej. Supabase CLI, psql, Prisma migration runner, etc.).

---

## 10. Checklist para nuevas funcionalidades

1. ¿Se requiere nuevo módulo compartido? → ubicarlo en `packages/core` o `packages/ui` según corresponda.
2. Añadir tests en `tests/` o `packages/*/__tests__` antes de tocar APIs sensibles.
3. Extender `docs/technical` con decisiones arquitectónicas relevantes.
4. Actualizar `README.md` y/o `docs/technical/MONOREPO-GUIDE.md` si cambia el flujo general.
5. Ejecutar `pnpm lint && pnpm test` antes del PR.

---

## 11. Roadmap sugerido (post-monorepo)

- [ ] Agregar `changesets` para versionado interno de paquetes.
- [ ] Extraer scripts de despliegue de base de datos a Supabase CLI.
- [ ] Implementar guardas de importación (ej. core no depende de web).
- [ ] Añadir Storybook o docs de UI (`packages/ui`) para acelerar diseño.
- [ ] Integrar monitor de background jobs (expiración de holds) vía CRON/Hono Worker.

---

Este documento debe mantenerse actualizado conforme se creen nuevos paquetes o scripts. Sirve como referencia única para capacitar a cualquier desarrollador que ingrese al proyecto y necesite comprender la arquitectura completa del monorepo.

