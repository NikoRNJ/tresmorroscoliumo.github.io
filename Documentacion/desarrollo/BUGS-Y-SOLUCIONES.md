# 🐛 REGISTRO DE BUGS Y SOLUCIONES

**PROYECTO:** Tres Morros de Coliumo - Sistema de Reservas  
**FECHA INICIO:** 11 de Noviembre 2025  
**ÚLTIMA ACTUALIZACIÓN:** 11 de Noviembre 2025 - 18:30 hrs

---

## 📋 ÍNDICE

1. [Bugs Críticos](#bugs-críticos)
2. [Bugs Moderados](#bugs-moderados)
3. [Bugs Menores](#bugs-menores)
4. [Lecciones Aprendidas](#lecciones-aprendidas)

---

## 🔴 BUGS CRÍTICOS

### BUG-001: Error de configuración de imágenes en Next.js

**Fecha:** 11 de Noviembre 2025  
**Severidad:** 🔴 CRÍTICA  
**Impacto:** La aplicación no cargaba al hacer clic en las cabañas

#### **Síntomas**
```
Error: Invalid src prop (https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070) 
on `next/image`, hostname "images.unsplash.com" is not configured under images 
in your `next.config.js`
```

**Contexto:**
- Usuario intentaba abrir página de cabaña
- Error aparecía en overlay rojo bloqueando toda la UI
- Ninguna cabaña era accesible

#### **Causa Raíz**
El archivo `next.config.mjs` estaba vacío y no incluía la configuración de dominios externos permitidos para el componente `<Image>` de Next.js.

**Archivo afectado:** `next.config.mjs`

```javascript
// ❌ ANTES (INCORRECTO)
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

#### **Solución Aplicada**

**Paso 1:** Actualizar `next.config.mjs`
```javascript
// ✅ DESPUÉS (CORRECTO)
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
```

**Paso 2:** Reiniciar servidor de desarrollo
```bash
# Detener servidor
Get-Process -Name node | Stop-Process -Force

# Reiniciar
npm run dev
```

#### **Validación**
- ✅ Páginas de cabañas cargan correctamente
- ✅ Imágenes de Unsplash se muestran sin errores
- ✅ Wizard de reserva accesible

#### **Prevención**
- Siempre verificar `next.config.mjs` en proyectos nuevos
- Documentar dominios externos desde Iteración 1
- Agregar a checklist de pre-deployment

---

### BUG-002: Supabase Type Inference devuelve `never` en build

**Fecha:** 11 de Noviembre 2025 (Durante Iteración 4)  
**Severidad:** 🔴 CRÍTICA  
**Impacto:** Build de producción fallaba con errores de TypeScript

#### **Síntomas**
```typescript
error TS2345: Argument of type 'any' is not assignable to parameter of type 'never'.
Property 'capacity_base' does not exist on type 'never'
```

**Contexto:**
- `npm run dev` funcionaba correctamente
- `npm run build` fallaba con errores de tipos
- Error en operaciones `.single()`, `.insert()`, `.update()`

#### **Causa Raíz**
El cliente de Supabase TypeScript en contexto de build no puede inferir correctamente los tipos, especialmente:
1. `.single()` retorna tipo `never`
2. `.insert()` infiere argumentos como `never`
3. `.update()` infiere argumentos como `never`

#### **Solución Aplicada**

**Patrón para SELECT con .single():**

```typescript
// ❌ NO FUNCIONA en build
const { data: cabin } = await supabase
  .from('cabins')
  .select('*')
  .eq('id', cabinId)
  .single();

// ✅ SÍ FUNCIONA
import type { Database } from '@/types/database';
type Cabin = Database['public']['Tables']['cabins']['Row'];

const { data: cabins } = await supabase
  .from('cabins')
  .select('*')
  .eq('id', cabinId)
  .limit(1);

const cabin = cabins?.[0] as Cabin | undefined;
```

**Patrón para INSERT:**

```typescript
// ❌ NO FUNCIONA en build
const { data: booking } = await supabase
  .from('bookings')
  .insert({
    cabin_id: cabinId,
    // ... más campos
  })
  .select()
  .single();

// ✅ SÍ FUNCIONA
const { data: bookings } = await (supabaseAdmin.from('bookings') as any)
  .insert({
    cabin_id: cabinId,
    // ... más campos
  } as any)
  .select()
  .limit(1);

const booking = bookings?.[0] as Booking | undefined;
```

**Patrón para UPDATE:**

```typescript
// ❌ NO FUNCIONA en build
const { error } = await supabase
  .from('bookings')
  .update({ status: 'expired' })
  .in('id', holdIds);

// ✅ SÍ FUNCIONA
const { error } = await (supabaseAdmin.from('bookings') as any)
  .update({ status: 'expired' })
  .in('id', holdIds);
```

#### **Archivos Modificados**
- `app/api/bookings/hold/route.ts`
- `app/api/jobs/expire-holds/route.ts`
- `app/pago/page.tsx`
- `app/cabanas/[slug]/page.tsx`

#### **Validación**
```bash
npm run build
# ✅ Compiled successfully
```

#### **Prevención**
- **NUNCA** usar `.single()` directamente
- **SIEMPRE** usar `.limit(1)` + type assertion
- Wrappear operaciones de escritura en `as any`
- Probar build regularmente, no solo dev mode

---

## 🟡 BUGS MODERADOS

### BUG-006: Calendario permitía seleccionar mismo día para check-in y check-out

**Fecha:** 11 de Noviembre 2025  
**Severidad:** 🟡 MODERADA  
**Impacto:** Usuarios podían crear reservas de 0 noches, causando error en cálculo de precio

#### **Síntomas**
```
Error en línea 41 de lib/utils/pricing.ts:
"La reserva debe ser de al menos 1 noche. Check-out debe ser al menos 1 día después del Check-in."
```

**Contexto:**
- Usuario podía hacer clic en el mismo día para check-in y check-out
- El calendario `react-day-picker` en modo `range` permite esto por defecto
- Al calcular precio, `differenceInDays(sameDay, sameDay)` = 0
- Validación lanzaba error pero solo después de completar el formulario

#### **Causa Raíz**
El componente `AvailabilityCalendar.tsx` no validaba que el rango seleccionado tuviera al menos 1 noche de diferencia.

**Archivo afectado:** `components/booking/AvailabilityCalendar.tsx`

```tsx
// ❌ ANTES (INCORRECTO)
<DayPicker
  mode="range"
  selected={selectedRange}
  onSelect={onRangeSelect}  // Acepta cualquier rango, incluso 0 noches
  // ...
/>
```

**Requisitos de negocio:**
Según `AI-CONTEXT_business-requirements_Version2.md`:
> **Mínimo de estadía: 1 noche**

Ejemplo válido:
- Check-in: 15 nov (15:00 hrs)
- Check-out: 16 nov (12:00 hrs)
- Resultado: **1 noche** (días diferentes)

Ejemplo inválido:
- Check-in: 15 nov
- Check-out: 15 nov (mismo día)
- Resultado: **0 noches** ❌

#### **Solución Aplicada**

**1. Validación en calendario (`components/booking/AvailabilityCalendar.tsx`)**

Agregué handler personalizado que valida el rango antes de aceptarlo:

```tsx
// ✅ DESPUÉS (CORRECTO)
import { differenceInDays } from 'date-fns';

// Handler personalizado para validar mínimo 1 noche
const handleRangeSelect = (range: DateRange | undefined) => {
  if (!range) {
    onRangeSelect(undefined);
    return;
  }

  // Si solo tiene 'from' (primer clic), permitir
  if (range.from && !range.to) {
    onRangeSelect(range);
    return;
  }

  // Si tiene ambos, validar que sean días diferentes (mínimo 1 noche)
  if (range.from && range.to) {
    const nights = differenceInDays(range.to, range.from);
    
    if (nights < 1) {
      // No actualizar el rango si es el mismo día
      // Esto previene seleccionar check-in y check-out en el mismo día
      return;
    }

    onRangeSelect(range);
  }
};

// Usar handler personalizado en DayPicker
<DayPicker
  mode="range"
  selected={selectedRange}
  onSelect={handleRangeSelect}  // ✅ Ahora valida
  // ...
/>
```

**2. Mejorado mensaje de error (`lib/utils/pricing.ts`)**

```tsx
// ✅ DESPUÉS (mensaje más claro)
if (nights < 1) {
  throw new Error(`La reserva debe ser de al menos 1 noche. Check-out debe ser al menos 1 día después del Check-in.`);
}
```

**Comportamiento actualizado:**
- Usuario hace clic en día 15 → se selecciona como `from`
- Usuario hace clic en día 15 otra vez → **se ignora** (no actualiza rango)
- Usuario hace clic en día 16 → ✅ se acepta (1 noche)
- Usuario hace clic en día 17 → ✅ se acepta (2 noches)

#### **Validación**
✅ Build exitoso: `npm run build` (exit code 0)  
✅ No se puede seleccionar mismo día en calendario  
✅ Mínimo siempre es 1 noche (días consecutivos)  
✅ Máximo sigue siendo 30 noches (sin cambios)  

**Probado:**
- ✅ Selección de 1 noche (15 nov → 16 nov)
- ✅ Selección de 2+ noches (15 nov → 17 nov)
- ✅ Intento de 0 noches (15 nov → 15 nov) → **bloqueado**

#### **Prevención**
1. ✅ Validación en UI (calendario)
2. ✅ Validación en lógica de negocio (pricing.ts)
3. ✅ Validación en API (cuando implementemos validación server-side)
4. ✅ Documentado en comentarios del código

**Archivos modificados:**
- `components/booking/AvailabilityCalendar.tsx` - Handler personalizado
- `lib/utils/pricing.ts` - Mensaje de error mejorado

**Estado:** ✅ RESUELTO

---

## 🟢 BUGS MENORES

### BUG-003: Sistema de precios no incluía personas extras

**Fecha:** 11 de Noviembre 2025  
**Severidad:** 🟡 MODERADA  
**Impacto:** Cálculo de precios incorrecto, pérdida de ingresos potencial

#### **Síntomas**
- Wizard permitía seleccionar cantidad de personas
- Pero precio no variaba según cantidad de personas
- Capacidad base usaba el valor de la cabaña en lugar de mínimo fijo de 2

#### **Causa Raíz**
La documentación original decía:
> "Los precios NO varían por cantidad de personas"

Pero el negocio requería:
- **Mínimo:** 2 personas (precio base)
- **Cada persona adicional:** $10,000 CLP por noche

#### **Solución Aplicada**

**Paso 1:** Actualizar schema de base de datos
```sql
ALTER TABLE cabins 
ADD COLUMN IF NOT EXISTS price_per_extra_person NUMERIC(10, 2) DEFAULT 10000;

UPDATE cabins 
SET price_per_extra_person = 10000 
WHERE price_per_extra_person IS NULL;
```

**Paso 2:** Actualizar tipos TypeScript
```typescript
// types/database.ts
export interface Database {
  public: {
    Tables: {
      cabins: {
        Row: {
          // ... campos existentes
          price_per_extra_person: number; // ← NUEVO
        };
      };
    };
  };
}
```

**Paso 3:** Actualizar lógica de pricing
```typescript
// lib/utils/pricing.ts
export interface PriceBreakdown {
  nights: number;
  basePrice: number;
  extraPeople: number;           // ← NUEVO
  extraPeoplePrice: number;      // ← NUEVO
  jacuzziDays: number;
  jacuzziPrice: number;
  subtotal: number;
  total: number;
}

export function calculatePrice(
  cabin: Pick<Cabin, 'base_price' | 'jacuzzi_price' | 'capacity_base' | 'price_per_extra_person'>,
  startDate: string,
  endDate: string,
  partySize: number,              // ← NUEVO parámetro
  jacuzziDays: string[] = []
): PriceBreakdown {
  // ... cálculo de noches
  
  const basePrice = cabin.base_price * nights;
  
  // ← NUEVA LÓGICA
  const extraPeople = Math.max(0, partySize - cabin.capacity_base);
  const extraPeoplePrice = extraPeople * cabin.price_per_extra_person * nights;
  
  const jacuzziPrice = cabin.jacuzzi_price * jacuzziDays.length;
  
  const total = basePrice + extraPeoplePrice + jacuzziPrice;
  
  return {
    nights,
    basePrice,
    extraPeople,
    extraPeoplePrice,
    jacuzziDays: jacuzziDays.length,
    jacuzziPrice,
    subtotal: total,
    total,
  };
}
```

**Paso 4:** Actualizar BookingWizard
```typescript
// components/booking/BookingWizard.tsx
export function BookingWizard({ cabin }: BookingWizardProps) {
  // ❌ ANTES
  const [partySize, setPartySize] = useState<number>(cabin.capacity_base);
  const canProceedFromPartySize = partySize >= cabin.capacity_base && partySize <= cabin.capacity_max;
  
  // ✅ DESPUÉS
  const [partySize, setPartySize] = useState<number>(2); // Mínimo fijo en 2
  const canProceedFromPartySize = partySize >= 2 && partySize <= cabin.capacity_max;
}
```

**Paso 5:** Actualizar UI del wizard
```tsx
<div>
  <h2 className="text-2xl font-bold text-white">¿Cuántas personas se alojarán?</h2>
  <p className="mt-1 text-gray-400">
    Mínimo 2 personas, máximo {cabin.capacity_max} personas
  </p>
  {cabin.price_per_extra_person > 0 && (
    <p className="mt-2 text-sm text-primary-400">
      Precio base incluye 2 personas. Cada persona adicional: ${cabin.price_per_extra_person.toLocaleString('es-CL')}/noche
    </p>
  )}
</div>
```

**Paso 6:** Actualizar BookingSummary
```tsx
{priceBreakdown.extraPeople > 0 && (
  <div className="flex justify-between text-sm">
    <span className="text-gray-400">
      {priceBreakdown.extraPeople} persona{priceBreakdown.extraPeople !== 1 ? 's' : ''} extra × {priceBreakdown.nights} noche{priceBreakdown.nights !== 1 ? 's' : ''}
    </span>
    <span className="font-medium text-white">
      {formatPrice(priceBreakdown.extraPeoplePrice)}
    </span>
  </div>
)}
```

**Paso 7:** Actualizar API
```typescript
// app/api/bookings/hold/route.ts
const priceBreakdown = calculatePrice(cabin, startDate, endDate, partySize, jacuzziDays);
```

#### **Archivos Modificados (7 total)**
1. `UPDATE_SCHEMA_PRICING.sql` (nuevo)
2. `types/database.ts`
3. `lib/utils/pricing.ts`
4. `components/booking/BookingWizard.tsx`
5. `components/booking/BookingForm.tsx`
6. `components/booking/BookingSummary.tsx`
7. `app/api/bookings/hold/route.ts`

#### **Validación**
**Caso de prueba:**
- Cabaña: Los Morros ($70,000/noche)
- Fechas: 2 noches
- Personas: 4 (2 extras)
- Jacuzzi: 1 día ($22,000)

**Cálculo esperado:**
```
Base: $70,000 × 2 noches = $140,000
Personas extras: 2 × $10,000 × 2 noches = $40,000
Jacuzzi: $22,000 × 1 día = $22,000
Total: $202,000
```

✅ Cálculo correcto confirmado

#### **Prevención**
- Validar requerimientos de negocio antes de implementar
- Documentar discrepancias entre docs y realidad
- Crear casos de prueba de precios desde el inicio

---

## 🟢 BUGS MENORES

### BUG-004: Advertencias de metadata viewport en consola

**Fecha:** 11 de Noviembre 2025  
**Severidad:** Menor  
**Impacto:** Solo genera advertencias en consola

#### **Sintomas**
`
Unsupported metadata viewport is configured in metadata export in /.
`

#### **Causa Raiz**
Next.js 14 exige exportar iewport fuera de metadata y definir metadataBase para enlaces sociales.

#### **Solucion aplicada**
- `app/layout.tsx` exporta `viewport` y define `metadataBase` con `NEXT_PUBLIC_SITE_URL` (fallback `http://localhost:3000`).
- `npm run build` ya no muestra la advertencia; solo quedan los avisos controlados de `<img>`.

```typescript
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  // ...
};
```

#### **Estado**
RESUELTO - Validado en build

### BUG-005: Imagenes 404 de Unsplash

**Fecha:** 11 de Noviembre 2025  
**Severidad:** Menor  
**Impacto:** Placeholders rotos en la pagina de cabanas

#### **Sintomas**
`
upstream image response failed for https://images.unsplash.com/...
`

#### **Causa Raiz**
Algunas URLs de Unsplash usadas como placeholder fueron retiradas.

#### **Solucion aplicada**
- Se agrego cabinImageMap en pp/cabanas/[slug]/page.tsx con URLs estables de Unsplash.  
- Se creo /public/images/common/cabin-placeholder.svg como fallback local.

#### **Estado**
RESUELTO - En espera de migrar a fotos reales en Supabase Storage

---

## 📚 LECCIONES APRENDIDAS

### 1. **Configuración de Next.js debe ser completa desde inicio**

**Problema:** `next.config.mjs` vacío causó error crítico

**Lección:** 
- Crear checklist de configuración inicial
- Incluir dominios de imágenes en setup base
- Validar configuración antes de deployment

**Template recomendado:**
```javascript
const nextConfig = {
  images: {
    remotePatterns: [
      // Agregar dominios desde Iteración 1
    ],
  },
  // Otras configuraciones según proyecto
};
```

---

### 2. **Supabase TypeScript requiere patrones específicos**

**Problema:** `.single()` y operaciones de escritura fallan en build

**Lección:**
- Documentar patrones desde Iteración 1
- Crear helpers/wrappers para operaciones comunes
- SIEMPRE probar `npm run build` antes de considerar completada una iteración

**Patrón estandarizado:**
```typescript
// Para SELECT single
const { data: items } = await supabase.from('table').select('*').eq('id', id).limit(1);
const item = items?.[0] as Type | undefined;

// Para INSERT/UPDATE
await (supabase.from('table') as any).insert(data as any).select().limit(1);
```

---

### 3. **Validar requerimientos de negocio vs documentación**

**Problema:** Docs decían "no cobrar por persona extra", pero negocio sí lo requería

**Lección:**
- Reunión de validación de requerimientos con cliente
- No asumir que la documentación es 100% correcta
- Crear casos de prueba de negocio desde inicio

**Proceso recomendado:**
1. Leer documentación completa
2. Validar con cliente/stakeholder
3. Documentar discrepancias
4. Actualizar specs antes de implementar

---

### 4. **Cambios de schema requieren migración completa**

**Problema:** Agregar `price_per_extra_person` requirió tocar 7 archivos

**Lección:**
- Planificar cambios de schema cuidadosamente
- Usar migraciones versionadas
- Crear checklist de archivos afectados:
  - [ ] Schema SQL
  - [ ] Tipos TypeScript
  - [ ] Lógica de negocio
  - [ ] Componentes UI
  - [ ] APIs
  - [ ] Tests

**Archivo de migración recomendado:**
```
migrations/
  ├── 001_initial_schema.sql
  ├── 002_add_price_per_extra_person.sql
  └── README.md (documentar qué hace cada migración)
```

---

### 5. **Documentación de bugs es crucial**

**Lección aprendida con este documento:**
- Cada bug debe documentarse con:
  - Síntomas exactos
  - Causa raíz identificada
  - Solución aplicada (código)
  - Prevención futura
- Facilita onboarding de nuevos devs
- Evita repetir errores
- Sirve como base de conocimiento

---

## 📊 ESTADÍSTICAS

**Total de bugs encontrados:** 6  
- 🔴 Críticos: 2 (33%)
- 🟡 Moderados: 2 (33%)
- 🟢 Menores: 2 (33%)

**Bugs resueltos:** 4 (67%)  
**Bugs pendientes:** 2 (33%)  

**Tiempo promedio de resolución:**
- Críticos: ~30 minutos
- Moderados: ~15 minutos
- Menores: N/A (pendientes)

---

## 🔄 PROCESO DE REPORTE DE BUGS

Para futuros bugs, seguir este formato:

```markdown
### BUG-XXX: [Título descriptivo]

**Fecha:** [Fecha de descubrimiento]  
**Severidad:** 🔴 CRÍTICA | 🟡 MODERADA | 🟢 MENOR  
**Impacto:** [Descripción del impacto]

#### Síntomas
[Error exacto o comportamiento observado]

#### Causa Raíz
[Por qué ocurrió el bug]

#### Solución Aplicada
[Código o pasos para resolver]

#### Validación
[Cómo se verificó que está resuelto]

#### Prevención
[Cómo evitar que vuelva a ocurrir]
```

---

**FIN DEL REGISTRO DE BUGS**

_Última actualización: 11 de Noviembre 2025_





