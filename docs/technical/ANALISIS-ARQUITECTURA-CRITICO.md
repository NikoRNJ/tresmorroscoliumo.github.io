# Análisis Exhaustivo de Arquitectura - Tres Morros de Coliumo

**Fecha:** 26 de Noviembre, 2025  
**Versión:** 1.0  
**Autor:** Análisis de Ingeniería de Software  
**Tipo:** Evaluación técnica para producción y escalabilidad

---

## Resumen Ejecutivo

Este documento presenta un análisis exhaustivo del sistema de reservas de cabañas **Tres Morros de Coliumo**, evaluando su arquitectura desde la perspectiva de un ingeniero de software experto en proyectos de gran escala. El análisis cubre:

1. **Integración de Flow (sistema de pagos)**
2. **Flujo de reservas y disponibilidad**
3. **Arquitectura general y patrones**
4. **Puntos críticos y vulnerabilidades**
5. **Plan de mejoras y refactorización**

---

## 1. Visión General del Sistema

### 1.1 Stack Tecnológico

| Capa | Tecnología | Estado |
|------|------------|--------|
| Frontend | Next.js 14.2.18 (App Router) | ✅ Actual |
| UI | React 18 + Tailwind CSS 3.4 | ✅ Estable |
| Estado | React Context + useState | ⚠️ Básico |
| Backend | Next.js API Routes | ✅ Funcional |
| Database | PostgreSQL (Supabase) | ✅ Configurado |
| Pagos | Flow Chile | ⚠️ Ver análisis |
| Emails | SendGrid | ✅ Implementado |
| Monitoreo | Sentry | ✅ Integrado |

### 1.2 Arquitectura del Monorepo

```
tres-morros/
├── apps/web/               # Next.js application
├── packages/
│   ├── core/              # Lógica de negocio
│   ├── ui/                # Componentes React
│   └── database/          # Esquemas SQL
├── tests/                 # Unitarios (Vitest)
└── tests-e2e-no-server/   # End-to-end
```

**Evaluación:** ✅ La separación en monorepo es correcta para escalabilidad.

---

## 2. Análisis de Integración de Flow

### 2.1 Arquitectura Actual de Pagos

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE PAGO                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Cliente → POST /api/payments/flow/create                │
│     ├── Valida bookingId                                    │
│     ├── Verifica estado = 'pending'                         │
│     ├── Verifica expires_at > now                           │
│     └── Crea orden en Flow API                              │
│                                                             │
│  2. Flow → Redirect usuario a pasarela                      │
│                                                             │
│  3. Flow → POST /api/payments/flow/webhook                  │
│     ├── Valida firma HMAC SHA256                            │
│     ├── Consulta estado real en Flow                        │
│     ├── Actualiza booking a 'paid'                          │
│     └── Envía email de confirmación                         │
│                                                             │
│  4. Flow → Redirect a /pago/confirmacion                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Puntos Críticos Identificados

#### 🔴 CRÍTICO 1: Race Condition en Webhook

**Ubicación:** `apps/web/app/api/payments/flow/webhook/route.ts`

**Problema:** El webhook actualiza el estado sin transacción atómica. Si Flow envía el webhook múltiples veces (retry), puede haber inconsistencias.

```typescript
// Línea 110-116 - Actualización sin lock
const { error: updateError } = await (supabaseAdmin.from('bookings') as any)
  .update({
    status: 'paid',
    paid_at: new Date().toISOString(),
    flow_payment_data: paymentStatus,
  })
  .eq('id', bookingId);
```

**Recomendación:** Implementar idempotencia verificando si ya está `paid` antes de actualizar:

```typescript
// SOLUCIÓN: Verificar estado actual antes de actualizar
if (booking.status === 'paid') {
  return NextResponse.json({ success: true, status: 'already_paid' });
}

// Usar optimistic locking o transacción
const { error: updateError, count } = await supabaseAdmin
  .from('bookings')
  .update({ status: 'paid', paid_at: new Date().toISOString() })
  .eq('id', bookingId)
  .eq('status', 'pending') // Solo actualiza si aún está pending
  .select();
```

