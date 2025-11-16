# ⚙️ ESPECIFICACIONES TÉCNICAS - Tres Morros de Coliumo

**PROYECTO:** Sistema de Reservas  
**FECHA:** 2025-11-11  
**VERSIÓN:** 1.0.0

---

## **1. ARQUITECTURA DEL SISTEMA**

### **1.1 Patrón Arquitectónico**

**Tipo:** Aplicación Web Full-Stack con arquitectura de 3 capas

```
┌─────────────────────────────────────────────┐
│            CAPA DE PRESENTACIÓN             │
│   (Next.js 14 App Router + React 18)       │
│   - Server Components (RSC)                 │
│   - Client Components                       │
│   - Tailwind CSS                            │
└─────────────────────────────────────────────┘
                     ↓ HTTP/HTTPS
┌─────────────────────────────────────────────┐
│          CAPA DE LÓGICA DE NEGOCIO          │
│        (Next.js API Routes + Serverless)    │
│   - Endpoints REST                          │
│   - Validaciones (Zod)                      │
│   - Integración con servicios externos     │
└─────────────────────────────────────────────┘
                     ↓ PostgreSQL Protocol
┌─────────────────────────────────────────────┐
│            CAPA DE PERSISTENCIA             │
│         (Supabase - PostgreSQL 15)          │
│   - Base de datos relacional                │
│   - Storage de archivos                     │
│   - Realtime subscriptions (futuro)        │
└─────────────────────────────────────────────┘
```

### **1.2 Tecnologías Core**

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| **Frontend** | Next.js | 14.2+ | SSR/SSG, App Router, Performance |
| **UI Library** | React | 18.2+ | Ecosistema, Server Components |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first, Responsive, DX |
| **Language** | TypeScript | 5.0+ | Type safety, Developer experience |
| **Backend Runtime** | Node.js | 20 LTS | Estable, largo soporte |
| **Database** | PostgreSQL | 15+ | Relacional, ACID, JSON support |
| **BaaS** | Supabase | Latest | PostgreSQL + Storage + Auth ready |
| **Payments** | Flow Chile | Latest | Integración local, Webpay |
| **Email** | SendGrid | Latest | Confiable, Templates, Tracking |
| **Hosting** | DigitalOcean | - | Costo-beneficio, Control total |
| **Proxy** | Nginx | 1.24+ | Performance, SSL termination |
| **Process Manager** | PM2 | 5.3+ | Clustering, Auto-restart, Logs |

---

## **2. STACK TECNOLÓGICO DETALLADO**

### **2.1 Frontend**

