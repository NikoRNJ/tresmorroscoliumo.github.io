cd# Tres Morros de Coliumo - AI Agent Instructions

## Project Overview

**Type:** Next.js 14 booking system for 3 coastal cabins in Coliumo, Chile  
**Stack:** Next.js 14 (App Router), TypeScript, Supabase, Tailwind CSS, Flow payments  
**Architecture:** Full-stack with API routes, server/client components, PostgreSQL database  
**Client:** NikoRNJ - Coastal cabin rental business in Coliumo, Región del Bío-Bío

## Directorios a Ignorar (No Navegar)

Para evitar perder tiempo recorriendo carpetas sin valor funcional:

- `**/node_modules/`
- `**/.next/`, `**/build/`, `**/dist/`, `.turbo/`, `.swc/`
- `apps/web/.next`, `apps/web/node_modules`, `packages/*/node_modules`
- `coverage/`, `test-results/`, `playwright-report/`, `.playwright/`
- `.vercel/`, `.pnp`, `.pnp.js`, `.yarn/install-state.gz`
- Cualquier archivo de entorno (`.env*`) o artefacto generado automáticamente

Concéntrate únicamente en las carpetas con código fuente real del sistema (por ejemplo `apps/web/app`, `packages/core/src`, `packages/ui/src`, `Documentacion/**`, `tests/**`). Si necesitas referenciar dependencias, asume que están gestionadas por el gestor de paquetes y no inspecciones su contenido.

## Critical Context

### Documentation-First Development
**GOLDEN RULE:** Documentation in `Documentacion/AI-INSTRUCTIONS/` is the absolute source of truth. This project follows a strict iterative approach (Iterations 1-9). **Always read the corresponding iteration file COMPLETELY (twice recommended) before making ANY changes.**

Current progress tracked in: `Documentacion/desarrollo/PASOS COMPLETADOS/`

**Never assume you know better than the documentation.** If documentation conflicts with standard practices, documentation wins. Document exceptions only.

### Core Architecture Decisions

1. **Next.js App Router** (NOT Pages Router)
   - Server Components by default
   - Client Components only when needed (`'use client'`)
   - All data fetching in Server Components or API routes
   - Never mix server/client rendering patterns

2. **Business Rules (from AI-CONTEXT/AI-CONTEXT_business-requirements)**
   - 3 cabins: Vegas del Coliumo, Caleta del Medio, Los Morros
   - All cabins: 7 person capacity, $55,000 CLP/night, $25,000 CLP/day jacuzzi
   - 20-minute hold system before payment
   - Minimum 1 night, maximum 30 nights
   - Check-in: 15:00, Check-out: 12:00
   - No cancellations with refund (v1.0 - can reschedule once with 15 days notice)

3. **Database Schema** (`types/database.ts` + `supabase-schema.sql`)
   - `cabins`: capacity_base=2, capacity_max=7, price_per_extra_person=10000
   - `bookings`: 4 states (`pending`, `paid`, `expired`, `canceled`)
   - `admin_blocks`: dates blocked for maintenance
   - `api_events`: comprehensive logging system
   - Hold system: `expires_at` column (20 minutes from creation)

4. **Dual Supabase Clients**
   - `lib/supabase/client.ts`: Browser (NEXT_PUBLIC_ANON_KEY) - use in Client Components
   - `lib/supabase/server.ts`: Server (SERVICE_ROLE_KEY) - use in API routes ONLY
   - **NEVER expose SERVICE_ROLE_KEY to client**

5. **Type Safety Pattern (CRITICAL for builds)**
   - **NEVER use `.single()`** - it returns type `never` in production builds
   - Always use `.limit(1)` + array access + type assertion
   - Explicit return types on Supabase queries: `.returns<Array<Type>>()`
   - Never use `any` without `as any` wrapper for write operations
   - See BUG-002 in `Documentacion/desarrollo/BUGS-Y-SOLUCIONES.md`

