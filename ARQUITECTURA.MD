# 🏗️ Arquitectura del Sistema

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 14)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Landing    │  │   Booking    │  │    Admin     │     │
│  │    Pages     │  │    Flow      │  │    Panel     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Routes    │
                    │   (Next.js)     │
                    └────────┬────────┘
                             │
        ┏━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━┓
        ▼                    ▼                     ▼
┌───────────────┐   ┌────────────────┐   ┌────────────────┐
│   Supabase    │   │   Flow API     │   │   SendGrid     │
│  (PostgreSQL) │   │   (Pagos)      │   │   (Emails)     │
└───────────────┘   └────────────────┘   └────────────────┘
```

---

## 🎯 Stack Tecnológico

### Frontend
- **Framework**: Next.js 14.2.18 (App Router)
- **UI**: React 18 + TypeScript
- **Styling**: Tailwind CSS 3.4
- **Forms**: React Hook Form + Zod
- **State**: React Context + Hooks
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js 18+
- **API**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **ORM**: Supabase Client
- **Validación**: Zod

### Servicios Externos
- **Database & Auth**: Supabase
- **Pagos**: Flow (Chile)
- **Emails**: SendGrid
- **Hosting**: Vercel (recomendado)

### DevOps
- **Package Manager**: pnpm
- **Testing**: Vitest
- **Linting**: ESLint
- **Formatting**: Prettier
- **CI/CD**: GitHub Actions (configuración pendiente)

---

## 📁 Estructura Detallada del Monorepo

```
tres-morros/
│
├── apps/
│   └── web/                           # Aplicación Next.js principal
│       ├── app/                       # Next.js App Router
│       │   ├── (public)/             # Rutas públicas
│       │   │   ├── page.tsx          # Landing page
│       │   │   ├── cabanas/          # Páginas de cabañas
│       │   │   └── pago/             # Flujo de pago
│       │   ├── admin/                # Rutas protegidas admin
│       │   │   ├── layout.tsx        # Layout con auth
│       │   │   ├── page.tsx          # Dashboard
│       │   │   ├── login/            # Login admin
│       │   │   └── reservas/         # Gestión reservas
│       │   ├── api/                  # API Routes
│       │   │   ├── availability/     # Disponibilidad
│       │   │   ├── bookings/         # CRUD reservas
│       │   │   ├── payments/flow/    # Integración Flow
│       │   │   ├── admin/            # APIs admin
│       │   │   └── jobs/             # Cron jobs
│       │   ├── layout.tsx            # Root layout
│       │   ├── globals.css           # Estilos globales
│       │   └── not-found.tsx         # 404
│       ├── public/                   # Assets estáticos
│       │   └── images/               # Imágenes
│       ├── next.config.mjs           # Config Next.js
│       ├── tailwind.config.ts        # Config Tailwind
│       ├── tsconfig.json             # Config TypeScript
│       └── package.json              # Dependencies (usa @tresmorros/ui como librería de componentes)
│
├── packages/
│   ├── core/                         # Lógica de negocio
│   │   ├── src/
│   │   │   ├── auth/                # Autenticación
│   │   │   │   ├── admin.ts         # Auth admin
│   │   │   │   └── session.ts       # Gestión sesiones
│   │   │   ├── booking/             # Lógica reservas
│   │   │   │   ├── availability.ts  # Disponibilidad
│   │   │   │   ├── pricing.ts       # Cálculo precios
│   │   │   │   └── validation.ts    # Validaciones
│   │   │   ├── payment/             # Lógica pagos
│   │   │   │   ├── flow-client.ts   # Cliente Flow
│   │   │   │   └── webhook.ts       # Webhooks
│   │   │   ├── email/               # Emails
│   │   │   │   ├── client.ts        # Cliente SendGrid
│   │   │   │   ├── service.ts       # Servicio email
│   │   │   │   └── templates/       # Templates
│   │   │   └── utils/               # Utilidades
│   │   │       ├── format.ts        # Formato
│   │   │       ├── cn.ts            # Class names
│   │   │       └── dates.ts         # Manejo fechas
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── database/                     # Configuración BD
│   │   ├── src/
│   │   │   ├── client.ts            # Cliente Supabase
│   │   │   ├── server.ts            # Cliente server
│   │   │   └── types/               # Tipos generados
│   │   │       ├── database.ts      # Tipos BD
│   │   │       ├── booking.ts       # Tipos reserva
│   │   │       ├── flow.ts          # Tipos Flow
│   │   │       └── email.ts         # Tipos email
│   │   ├── schemas/                 # Esquemas SQL
│   │   │   ├── 001_initial.sql     # Schema inicial
│   │   │   ├── 002_flow.sql        # Integración Flow
│   │   │   └── 003_emails.sql      # Sistema emails
│   │   ├── migrations/              # Migraciones
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui/                          # Biblioteca UI + features
│       ├── src/
│       │   ├── ui/                  # Componentes base (Button, Card, Container)
│       │   ├── booking/             # Wizard, calendario, formularios
│       │   ├── layout/              # Header/Footer reutilizables
│       │   ├── features/            # Módulos funcionales (cabins, gallery, etc.)
│       │   ├── sections/            # Secciones completas (home hero, ubicación, propósito)
│       │   ├── forms/               # Formularios compartidos (ContactForm)
│       │   ├── types/               # Tipos compartidos (media, props)
│       │   └── admin/               # Componentes del panel
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                            # Documentación
│   ├── technical/                   # Docs técnicas
│   ├── business/                    # Docs negocio
│   ├── api/                         # API reference
│   └── README.md                    # Índice principal
│
├── tools/                           # Herramientas
│   └── scripts/                     # Scripts útiles
│       ├── db-migrate.ts           # Migraciones
│       ├── db-seed.ts              # Seed data
│       └── generate-types.ts       # Generar tipos
│
├── tests/                           # Tests compartidos
│   ├── unit/                        # Tests unitarios
│   ├── integration/                 # Tests integración
│   └── e2e/                         # Tests E2E
│
├── .github/                         # GitHub config
│   └── workflows/                   # CI/CD
│
├── migrations/                      # Migraciones BD (legacy)
├── pnpm-workspace.yaml             # Config monorepo
├── .env.example                    # Template env vars
├── .gitignore                      # Git ignore
├── package.json                    # Root package
├── tsconfig.json                   # TS config base
└── README.md                       # README principal
```

---

## 🔄 Flujos de Datos Principales

### 1. Flujo de Reserva

```
Usuario selecciona fechas
         │
         ▼