#### 🔴 CRÍTICO 2: Sin Retry Automático en Webhooks Fallidos

**Problema:** Si el webhook falla (error de BD, timeout), Flow puede no reintentar y la reserva queda en estado inconsistente (pagada en Flow pero `pending` en sistema).

**Recomendación:** Implementar job de reconciliación:

```typescript
// Nuevo endpoint: /api/jobs/reconcile-payments
// Ejecutar cada 15 minutos
// 1. Buscar bookings en estado 'pending' con flow_order_id
// 2. Consultar estado en Flow
// 3. Si Flow dice 'PAID', actualizar localmente
```

#### 🟡 ADVERTENCIA 3: Modo Mock en Producción

**Ubicación:** `packages/core/src/lib/flow/client.ts`

```typescript
// Línea 23-28
const forceMock = String(process.env.FLOW_FORCE_MOCK || '').toLowerCase() === 'true'
this.configured = Boolean(this.apiKey && this.secretKey && this.baseUrl) && !forceMock

if (!this.configured) {
  console.warn('[Flow] Modo mock de Flow activo...')
}
```

**Riesgo:** Si se despliega con `FLOW_FORCE_MOCK=true` por error, el sistema marcará reservas como pagadas SIN cobro real.

**Mitigación existente:** El script `check-env.mjs` previene esto, pero la variable `FLOW_ALLOW_MOCK_IN_PROD` podría ser abusada.

**Recomendación:** Agregar telemetría/alerta cuando se usa modo mock:

```typescript
if (isMockFlow && isProdRuntime) {
  Sentry.captureMessage('FLOW_MOCK_IN_PRODUCTION', { level: 'fatal' });
  // Enviar alerta a Slack/Discord
}
```

#### 🟡 ADVERTENCIA 4: TTL de Orden de Flow Hardcodeado

```typescript
// Línea 14
const DEFAULT_FLOW_ORDER_TTL_MINUTES = 30;
```

**Problema:** Si el TTL de Flow en su plataforma cambia, podría haber desincronización.

**Recomendación:** Sincronizar con documentación oficial de Flow o configurar via env.

### 2.3 Fortalezas de la Integración Flow

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| Firma HMAC SHA256 | ✅ | Implementación correcta con `crypto.timingSafeEqual` |
| Logging de eventos | ✅ | Tabla `api_events` captura todo el ciclo |
| Manejo de errores | ✅ | Sentry + logs estructurados |
| Modo sandbox/producción | ✅ | Configuración por ambiente |

---

## 3. Análisis del Flujo de Reservas

### 3.1 Estado Actual del Sistema de Holds

```
┌─────────────────────────────────────────────────────────────┐
│               CICLO DE VIDA DE RESERVA                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   pending ─────────────────────> paid                       │
│      │          (Flow webhook)     │                        │
│      │                             │                        │
│      ├──> expired (job c/5min)     └──> (fin exitoso)       │
│      │                                                      │
│      └──> canceled (Flow cancela o usuario)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Problemas Identificados

#### 🔴 CRÍTICO 5: Expiración de Holds Inconsistente

**Ubicación:** `apps/web/app/api/bookings/hold/route.ts` (línea 128-145)

**Problema:** La limpieza de holds expirados se hace en el momento del nuevo hold, pero si nadie intenta reservar, los holds nunca se limpian hasta que el cron ejecute.

```typescript
// Línea 128-145 - Limpieza reactiva
const expiredConflicts = conflictingBookings?.filter((booking) => {
  if (booking.status === 'pending' && booking.expires_at) {
    return !isAfter(parseISO(booking.expires_at), new Date());
  }
  return false;
});
```

**Impacto:** El constraint `bookings_no_overlap` en PostgreSQL considera holds expirados como activos hasta que se actualicen.

**Recomendación:** El cron job (`/api/jobs/expire-holds`) debe ejecutarse cada 1-2 minutos, no cada 5:

```sql
-- Alternativa: Usar función PG para exclusión dinámica
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;
ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
EXCLUDE USING gist (
  cabin_id WITH =,
  daterange(start_date, end_date, '[)') WITH &&
) WHERE (
  status IN ('pending', 'paid') AND 
  (status = 'paid' OR expires_at > now())
);
```

#### 🟡 ADVERTENCIA 6: Validación de Fechas en Zona Horaria

**Ubicación:** `packages/core/src/lib/validations/booking.ts` (línea 63-71)

```typescript
// Obtener fecha actual en Chile (UTC-4/UTC-3)
const nowInChile = new Date().toLocaleDateString('en-CA', {
  timeZone: 'America/Santiago',
});
```

**Problema:** `toLocaleDateString` puede comportarse diferente según el runtime de Node.js y su configuración ICU.

**Recomendación:** Usar `date-fns-tz` para manejo explícito:

```typescript
import { toZonedTime, format } from 'date-fns-tz';