6. **Pricing Logic** (`lib/utils/pricing.ts`)
   ```typescript
   calculatePrice(cabin, startDate, endDate, partySize, jacuzziDays)
   // Returns: { nights, basePrice, extraPeople, extraPeoplePrice, jacuzziDays, jacuzziPrice, total }
   // Formula: (base_price * nights) + (extraPeople * price_per_extra_person * nights) + (jacuzzi_price * jacuzziDays.length)
   ```

## Development Workflows

### Build Process (CRITICAL)
```bash
# Always test BOTH before committing
npm run dev      # Development - must work
npm run build    # Production build - MUST pass without TypeScript errors
```
**Common issue:** Code works in dev but fails in build due to type inference. Always run build before committing.

### Database Changes
1. Update `supabase-schema.sql` first
2. Run in Supabase SQL Editor
3. Regenerate types in `types/database.ts`
4. Update corresponding schemas in `lib/validations/`

### Testing Availability
```bash
# Health check
curl http://localhost:3000/api/health

# Availability API (requires cabinId UUID from database)
curl "http://localhost:3000/api/availability?cabinId=UUID&year=2025&month=11"
```

## Project-Specific Patterns

### Component Structure (enforced)
```typescript
// 1. Imports (grouped: React, Next.js, third-party, local)
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';

// 2. Interface definitions
interface Props {
  cabinId: string;
  onSuccess: () => void;
}

// 3. Component with Props destructuring
export function Component({ cabinId, onSuccess }: Props) {
  // 4. Hooks (useState, useEffect, etc.)
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // 5. Event handlers
  const handleSubmit = async () => {
    // logic
  };
  
  // 6. Early returns/guards
  if (!cabinId) return null;
  
  // 7. JSX return
  return <div>...</div>;
}
```

### Booking Wizard Pattern (3-step process)
Located in `components/booking/BookingWizard.tsx`:
```typescript
Step 1: 'dates' - AvailabilityCalendar (select check-in/out dates)
Step 2: 'party-size' - Number selector (2 to capacity_max)
Step 3: 'details' - BookingForm (customer data + jacuzzi selection)

// State management:
- selectedRange: DateRange | undefined
- partySize: number (default = capacity_base)
- Navigate between steps with validation
```

### Availability Calendar Colors
```typescript
// In AvailabilityCalendar.tsx
available: 'bg-green-100 hover:bg-green-200'   // Can book
pending: 'bg-yellow-100 text-yellow-900'       // Temporary hold (20min)
booked: 'bg-red-100 text-red-900'              // Paid reservation
blocked: 'bg-gray-300 text-gray-500'           // Admin maintenance block
disabled: 'opacity-50 cursor-not-allowed'      // Past dates
```

### API Route Pattern (`app/api/*/route.ts`)
```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Parse body
    const body = await request.json();
    
    // 2. Validate with Zod (from lib/validations/)
    const data = schema.parse(body);
    
    // 3. Use supabaseAdmin (from lib/supabase/server)
    const { data: result, error } = await supabaseAdmin
      .from('table')
      .select('*')
      .returns<Array<Type>>(); // ALWAYS explicit type
    
    // 4. Handle errors
    if (error) throw error;
    
    // 5. Return JSON
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

### Pricing Calculation (`lib/utils/pricing.ts`)
```typescript
// Takes 5 parameters (NOT 4):
calculatePrice(cabin, startDate, endDate, partySize, jacuzziDays)
// Returns PriceBreakdown with: nights, basePrice, extraPeoplePrice, jacuzziPrice, total
```

### Dark Theme Design System
- Background: `#0a0a0a` (dark-950)
- Cards: `#1a1a1a` (dark-900)
- Borders: `#2a2a2a` (dark-800)
- Accent: `#9d8f77` (primary-500) - golden/beige
- Always use: `bg-dark-950`, `text-white`, `border-dark-800`

## Known Issues & Solutions

### Image Configuration (BUG-001)
`next.config.mjs` MUST include:
```javascript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
  ],
}
```
**Symptom:** Error loading external images on cabin pages.  
**Impact:** Critical - pages fail to load.