AvailabilityCalendar hace request a /api/availability
         │
         ▼
API consulta Supabase (bookings + admin_blocks)
         │
         ▼
Retorna fechas disponibles/ocupadas
         │
         ▼
Usuario completa formulario
         │
         ▼
BookingForm valida con Zod
         │
         ▼
POST /api/bookings/hold
         │
         ▼
API crea booking (status: pending, expires_at: +45min)
         │
         ▼
Redirect a /pago con bookingId
```

### 2. Flujo de Pago

```
Usuario en /pago
         │
         ▼
Cliente carga datos de booking
         │
         ▼
Usuario hace click "Pagar"
         │
         ▼
POST /api/payments/flow/create
         │
         ▼
Flow crea orden y retorna URL
         │
         ▼
Redirect a Flow payment page
         │
         ▼
Usuario completa pago en Flow
         │
         ▼
Flow hace POST a /api/payments/flow/webhook
         │
         ▼
API valida HMAC signature
         │
         ▼
API actualiza booking (status: paid)
         │
         ▼
API envía email confirmación
         │
         ▼
Flow redirige a /pago/confirmacion
         │
         ▼
Cliente hace polling a /api/bookings/[id]
         │
         ▼
Muestra estado final (paid/cancelled)
```

### 3. Flujo de Expiración de Holds

```
Cron job cada 5 minutos
         │
         ▼
GET /api/jobs/expire-holds
         │
         ▼
API valida CRON_SECRET
         │
         ▼
API consulta bookings pendientes con expires_at < NOW()
         │
         ▼
API actualiza a status: expired
         │
         ▼
API registra evento en api_events
         │
         ▼
Retorna count de holds expirados
```

### 4. Flujo de Autenticación Admin

```
Admin accede a /admin
         │
         ▼
Middleware verifica cookie de sesión
         │
         ├─ No válida → Redirect a /admin/login
         │
         └─ Válida → Renderiza dashboard
                    │
                    ▼
            Carga KPIs y reservas desde Supabase
```

---

## 🔐 Seguridad

### Autenticación
- **Admin**: Cookie httpOnly con hash SHA256
- **Duración**: 24 horas
- **Secret**: Variable de entorno `ADMIN_PASSWORD`

### API Protection
- **Rate Limiting**: Pendiente implementar
- **CORS**: Configurado en Next.js
- **CSRF**: Protección automática de Next.js
- **Validation**: Todos los inputs validados con Zod

### Payment Security
- **HMAC Signature**: Validación en webhooks Flow
- **Secrets**: Variables de entorno nunca expuestas
- **HTTPS**: Obligatorio en producción

### Database
- **RLS (Row Level Security)**: Pendiente configurar en Supabase
- **Service Role**: Solo en server-side
- **Anon Key**: Solo operaciones públicas seguras

---

## 🚀 Performance

### Optimizaciones Implementadas
- ✅ Static Generation para páginas de cabañas
- ✅ Image Optimization con next/image
- ✅ Code Splitting automático (Next.js)
- ✅ CSS Modules con Tailwind
- ✅ API Routes con caching headers

### Optimizaciones Pendientes
- ⏳ Redis para caching de disponibilidad
- ⏳ CDN para assets estáticos
- ⏳ Database indexes optimization
- ⏳ Query optimization (N+1 queries)

---

## 📊 Monitoreo

### Logs
- **API Events**: Tabla `api_events` en Supabase
- **Errors**: Console logs (mejorar a Sentry)
- **Webhooks**: Logs en Flow dashboard

### Métricas
- **Performance**: Web Vitals (Next.js built-in)
- **Uptime**: Pendiente (UptimeRobot recomendado)
- **Analytics**: Pendiente (Google Analytics/Plausible)

---

## 🔄 CI/CD

### GitHub Actions (Recomendado)
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    - Install dependencies
    - Run linter
    - Run type check
    - Run tests
    - Build app
  deploy:
    - Deploy to Vercel (on main)
```

---

## 📚 Referencias

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Flow API Docs](https://www.flow.cl/docs)
- [SendGrid API Docs](https://docs.sendgrid.com)

---

**Última actualización**: 2025-11-15
