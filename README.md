# Tres Morros de Coliumo

Plataforma integral para la gestión de reservas, comunicación con huéspedes y pagos en línea de tres cabañas ubicadas en Coliumo, Chile. El objetivo es ofrecer una experiencia de reserva sin fricciones para los clientes finales, al mismo tiempo que se entregan herramientas claras y seguras al operador del negocio.

---

## ✨ Principales características

- **Reservas inteligentes**: validación en tiempo real del calendario (doble chequeo antes de emitir un hold), indicación visual de check-in/out y bloqueo automático cuando otro huésped toma las fechas.
- **Flujo de pagos**: integración con Flow/Webpay (modo sandbox y producción) con confirmaciones vía webhook y reintentos manuales seguros.
- **Notificaciones por correo**: contacto, eventos especiales y confirmaciones de pago usando plantillas enriquecidas y SendGrid.
- **Panel administrativo**: autenticación básica protegida por cookies, revisión de reservas y bloqueos manuales.
- **Monitoreo**: endpoints `/api/health` y `/api/health-lite` para supervisión rápida en despliegues.

---

## 🧱 Arquitectura

| Módulo | Descripción |
| --- | --- |
| `apps/web` | Aplicación Next.js 14 con App Router, responsable del frontend público, APIs y panel admin. |
| `packages/core` | Librería de dominio (auth, Supabase clients, Flow client, email service, validaciones, utilidades). |
| `packages/ui` | Componentes React/Tailwind reutilizables (wizard de reservas, calendario, layouts, formularios). |
| `packages/database` | Esquema SQL y migraciones para Supabase/PostgreSQL. |

> Alias `@/` siguen apuntando al código histórico, redirigiendo internamente a `packages/core` y `packages/ui`.

---

## 🧩 Flujo funcional

1. **Selección de fechas**  
   El calendario muestra el mes actual y el siguiente. Marca check-in/out con etiquetas amarillas y valida que los días disponibles no se ocupen entre selección y confirmación.
2. **Hold de reserva (45 min)**  
   El API `/api/bookings/hold` crea un registro “pending”. Si alguien intenta reservar las mismas fechas, se devuelve 409 con un mensaje claro y el calendario se actualiza.
3. **Pago con Flow/Webpay**  
   - `pnpm test:e2e` activa el modo mock (`FLOW_FORCE_MOCK=true`).  
   - Webhook `/api/payments/flow/webhook` cambia la reserva a “paid”, guarda la traza y envía el correo de confirmación.
4. **Emails**  
   - Contacto general: `/api/contact`  
   - Eventos especiales: `/api/events/special`  
   - Confirmaciones de pago: `sendBookingConfirmation` en el webhook de Flow.

---

## 🚀 Requisitos

- Node.js 20.x
- pnpm `>=9.12`
- Proyecto Supabase (URL + Anon key + Service role)
- Credenciales Flow (sandbox/producción)
- SendGrid API key

---

## ⚙️ Configuración

1. **Instalar dependencias**
   ```bash
   pnpm install
   ```
2. **Variables de entorno**
   ```bash
   cp env/example.env .env
   cp env/example.env .env.local            # Opcional para utilizar los scripts locales
   cp apps/web/env.local.example apps/web/.env.local
   ```
   > `.env.local` ahora puede versionarse si necesitas subirlo a GitHub/DigitalOcean tal cual, pero se recomienda mantener las llaves reales fuera de commits públicos.
3. **Base de datos**  
   Ejecutar `packages/database/supabase-schema.sql` y las migraciones dentro de `packages/database/migrations/`.
4. **Servidor de desarrollo**
   ```bash
   pnpm dev
   ```
   Salud: <http://localhost:3000/api/health>

---

## 📜 Scripts principales

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Levanta `apps/web` en modo desarrollo. |
| `pnpm build` / `pnpm start` | Build y servidor de producción. |
| `pnpm test` | Vitest unitario (`tests/`). |
| `pnpm test:e2e` | Flujos end-to-end sin servidor externo (`tests-e2e-no-server`). |
| `pnpm lint` | `next lint` en la app web. |
| `pnpm clear:bookings` | Limpia `bookings`, `api_events` y `admin_blocks` (usas Service Role). Ideal para dejar el calendario “en blanco” antes de demos. |

> Puedes filtrar por paquete con `pnpm --filter <workspace> <cmd>`.

---

## 📦 Exportar versión mínima para un nuevo repo

¿Necesitas un paquete limpio sólo con el sistema funcional? Ejecuta:

```bash
pnpm export:app             # Genera dist/deployable con lo esencial
pnpm export:app ../nuevo    # Opcional: ruta destino personalizada
```

El script copia únicamente:

- Código fuente y configuraciones necesarias (`apps/web`, `packages/core`, `packages/ui`, `packages/database`, `public`).
- Archivos raíz obligatorios (`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig*.json`, `turbo.json`, `vitest*.config.ts`, `README.md`).

Quedan fuera `Documentacion/`, `docs/`, `tests/`, scripts auxiliares y cualquier carpeta pesada (`node_modules`, `.next`, etc.).  
Una vez generado el directorio, puedes entrar allí y arrancar un repo nuevo con `git init && pnpm install`.

---

## 🔁 Control de versiones en GitHub

Sugerencias para mantener sincronizado `github.com/NikoRNJ/tresmorroscoliumo`:

1. **Sincroniza antes de trabajar**
   ```powershell
   git status -sb
   git fetch origin
   git pull --rebase origin main
   ```
2. **Sube tus cambios**
   ```powershell
   git add -A
   git commit -m "feat: describe el cambio"
   git push -u origin main
   ```
3. **Conflictos?**  
   - Revisa `git status` para ver los archivos en conflicto.  
   - Resuélvelos, marca con `git add` y continúa con `git rebase --continue`.  
   - Finaliza con `git push` (usa `--force-with-lease` si estabas en medio de un rebase).
4. **Export minimal + nuevo repo**  
   ```powershell
   pnpm export:app
   cd dist/deployable
   git init
   git add .
   git commit -m "chore: bootstrap"
   git remote add origin https://github.com/NikoRNJ/tresmorroscoliumo.git
   git push -u origin main
   ```

Recuerda que `node_modules/`, `.next/`, `dist/`, `Documentacion/` y otros artefactos pesados ya están cubiertos por `.gitignore`.

---

## 🧪 Testing

- **Unitarios**  
  ```bash
  pnpm test
  ```
- **E2E (Flow mock)**  
  ```bash
  pnpm test:e2e
  ```
  Asegúrate de tener `FLOW_FORCE_MOCK=true` en `apps/web/.env.local`.

---

## 📁 Estructura relevante

```
tres-morros/
├── apps/
│   └── web/                 # Next.js (frontend + APIs + admin)
├── packages/
│   ├── core/                # Lógica de negocio (Flow, Supabase, Email, Validaciones, etc.)
│   ├── ui/                  # Componentes UI reutilizables
│   └── database/            # SQL y migraciones
├── public/                  # Assets compartidos
├── tools/scripts/clear-bookings.mjs
├── package.json / pnpm-lock.yaml
├── tsconfig*.json / turbo.json / vitest*.config.ts
└── README.md
```

---

## 🔧 Variables de entorno (principales)

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` / `PUBLIC_EXTERNAL_URL` | URL base y callbacks usados en emails / Flow. |
| `NEXT_PUBLIC_SITE_ENV` | Nombre del entorno (`development`, `staging`, `production`). |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente público (reservas). |
| `SUPABASE_SERVICE_ROLE_KEY` | Mutaciones críticas (holds, pagos, limpieza). |
| `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_BASE_URL` | Credenciales Flow/Webpay. |
| `FLOW_FORCE_MOCK` | `true` en desarrollo/E2E para simular pagos. |
| `FLOW_WEBHOOK_SECRET` | Secreto interno para validar callbacks de Flow. |
| `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` | Emails transaccionales. |
| `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | Acceso al panel administrativo. |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Observabilidad (errores y Replays). |

> Plantillas disponibles en `env/example.env` y `apps/web/env.local.example`.

---

## ☁️ Despliegue (DigitalOcean, Nginx, Apache)

Antes de desplegar:

```bash
pnpm check:env   # Verifica que las variables críticas estén presentes
pnpm build       # Ejecuta el build (prebuild corre automáticamente)
```

Consulta `deploy/README.md` (y el spec `.do/app.yaml`) para:

- App Platform: comandos `pnpm install && pnpm build` + `Procfile` listo.
- Lista completa de variables para copiar en el panel.
- Guía de Droplet con Node.js 20 + PNPM, servicio `systemd` de ejemplo y reverse proxy Nginx.
- Plantillas para Apache (`deploy/apache/vhost.conf`) y Nginx (`deploy/nginx/reverse-proxy.conf`).

---

## 💬 Soporte y contacto

- **Cliente**: Tres Morros de Coliumo (Coliumo, Región del Bío-Bío, Chile).  
- **Tecnología**: Next.js 14 + Supabase + Flow/Webpay + SendGrid.  
- **Correo de soporte**: contacto@tresmorroscoliumo.cl (configurable en `.env`).  

Este README está pensado para presentar el proyecto a stakeholders y dejar documentado el workflow para los equipos de desarrollo y operación. Para más detalles técnicos se puede consultar `docs/technical/MONOREPO-GUIDE.md`.