**Framework:**
```json
{
  "next": "^14.2.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

**Estilos y UI:**
```json
{
  "tailwindcss": "^3.4.0",
  "postcss": "^8.4.0",
  "autoprefixer": "^10.4.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.2.0"
}
```

**Formularios y Validación:**
```json
{
  "react-hook-form": "^7.50.0",
  "@hookform/resolvers": "^3.3.0",
  "zod": "^3.22.0"
}
```

**Calendario y Fechas:**
```json
{
  "react-day-picker": "^8.10.0",
  "date-fns": "^3.0.0"
}
```

**Iconos:**
```json
{
  "lucide-react": "^0.300.0"
}
```

### **2.2 Backend**

**Supabase Client:**
```json
{
  "@supabase/supabase-js": "^2.39.0"
}
```

**Email:**
```json
{
  "@sendgrid/mail": "^8.1.0"
}
```

**Seguridad y Crypto:**
```json
{
  "crypto": "built-in" // Node.js native
}
```

### **2.3 Development & Testing**

```json
{
  "@types/node": "^20.10.0",
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0",
  "typescript": "^5.3.0",
  "eslint": "^8.56.0",
  "eslint-config-next": "^14.2.0",
  "prettier": "^3.2.0",
  "prettier-plugin-tailwindcss": "^0.5.0",
  "vitest": "^1.2.0",
  "@vitejs/plugin-react": "^4.2.0",
  "@playwright/test": "^1.41.0"
}
```

---

## **3. ESTRUCTURA DE DIRECTORIOS**

```
tres-morros-coliumo/
│
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── globals.css               # Global styles
│   │
│   ├── cabanas/                  # Páginas públicas de cabañas
│   │   └── [slug]/
│   │       └── page.tsx          # Detalle de cabaña dinámica
│   │
│   ├── pago/                     # Flujo de pago
│   │   ├── page.tsx              # Página de pago
│   │   └── confirmacion/
│   │       └── page.tsx          # Confirmación post-pago
│   │
│   ├── contacto/
│   │   └── page.tsx              # Formulario de contacto
│   │
│   ├── admin/                    # Panel de administración
│   │   ├── layout.tsx            # Layout del admin (auth wrapper)
│   │   ├── page.tsx              # Dashboard
│   │   ├── login/
│   │   │   └── page.tsx          # Login
│   │   ├── reservas/
│   │   │   ├── page.tsx          # Listado
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Detalle
│   │   ├── cabanas/
│   │   │   ├── page.tsx          # Gestión de cabañas
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Editar cabaña
│   │   ├── bloqueos/
│   │   │   └── page.tsx          # Gestión de bloqueos
│   │   └── configuracion/
│   │       └── page.tsx          # Configuración general
│   │
│   └── api/                      # API Routes
│       ├── health/
│       │   └── route.ts          # Health check
│       ├── availability/
│       │   └── route.ts          # GET disponibilidad
│       ├── bookings/
│       │   ├── hold/
│       │   │   └── route.ts      # POST crear hold
│       │   └── [id]/
│       │       └── route.ts      # GET booking por ID
│       ├── payments/
│       │   └── flow/
│       │       ├── create/
│       │       │   └── route.ts  # POST crear orden Flow
│       │       └── webhook/
│       │           └── route.ts  # POST webhook de Flow
│       ├── contact/
│       │   └── route.ts          # POST formulario contacto
│       ├── admin/
│       │   ├── login/
│       │   │   └── route.ts      # POST login
│       │   └── logout/
│       │       └── route.ts      # POST logout
│       └── jobs/                 # Cron jobs
│           ├── expire-holds/
│           │   └── route.ts      # POST expirar holds
│           └── send-reminders/
│               └── route.ts      # POST enviar recordatorios
│
├── components/                   # React components
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── ui/                       # Componentes base reutilizables
│   │   ├── Button.tsx
│   │   ├── Container.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── cabin/
│   │   ├── CabinCard.tsx
│   │   ├── CabinGrid.tsx
│   │   └── CabinGallery.tsx
│   ├── booking/
│   │   ├── AvailabilityCalendar.tsx
│   │   ├── BookingForm.tsx
│   │   ├── BookingSummary.tsx
│   │   ├── BookingWizard.tsx
│   │   └── JacuzziSelector.tsx
│   ├── forms/
│   │   ├── ContactForm.tsx
│   │   └── ...
│   └── admin/
│       ├── AdminNav.tsx
│       ├── Dashboard.tsx
│       └── ...
│
├── lib/                          # Lógica de negocio y utilidades
│   ├── supabase/
│   │   ├── client.ts             # Cliente para browser
│   │   └── server.ts             # Cliente para servidor
│   ├── flow/
│   │   └── client.ts             # Cliente de Flow API
│   ├── email/
│   │   ├── client.ts             # Cliente de SendGrid
│   │   ├── service.ts            # Funciones de alto nivel
│   │   └── templates/
│   │       ├── booking-confirmation.ts
│   │       └── booking-reminder.ts
│   ├── auth/
│   │   └── admin.ts              # Autenticación del admin
│   ├── validations/
│   │   └── booking.ts            # Schemas de Zod
│   └── utils/
│       ├── cn.ts                 # Utility para clases
│       ├── format.ts             # Formateo de fechas/precios
│       └── pricing.ts            # Cálculos de precio
│
├── types/                        # TypeScript types
│   ├── database.ts               # Types generados de Supabase
│   ├── booking.ts
│   ├── flow.ts
│   └── email.ts
│
├── public/                       # Assets estáticos
│   ├── images/
│   │   ├── cabins/
│   │   └── common/
│   └── favicon.ico
│
├── AI-INSTRUCTIONS/              # Instrucciones para IA
│   ├── 00-START-HERE.md
│   ├── 01-ITERATION-1.md
│   └── ...
│
├── AI-CONTEXT/                   # Contexto del proyecto
│   ├── business-requirements.md
│   ├── technical-specifications.md
│   └── ...
│
├── scripts/                      # Scripts de utilidad
│   └── deploy.sh
│
├── .env.local                    # Variables locales (gitignored)
├── .env.example                  # Template de variables
├── .env.production               # Variables producción (en servidor)
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── ecosystem.config.js           # Configuración de PM2
└── README.md
```

---

## **4. PATRONES Y CONVENCIONES**

### **4.1 Naming Conventions**

**Archivos:**
```
components/     → PascalCase.tsx      (BookingForm.tsx)
lib/           → camelCase.ts         (calculatePrice.ts)
app/           → kebab-case/          (pago/confirmacion/)
types/         → PascalCase.ts        (Database.ts)
API routes     → kebab-case/route.ts  (expire-holds/route.ts)
```

**Variables y Funciones:**
```typescript
// Variables: camelCase
const userEmail = 'test@example.com';
const isAvailable = true;