### Pricing Calculation Error (BUG-003)
**Common mistake:** Forgetting the `partySize` parameter in `calculatePrice()`.

```typescript
// ❌ WRONG - Missing partySize parameter (4th argument)
calculatePrice(cabin, startDate, endDate, jacuzziDays)

// ✅ CORRECT - All 5 parameters
calculatePrice(cabin, startDate, endDate, partySize, jacuzziDays)
```

**Symptom:** TypeScript error "Argument of type 'string[]' is not assignable to parameter of type 'number'."  
**Files commonly affected:** `BookingSidebar.tsx`, `BookingForm.tsx`

### Supabase Type Inference (CRITICAL BUG)
**Problem:** `.single()` returns type `never` in production builds, causing TypeScript errors.

**Solution Pattern:**
```typescript
// ❌ WRONG - fails in build
const { data } = await supabaseAdmin.from('cabins').select('*').eq('id', id).single();

// ✅ CORRECT - works in build
const { data: cabins } = await supabaseAdmin
  .from('cabins')
  .select('*')
  .eq('id', id)
  .limit(1);
const cabin = cabins?.[0] as Cabin | undefined;
if (!cabin) return NextResponse.json({ error: 'Not found' }, { status: 404 });
```

**For INSERT/UPDATE:**
```typescript
// Wrap operations with (as any) to avoid type inference issues
const { data: bookings } = await (supabaseAdmin.from('bookings') as any)
  .insert({ ...data } as any)
  .select()
  .limit(1);
const booking = bookings?.[0] as Booking | undefined;
```

**Reference:** `Documentacion/desarrollo/BUGS-Y-SOLUCIONES.md` BUG-002

### Date Handling
- Always use `date-fns` for date operations
- Store dates as `YYYY-MM-DD` strings in database
- Use `parseISO()` to convert string to Date
- Use `format(date, 'yyyy-MM-dd')` to convert Date to string

### Validation Pattern (Client + Server)
**Client-side (React Hook Form + Zod):**
```typescript
// components/BookingForm.tsx
const schema = z.object({
  customerEmail: z.string().email('Email inválido'),
  customerPhone: z.string().min(8).regex(/^[+]?[\d\s()-]+$/),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

**Server-side (API Route + Zod):**
```typescript
// app/api/bookings/hold/route.ts
import { createBookingHoldSchema } from '@/lib/validations/booking';

const body = await request.json();
const data = createBookingHoldSchema.parse(body); // Throws ZodError if invalid
```

**Never skip server validation** - client validation is UX, server validation is security.

### Booking Hold System (Critical Business Logic)
```typescript
// When creating a hold (POST /api/bookings/hold):
1. Validate input data with Zod schema
2. Check cabin exists and is active
3. Validate party size within capacity (capacity_base to capacity_max)
4. Validate jacuzzi days are within booking range
5. Check for conflicting bookings:
   - Include 'pending' bookings that haven't expired
   - Include 'paid' bookings (always block)
   - Exclude expired holds
6. Check for admin blocks on those dates
7. Calculate total price using calculatePrice()
8. Insert booking with status='pending' and expires_at=now+20min
9. Log event in api_events table
10. Return booking ID and redirect URL to payment page