const CHILE_TZ = 'America/Santiago';
const nowInChile = toZonedTime(new Date(), CHILE_TZ);
const todayChileStr = format(nowInChile, 'yyyy-MM-dd', { timeZone: CHILE_TZ });
```

#### 🟡 ADVERTENCIA 7: Hold de 45 Minutos

```typescript
// Línea 188
const expiresAt = addMinutes(new Date(), 45);
```

**Contexto de negocio:** La documentación menciona 20-30 minutos, pero el código usa 45.

**Recomendación:** Parametrizar y documentar:

```typescript
const HOLD_DURATION_MINUTES = Number(process.env.BOOKING_HOLD_MINUTES) || 30;
```

### 3.3 Fortalezas del Sistema de Reservas

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| Validación con Zod | ✅ | Schemas bien definidos |
| Constraint de BD | ✅ | `EXCLUDE USING gist` previene overlap |
| Logging completo | ✅ | `api_events` registra todo |
| Cálculo de precios | ✅ | Función `calculatePrice` bien testeada |

---

## 4. Análisis de Arquitectura General

### 4.1 Patrones Bien Implementados

#### ✅ Separación de Responsabilidades

```
packages/core/src/
├── lib/
│   ├── auth/           # Autenticación admin
│   ├── config/         # Configuración de negocio
│   ├── data/           # Data fetching
│   ├── email/          # Servicio de correo
│   ├── flow/           # Cliente de pagos
│   ├── supabase/       # Cliente BD
│   ├── utils/          # Helpers puros
│   └── validations/    # Schemas Zod
└── types/              # Tipos TypeScript
```

**Evaluación:** Excelente organización para mantenibilidad.

#### ✅ Type Safety con Supabase

```typescript
// Patrón correcto: evitar .single() que retorna `never`
const { data: bookings } = await supabaseAdmin
  .from('bookings')
  .select('*')
  .eq('id', bookingId)
  .limit(1);

const booking = bookings?.[0] as Booking | undefined;
```

### 4.2 Áreas de Mejora Arquitectónica

#### 🟡 MEJORA 1: Falta de Capa de Servicio

**Problema actual:** La lógica de negocio está mezclada en los API routes.

**Ejemplo en** `apps/web/app/api/payments/flow/create/route.ts`:
- Validación
- Verificación de cabaña
- Verificación de expiración
- Creación de orden Flow
- Actualización de BD
- Logging

**Recomendación:** Extraer a servicio:

```typescript
// packages/core/src/services/payment.service.ts
export class PaymentService {
  async createPaymentOrder(bookingId: string): Promise<PaymentResult> {
    const booking = await this.bookingRepo.findById(bookingId);
    this.validateBookingForPayment(booking);
    
    const flowOrder = await this.flowClient.createPayment(...);
    await this.bookingRepo.updateFlowOrder(bookingId, flowOrder);
    
    return { paymentUrl: flowOrder.url, token: flowOrder.token };
  }
}
```

#### 🟡 MEJORA 2: Gestión de Estado en Cliente

**Problema:** El `BookingWizard` usa múltiples `useState` locales:

```typescript
const [currentStep, setCurrentStep] = useState<WizardStep>('dates');
const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
const [partySize, setPartySize] = useState<number>(initialPartySize);
const [datesConflictMessage, setDatesConflictMessage] = useState<string | null>(null);
```

**Recomendación:** Para un wizard de múltiples pasos, considerar:
- `useReducer` para estado complejo
- React Query/TanStack Query para fetching
- URL state para persistencia (ej: `/cabanas/slug?step=2&from=2025-01-15`)

#### 🟡 MEJORA 3: Sin Rate Limiting

**Problema:** Las APIs públicas no tienen protección contra abuso:
- `/api/availability` - puede ser spameado
- `/api/bookings/hold` - permite crear múltiples holds
- `/api/contact` - formulario sin protección

**Recomendación:** Implementar rate limiting con `@upstash/ratelimit` o middleware custom:

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
  }
  return NextResponse.next();
}
```