// Funciones: camelCase
function calculateTotalPrice() {}
async function sendConfirmationEmail() {}

// Constantes: UPPER_SNAKE_CASE
const MAX_CAPACITY = 6;
const SESSION_DURATION = 20 * 60 * 1000;

// Tipos e Interfaces: PascalCase
interface BookingData {}
type PaymentStatus = 'pending' | 'paid';

// Enums: PascalCase
enum FlowPaymentStatusCode {
  PENDING = 1,
  PAID = 2,
}
```

**Componentes:**
```typescript
// Componentes: PascalCase
export function BookingForm() {}
export const Button = forwardRef() {}

// Props: NombreComponenteProps
interface BookingFormProps {}
```

### **4.2 Estructura de Componentes**

```typescript
// components/Example.tsx
'use client'; // Solo si necesita hooks/eventos

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

// 1. Interfaces primero
interface ExampleProps {
  title: string;
  onAction?: () => void;
}

// 2. Componente principal
export function Example({ title, onAction }: ExampleProps) {
  // 2.1 Hooks (orden: state, effects, custom hooks)
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // ...
  }, []);

  // 2.2 Handlers
  const handleClick = () => {
    setCount(prev => prev + 1);
    onAction?.();
  };

  // 2.3 Computed values
  const isEven = count % 2 === 0;

  // 2.4 Early returns
  if (!title) return null;

  // 2.5 Render
  return (
    <div className={cn('container', isEven && 'bg-blue-50')}>
      <h1>{title}</h1>
      <button onClick={handleClick}>Count: {count}</button>
    </div>
  );
}
```

### **4.3 Estructura de API Routes**

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/server';

// 1. Schema de validación
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// 2. Tipos
type RequestBody = z.infer<typeof schema>;

// 3. Handlers por método HTTP
export async function GET(request: NextRequest) {
  try {
    // Lógica
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in GET:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parse body
    const body = await request.json();
    
    // 2. Validate
    const data = schema.parse(body);
    
    // 3. Business logic
    // ...
    
    // 4. Response
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    // Manejo de errores
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error in POST:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
```

### **4.4 Manejo de Errores**

**Frontend (UI):**
```typescript
'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export function ExampleForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unknown error');
      }

      // Success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      {/* Form fields */}
    </form>
  );
}
```

**Backend (API):**
```typescript
// lib/utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

// Uso:
if (!booking) {
  throw new NotFoundError('Booking not found');
}
```

---

## **5. INTEGRACIÓN CON SERVICIOS EXTERNOS**

### **5.1 Supabase**

**Configuración:**
```typescript
// lib/supabase/client.ts (Browser)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// lib/supabase/server.ts (Server)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ← Admin key
);
```

**Queries:**
```typescript
// SELECT
const { data, error } = await supabase
  .from('cabins')
  .select('*, images:cabin_images(*)')
  .eq('active', true)
  .order('base_price', { ascending: true });

// INSERT
const { data, error } = await supabase
  .from('bookings')
  .insert({
    cabin_id: 'uuid',
    start_date: '2025-12-25',
    // ...
  })
  .select()
  .single();

// UPDATE
const { error } = await supabase
  .from('bookings')
  .update({ status: 'paid' })
  .eq('id', bookingId);

// DELETE
const { error } = await supabase
  .from('admin_blocks')
  .delete()
  .eq('id', blockId);
```