// Hold expiration (cron job /api/jobs/expire-holds):
- Runs every 5 minutes
- Finds bookings with status='pending' and expires_at < now
- Updates status to 'expired'
- Logs event
```

## File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `BookingForm.tsx`)
- Utilities: `camelCase.ts` (e.g., `calculatePrice.ts`)
- API Routes: `route.ts` in `app/api/[endpoint]/`
- Types: `PascalCase.ts` (e.g., `Database.ts`)

## Essential Files to Reference

- **Architecture:** `Documentacion/AI-INSTRUCTIONS/AI-INSTRUCTIONS_00-START-HERE_Version2.md`
- **Business Logic:** `Documentacion/AI-CONTEXT/AI-CONTEXT_business-requirements_Version2.md`
- **Database Schema:** `supabase-schema.sql` (single source of truth)
- **Type Definitions:** `types/database.ts`, `types/booking.ts`
- **Validation Schemas:** `lib/validations/booking.ts`
- **Common Bugs:** `Documentacion/desarrollo/BUGS-Y-SOLUCIONES.md`
- **Best Practices:** `Documentacion/desarrollo/BUENAS-PRACTICAS.md`

## Iteration System

Current state: **Iterations 1-4 complete**, starting Iteration 5 (Flow payment integration)

Before implementing ANY feature:
1. Read `Documentacion/AI-INSTRUCTIONS/AI-INSTRUCTIONS_0X-ITERATION-X_Version2.md` **completely (twice)**
2. Check if previous iteration is 100% complete in `PASOS COMPLETADOS/`
3. Follow steps sequentially - DO NOT skip or reorder
4. Mark completion in `Documentacion/desarrollo/PASOS COMPLETADOS/`
5. **Test build before moving to next iteration**

### Iteration Checklist
- **Iteration 1:** ✅ Project setup, Supabase, database schema, types
- **Iteration 2:** ✅ Frontend (Header, Footer, Home, Cabin pages, routing)
- **Iteration 3:** ✅ Calendar system, availability API, pricing calculator
- **Iteration 4:** ✅ Booking wizard, holds system, form validation
- **Iteration 5:** 🔄 Flow payment integration (CURRENT)
- **Iteration 6-9:** Pending (admin panel, email notifications, cron jobs, deployment)

## Environment Variables Required

```env
# SUPABASE (CRITICAL - Required for all operations)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # Public - safe for browser
SUPABASE_SERVICE_ROLE_KEY=eyJ...     # SECRET - server-only, bypasses RLS

# FLOW PAYMENT GATEWAY (Iteration 5+)
FLOW_API_KEY=xxx                      # Provided by Flow
FLOW_SECRET_KEY=xxx                   # SECRET - for HMAC signatures
FLOW_BASE_URL=https://sandbox.flow.cl/api  # sandbox or production

# SENDGRID EMAIL (Iteration 6+)
SENDGRID_API_KEY=SG.xxx              # SECRET - SendGrid API key
SENDGRID_FROM_EMAIL=no-reply@tresmorroscoliumo.cl
SENDGRID_FROM_NAME=Tres Morros de Coliumo

# APPLICATION
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # For redirects & emails
NEXT_PUBLIC_SITE_NAME=Tres Morros de Coliumo

# SECURITY (Iteration 7+)
CRON_SECRET=xxx                       # SECRET - min 32 chars for cron auth
FLOW_WEBHOOK_SECRET=xxx               # SECRET - for webhook validation
ADMIN_PASSWORD=xxx                    # SECRET - min 16 chars
```

**Critical notes:**
- Never commit `.env.local` or `.env.production`
- Always use `.env.example` as template
- SUPABASE_SERVICE_ROLE_KEY bypasses Row Level Security - use ONLY in API routes
- Flow requires HMAC SHA256 signatures - see `lib/flow/client.ts`

## When Things Break

1. **Always check `npm run build`** - not just `npm run dev`
   - Dev mode uses different type inference than build
   - Build errors often don't appear in dev
   - **Never commit without successful build**

2. Verify all environment variables are set
   - Check `.env.local` exists
   - Validate all required vars from `.env.example`

3. Consult `Documentacion/desarrollo/BUGS-Y-SOLUCIONES.md`
   - All known bugs with solutions documented
   - Includes BUG-001 (images), BUG-002 (types), BUG-003 (pricing)

4. Ensure Supabase schema matches `types/database.ts`
   - After schema changes, regenerate types
   - Run migration SQL in Supabase SQL Editor

5. Check iteration documentation was followed exactly
   - Skipped steps cause cascading errors
   - Each iteration builds on the previous one

6. Common quick fixes:
   ```bash
   # Kill all node processes
   Get-Process -Name node | Stop-Process -Force
   
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   
   # Restart dev server
   npm run dev
   ```