#### 🟡 MEJORA 4: Falta de Caché

**Problema:** Cada request a `/api/availability` hace queries a BD:

```typescript
// Línea 64-89 - Query sin caché
const { data: bookings, error: bookingsError } = await supabaseAdmin
  .from('bookings')
  .select('id, start_date, end_date, status, expires_at...')
  ...
```

**Recomendación:** Implementar caché con Vercel KV o Upstash Redis:

```typescript
import { kv } from '@vercel/kv';

const cacheKey = `availability:${cabinId}:${year}:${month}`;
const cached = await kv.get(cacheKey);
if (cached) return NextResponse.json(cached);

// ... compute availability ...

await kv.set(cacheKey, result, { ex: 60 }); // TTL 1 minuto
```

---

## 5. Análisis de Seguridad

### 5.1 Vulnerabilidades Identificadas

#### 🔴 CRÍTICO 8: Exposición de Información en Errores

**Ubicación:** Múltiples API routes

```typescript
// Ejemplo en flow/create/route.ts línea 327
const message = error instanceof Error ? error.message : 'Error al crear la orden de pago';
return NextResponse.json({ error: message, code: 'FLOW_PAYMENT_ERROR' }, { status: 500 });
```

**Problema:** Mensajes de error internos pueden exponer información sensible.

**Recomendación:** Sanitizar mensajes de error:

```typescript
const sanitizedError = error instanceof Error && !isProdRuntime 
  ? error.message 
  : 'Error interno. Contacta a soporte.';
```

#### 🟡 ADVERTENCIA 9: Sin CSRF Protection Explícita

**Problema:** Aunque Next.js tiene protección automática con SameSite cookies, las APIs no validan origen.

**Recomendación:** Agregar validación de `Origin` header para mutaciones:

```typescript
const origin = request.headers.get('origin');
const allowedOrigins = [process.env.NEXT_PUBLIC_SITE_URL];
if (!allowedOrigins.includes(origin)) {
  return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
}
```

### 5.2 Buenas Prácticas Implementadas

| Aspecto | Estado |
|---------|--------|
| HMAC para webhooks | ✅ |
| Variables env para secretos | ✅ |
| Validación de inputs con Zod | ✅ |
| Service Role solo en server | ✅ |
| Cookies httpOnly para admin | ✅ |

---

## 6. Análisis de Rendimiento

### 6.1 Optimizaciones Actuales

- ✅ Server Components por defecto
- ✅ Image optimization con next/image
- ✅ Code splitting automático

### 6.2 Oportunidades de Mejora

#### 🟡 MEJORA 5: N+1 Queries

**Ubicación:** `apps/web/app/page.tsx`

**Problema:** Al cargar cabañas, cada una podría generar queries adicionales para imágenes.

**Recomendación:** Usar `select()` con relaciones:

```typescript
const { data: cabins } = await supabaseAdmin
  .from('cabins')
  .select(`
    *,
    images:cabin_images(*)
  `)
  .eq('active', true);
```

#### 🟡 MEJORA 6: Componente de Calendario Pesado

**Ubicación:** `packages/ui/src/booking/AvailabilityCalendar.tsx`

**Problema:** `react-day-picker` se carga completamente en el bundle inicial.

**Recomendación:** Lazy loading:

```typescript
const AvailabilityCalendar = dynamic(
  () => import('./AvailabilityCalendar').then(mod => mod.AvailabilityCalendar),
  { loading: () => <CalendarSkeleton />, ssr: false }
);
```

---

## 7. Análisis de Testing

### 7.1 Cobertura Actual

| Tipo | Archivos | Estado |
|------|----------|--------|
| Unit (Vitest) | 5 | ✅ |
| E2E | 1 | ⚠️ Básico |
| Integration | 0 | ❌ |

### 7.2 Tests Recomendados a Agregar

1. **Integration tests para Flow webhook:**
```typescript
describe('Flow webhook integration', () => {
  it('should handle duplicate webhooks idempotently');
  it('should reject invalid signatures');
  it('should update booking status correctly');
});
```

2. **E2E para flujo completo:**
```typescript
describe('Complete booking flow', () => {
  it('should block dates after successful hold');
  it('should release dates after hold expiration');
  it('should send confirmation email after payment');
});
```

---

## 8. Plan de Mejoras Priorizado

### Fase 1: Críticos (Semana 1-2)

| # | Tarea | Esfuerzo | Impacto |
|---|-------|----------|---------|
| 1 | Implementar idempotencia en webhook | 2h | Alto |
| 2 | Agregar job de reconciliación de pagos | 4h | Alto |
| 3 | Rate limiting en APIs públicas | 3h | Alto |
| 4 | Sanitización de errores en producción | 2h | Medio |

### Fase 2: Importantes (Semana 3-4)

| # | Tarea | Esfuerzo | Impacto |
|---|-------|----------|---------|
| 5 | Extraer capa de servicios | 8h | Alto |
| 6 | Caché para disponibilidad | 4h | Medio |
| 7 | Mejorar constraint de overlap | 3h | Medio |
| 8 | Manejo de zonas horarias con date-fns-tz | 2h | Bajo |

### Fase 3: Deseables (Mes 2)

| # | Tarea | Esfuerzo | Impacto |
|---|-------|----------|---------|
| 9 | Lazy loading de calendario | 2h | Bajo |
| 10 | Estado con useReducer en wizard | 4h | Bajo |
| 11 | Tests de integración | 8h | Medio |
| 12 | Optimización de queries N+1 | 3h | Bajo |

---

## 9. Conclusiones

### Fortalezas del Sistema

1. **Arquitectura sólida** - Monorepo bien estructurado con separación clara
2. **Integración de pagos funcional** - Flow implementado correctamente
3. **Type safety** - TypeScript estricto con validaciones Zod
4. **Observabilidad** - Sentry + logging estructurado
5. **Documentación** - Extensa documentación técnica

### Áreas Críticas a Atender

1. **Idempotencia en webhooks** - Riesgo de estados inconsistentes
2. **Reconciliación de pagos** - Falta mecanismo de recuperación
3. **Rate limiting** - APIs expuestas a abuso
4. **Caché** - Performance subóptima en disponibilidad

### Evaluación General

| Criterio | Puntuación | Comentario |
|----------|------------|------------|
| Arquitectura | 8/10 | Bien estructurado, falta capa de servicios |
| Seguridad | 7/10 | HMAC correcto, falta rate limiting |
| Performance | 6/10 | Funcional, sin optimizaciones avanzadas |
| Mantenibilidad | 8/10 | Código limpio, buena documentación |
| Testing | 5/10 | Cobertura básica, falta integración |
| **Total** | **7/10** | Listo para producción con mejoras menores |

---

## Apéndice A: Checklist Pre-Producción

- [ ] Verificar `FLOW_FORCE_MOCK=false` en producción
- [ ] Configurar alertas de Sentry para eventos `payment_*`
- [ ] Implementar webhook idempotency
- [ ] Agregar rate limiting a APIs públicas
- [ ] Verificar cron job de expiración ejecuta cada 2-5 min
- [ ] Probar flujo completo en sandbox de Flow
- [ ] Documentar proceso de rollback

---

**Documento generado automáticamente - Revisión: 1.0**