**Storage (Imágenes):**
```typescript
// Upload
const { data, error } = await supabase.storage
  .from('cabin-images')
  .upload(`${cabinId}/${fileName}`, file, {
    cacheControl: '3600',
    upsert: false,
  });

// Get public URL
const { data } = supabase.storage
  .from('cabin-images')
  .getPublicUrl(`${cabinId}/${fileName}`);

// Delete
const { error } = await supabase.storage
  .from('cabin-images')
  .remove([`${cabinId}/${fileName}`]);
```

### **5.2 Flow (Pagos)**

**Crear Pago:**
```typescript
import { flowClient } from '@/lib/flow/client';

const payment = await flowClient.createPayment({
  commerceOrder: bookingId,
  subject: `Reserva ${cabinName}`,
  currency: 'CLP',
  amount: totalAmount,
  email: customerEmail,
  urlConfirmation: `${siteUrl}/api/payments/flow/webhook`,
  urlReturn: `${siteUrl}/pago/confirmacion?booking=${bookingId}`,
});

// Redirigir al usuario a payment.url
```

**Webhook:**
```typescript
const paymentStatus = await flowClient.getPaymentStatus(token);

if (paymentStatus.status === FlowPaymentStatusCode.PAID) {
  // Actualizar booking a 'paid'
}
```

### **5.3 SendGrid (Emails)**

**Enviar Email:**
```typescript
import { emailService } from '@/lib/email/service';

await emailService.sendBookingConfirmation({
  to: {
    email: booking.customer_email,
    name: booking.customer_name,
  },
  subject: `✅ Reserva Confirmada - ${cabin.title}`,
  bookingId: booking.id,
  cabinName: cabin.title,
  // ...
});
```

---

## **6. PERFORMANCE Y OPTIMIZACIÓN**

### **6.1 Next.js Optimizaciones**

**Server Components por defecto:**
```typescript
// app/page.tsx (Server Component)
export default async function HomePage() {
  // Fetch data directamente en el servidor
  const cabins = await getCabins();
  
  return <CabinGrid cabins={cabins} />;
}
```

**Client Components solo cuando sea necesario:**
```typescript
// components/BookingForm.tsx
'use client'; // ← Solo porque usa useState/hooks

import { useState } from 'react';

export function BookingForm() {
  const [email, setEmail] = useState('');
  // ...
}
```

**Image Optimization:**
```typescript
import Image from 'next/image';

<Image
  src="/images/cabin.jpg"
  width={800}
  height={600}
  alt="Cabaña"
  priority={false} // true solo para hero images
  placeholder="blur" // opcional
  quality={85} // default es 75
/>
```

**Dynamic Imports:**
```typescript
import dynamic from 'next/dynamic';

const AdminPanel = dynamic(() => import('@/components/admin/AdminPanel'), {
  loading: () => <p>Cargando...</p>,
  ssr: false, // No renderizar en servidor
});
```

### **6.2 Caching**

**Nginx (Static Assets):**
```nginx
location /_next/static {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
  expires 30d;
  add_header Cache-Control "public, max-age=2592000";
}
```

**Next.js Fetch Cache:**
```typescript
// Revalidar cada hora
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600 }
});

// No cachear
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store'
});
```

### **6.3 Bundle Size**

**Analizar:**
```bash
npm run build

# Ver reporte de tamaños
# First Load JS shared by all: XXX kB
```

**Reducir:**
1. Usar imports específicos
   ```typescript
   // ❌ Importa todo lodash
   import _ from 'lodash';
   
   // ✅ Solo la función necesaria
   import debounce from 'lodash/debounce';
   ```

2. Code splitting por rutas (automático en Next.js)

3. Lazy load componentes pesados

---

## **7. SEGURIDAD**

### **7.1 Validación de Datos**

**Cliente (UX):**
```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Muy corto'),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

**Servidor (Seguridad):**
```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
});

const data = schema.parse(request.body); // Throw si es inválido
```

### **7.2 Variables de Entorno**

**Nunca exponer al cliente:**
```env
# ❌ NO exponer
SUPABASE_SERVICE_ROLE_KEY=xxx
FLOW_SECRET_KEY=xxx
ADMIN_PASSWORD=xxx
SENDGRID_API_KEY=xxx

# ✅ OK exponer (públicas)
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_SITE_URL=xxx
```

### **7.3 Autenticación**

**Admin Panel:**
```typescript
// lib/auth/admin.ts
import { cookies } from 'next/headers';

export async function requireAdmin() {
  const session = cookies().get('admin_session');
  
  if (!session) {
    redirect('/admin/login');
  }
  
  return true;
}

// Uso en layout:
// app/admin/layout.tsx
export default async function AdminLayout({ children }) {
  await requireAdmin(); // ← Protege todas las rutas /admin/*
  
  return <>{children}</>;
}
```

### **7.4 Rate Limiting**

**Nginx (básico):**
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
  limit_req zone=api burst=20 nodelay;
  proxy_pass http://localhost:3000;
}
```

---

## **8. MONITOREO Y LOGS**

### **8.1 Logs de Aplicación**

**PM2:**
```bash
# Ver logs en tiempo real
pm2 logs tres-morros

# Ver últimas 100 líneas
pm2 logs tres-morros --lines 100

# Solo errores
pm2 logs tres-morros --err
```

**Structured Logging:**
```typescript
// Usar console.log/error con estructura
console.log('🚀 Server started', {
  port: 3000,
  env: process.env.NODE_ENV,
});

console.error('❌ Error processing payment', {
  error: error.message,
  bookingId,
  timestamp: new Date().toISOString(),
});
```

### **8.2 Logs de Base de Datos**

**Supabase API Events:**
```sql
-- Ver últimos eventos
SELECT * FROM api_events 
ORDER BY created_at DESC 
LIMIT 50;

-- Buscar errores
SELECT * FROM api_events 
WHERE status = 'error'
ORDER BY created_at DESC;

-- Eventos de un booking específico
SELECT * FROM api_events 
WHERE booking_id = 'xxx'
ORDER BY created_at ASC;
```

### **8.3 Métricas**

**Dashboard de PM2:**
```bash
pm2 monit
```

**Netdata (servidor):**
```
http://IP-SERVIDOR:19999
```

---

## **9. TESTING**

### **9.1 Unit Tests (Vitest)**

```typescript
// lib/utils/__tests__/pricing.test.ts
import { describe, it, expect } from 'vitest';
import { calculatePrice } from '../pricing';

describe('calculatePrice', () => {
  it('calcula precio base correctamente', () => {
    const result = calculatePrice(
      { base_price: 65000, jacuzzi_price: 20000 },
      '2025-12-25',
      '2025-12-28',
      []
    );

    expect(result.nights).toBe(3);
    expect(result.basePrice).toBe(195000);
    expect(result.total).toBe(195000);
  });

  it('incluye precio de jacuzzi', () => {
    const result = calculatePrice(
      { base_price: 65000, jacuzzi_price: 20000 },
      '2025-12-25',
      '2025-12-28',
      ['2025-12-25', '2025-12-26']
    );

    expect(result.jacuzziPrice).toBe(40000);
    expect(result.total).toBe(235000);
  });
});
```

**Ejecutar:**
```bash
npm run test
```

### **9.2 E2E Tests (Playwright)**

```typescript
// tests/booking-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete booking flow', async ({ page }) => {
  // 1. Go to homepage
  await page.goto('http://localhost:3000');

  // 2. Click on cabin
  await page.click('text=Vegas del Coliumo');

  // 3. Select dates
  // ...

  // 4. Fill form
  await page.fill('input[name="customerName"]', 'Test User');
  await page.fill('input[name="customerEmail"]', 'test@example.com');

  // 5. Submit
  await page.click('button[type="submit"]');

  // 6. Verify redirect to payment page
  await expect(page).toHaveURL(/\/pago/);
});
```

**Ejecutar:**
```bash
npx playwright test
```

---

## **10. DEPLOYMENT**

### **10.1 Build Process**

```bash
# 1. Install dependencies
npm ci --production=false

# 2. Build
npm run build

# Output:
# - .next/ directory con archivos optimizados
# - Tamaños de bundles
# - Rutas generadas
```

### **10.2 Environment Variables**

**Desarrollo (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
FLOW_API_KEY=sandbox-key
FLOW_SECRET_KEY=sandbox-secret
FLOW_BASE_URL=https://sandbox.flow.cl/api
SENDGRID_API_KEY=xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_PASSWORD=dev123
```

**Producción (.env.production):**
```env
# Mismo formato pero con valores de producción
FLOW_BASE_URL=https://www.flow.cl/api
NEXT_PUBLIC_SITE_URL=https://tresmorroscoliumo.cl
ADMIN_PASSWORD=secure-random-password-very-long
```

### **10