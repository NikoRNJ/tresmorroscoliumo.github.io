# ✅ BUENAS PRÁCTICAS DE DESARROLLO

**PROYECTO:** Tres Morros de Coliumo - Sistema de Reservas  
**FECHA:** 11 de Noviembre 2025  
**OBJETIVO:** Prevenir bugs y mantener código de calidad

---

## 📋 ÍNDICE

1. [Principios Fundamentales](#principios-fundamentales)
2. [Configuración de Proyecto](#configuración-de-proyecto)
3. [Trabajo con Supabase](#trabajo-con-supabase)
4. [TypeScript y Tipos](#typescript-y-tipos)
5. [Componentes React](#componentes-react)
6. [APIs y Endpoints](#apis-y-endpoints)
7. [Testing y Validación](#testing-y-validación)
8. [Git y Commits](#git-y-commits)
9. [Documentación](#documentación)
10. [Deployment](#deployment)

---

## 🎯 PRINCIPIOS FUNDAMENTALES

### 1. **Seguir la Documentación al Pie de la Letra**

**REGLA DE ORO:** Si la documentación existe, ES LA FUENTE DE VERDAD.

✅ **HACER:**
```typescript
// Leer el archivo de instrucciones completo ANTES de empezar
// Ejemplo: AI-INSTRUCTIONS_04-ITERATION-4_Version2.md

// Seguir el orden exacto de pasos
// PASO 1: Crear tipos
// PASO 2: Crear API
// PASO 3: Crear componentes
```

❌ **NO HACER:**
```typescript
// Asumir que sabes cómo funciona sin leer docs
// Implementar "tu versión mejorada" sin consultarlo
// Saltarte pasos porque "ya sabes"
```

**Excepciones permitidas:**
- Bug confirmado en la documentación
- Requerimiento de negocio cambia
- **SIEMPRE documentar la discrepancia**

---

### 2. **Validar Antes de Implementar**

✅ **HACER:**
```bash
# SIEMPRE antes de empezar una iteración:
1. Leer documentación completa (2 veces)
2. Validar requerimientos con cliente
3. Verificar que iteración anterior está 100% completa
4. Crear checklist de archivos a modificar
5. Planificar cambios de schema si aplican
```

❌ **NO HACER:**
```bash
# Empezar a codear sin entender el contexto
# Asumir que la documentación está desactualizada
# No validar requerimientos de negocio
```

---

### 3. **Probar en Desarrollo Y Build**

✅ **HACER:**
```bash
# Después de cada cambio significativo:
npm run dev      # ✅ Funciona en desarrollo
npm run build    # ✅ CRÍTICO: También debe funcionar en build
npm run start    # ✅ Probar producción local
```

❌ **NO HACER:**
```bash
# Solo probar con npm run dev
# Asumir que si dev funciona, build también funcionará
# Hacer commit sin verificar build
```

**Tiempo ahorrado:** Detectar errores de build en local vs en CI/CD puede ahorrar 30-60 minutos.

---

## ⚙️ CONFIGURACIÓN DE PROYECTO

### 1. **Next.js Config Completo desde Inicio**

✅ **next.config.mjs MÍNIMO:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. IMÁGENES EXTERNAS
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Para Supabase Storage
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  // 2. VARIABLES DE ENTORNO
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  
  // 3. HEADERS DE SEGURIDAD (opcional pero recomendado)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Checklist:**
- [ ] Configurar dominios de imágenes
- [ ] Validar variables de entorno
- [ ] Configurar redirects si aplican
- [ ] Agregar headers de seguridad
- [ ] Probar que build funciona

---

### 2. **Variables de Entorno**

✅ **ESTRUCTURA CORRECTA:**
```env
# .env.local (desarrollo)
# .env.production (producción)

# ==============================================
# AGRUPADAS POR SERVICIO
# ==============================================

# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# FLOW
FLOW_API_KEY=xxxxx
FLOW_SECRET_KEY=xxxxx
FLOW_BASE_URL=https://sandbox.flow.cl/api

# SENDGRID
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=no-reply@ejemplo.cl
SENDGRID_FROM_NAME=Nombre del Sitio

# APLICACIÓN
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Nombre del Sitio

# SEGURIDAD
CRON_SECRET=string-aleatorio-largo-y-seguro-min-32-chars
FLOW_WEBHOOK_SECRET=otro-string-aleatorio-seguro
ADMIN_PASSWORD=password-super-seguro-min-16-chars
```

**Buenas prácticas:**
- ✅ Sin espacios: `KEY=value` (NO `KEY= value`)
- ✅ Sin comillas: `KEY=value` (NO `KEY="value"`)
- ✅ Nombres descriptivos: `FLOW_API_KEY` (NO `KEY1`)
- ✅ Agrupar por servicio con comentarios
- ✅ Crear `.env.example` sin valores reales
- ✅ NUNCA commitear `.env.local` o `.env.production`

**Validación:**
```typescript
// lib/env.ts
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

// Llamar en app/layout.tsx o lib/supabase/server.ts
validateEnv();
```

---

## 🗄️ TRABAJO CON SUPABASE

### 1. **Patrón OBLIGATORIO para Queries**

#### **SELECT con .single() → NUNCA USAR**

❌ **NO HACER:**
```typescript
const { data: cabin, error } = await supabase
  .from('cabins')
  .select('*')
  .eq('id', cabinId)
  .single(); // ← ESTO FALLA EN BUILD
```

✅ **HACER:**
```typescript
import type { Database } from '@/types/database';
type Cabin = Database['public']['Tables']['cabins']['Row'];

const { data: cabins, error } = await supabase
  .from('cabins')
  .select('*')
  .eq('id', cabinId)
  .limit(1);

const cabin = cabins?.[0] as Cabin | undefined;

// SIEMPRE validar que existe
if (!cabin) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

**Razón:** `.single()` infiere tipo `never` en modo build de Next.js.

---

#### **INSERT → Requiere Type Assertion**

❌ **NO HACER:**
```typescript
const { data: booking } = await supabase
  .from('bookings')
  .insert({
    cabin_id: cabinId,
    start_date: startDate,
    // ...
  })
  .select()
  .single();
```

✅ **HACER:**
```typescript
type Booking = Database['public']['Tables']['bookings']['Row'];

const { data: bookings, error } = await (supabaseAdmin.from('bookings') as any)
  .insert({
    cabin_id: cabinId,
    start_date: startDate,
    // ...
  } as any)
  .select()
  .limit(1);

const booking = bookings?.[0] as Booking | undefined;

if (error || !booking) {
  console.error('Error creating booking:', error);
  return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
}
```

**Razón:** TypeScript no puede inferir tipos de insert en build.

---

#### **UPDATE → Wrapper con Type Assertion**

❌ **NO HACER:**
```typescript
const { error } = await supabase
  .from('bookings')
  .update({ status: 'expired' })
  .eq('id', bookingId);
```

✅ **HACER:**
```typescript
const { error } = await (supabaseAdmin.from('bookings') as any)
  .update({ status: 'expired' })
  .eq('id', bookingId);

if (error) {
  console.error('Error updating booking:', error);
  throw new Error('Failed to update');
}
```

---

### 2. **Queries Eficientes**

✅ **EVITAR N+1 QUERIES:**
```typescript
// ❌ MAL: 1 query por cabaña
const cabins = await supabase.from('cabins').select('*');
for (const cabin of cabins.data) {
  const images = await supabase
    .from('cabin_images')
    .select('*')
    .eq('cabin_id', cabin.id);
}

// ✅ BIEN: 1 sola query con join
const { data } = await supabase
  .from('cabins')
  .select(`
    *,
    images:cabin_images(*)
  `);
```

✅ **SELECT ESPECÍFICO:**
```typescript
// ❌ MAL: Trae todos los campos
.select('*')

// ✅ BIEN: Solo lo necesario
.select('id, title, slug, base_price')
```

✅ **USAR ÍNDICES:**
```sql
-- Agregar índices para columnas en WHERE
CREATE INDEX idx_bookings_cabin_dates 
ON bookings(cabin_id, start_date, end_date);

-- Verificar uso de índices
EXPLAIN ANALYZE
SELECT * FROM bookings 
WHERE cabin_id = 'xxx' 
AND start_date >= '2025-01-01';
```

---

### 3. **Manejo de Errores**

✅ **PATRÓN ESTÁNDAR:**
```typescript
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .limit(1);

// SIEMPRE verificar error primero
if (error) {
  console.error('Database error:', error);
  return NextResponse.json(
    { error: 'Database error', details: error.message },
    { status: 500 }
  );
}

// SIEMPRE verificar que data existe
const item = data?.[0];
if (!item) {
  return NextResponse.json(
    { error: 'Not found' },
    { status: 404 }
  );
}

// Ahora es seguro usar item
return NextResponse.json({ data: item });
```

---

## 📘 TYPESCRIPT Y TIPOS

### 1. **Tipos desde Database**

✅ **SIEMPRE usar tipos de database.ts:**
```typescript
import type { Database } from '@/types/database';

// Para Row (lectura)
type Cabin = Database['public']['Tables']['cabins']['Row'];

// Para Insert (creación)
type NewCabin = Database['public']['Tables']['cabins']['Insert'];

// Para Update (actualización)
type UpdateCabin = Database['public']['Tables']['cabins']['Update'];
```

❌ **NO CREAR tipos duplicados:**
```typescript
// ❌ MAL: Duplica definición
interface Cabin {
  id: string;
  title: string;
  // ... resto de campos
}

// ✅ BIEN: Usa el tipo generado
type Cabin = Database['public']['Tables']['cabins']['Row'];
```

---

### 2. **Interfaces para Props**

✅ **PATRÓN RECOMENDADO:**
```typescript
// Para componentes
interface BookingFormProps {
  cabin: Cabin;  // Tipo de database
  startDate: Date;
  endDate: Date;
  partySize: number;
  onBack: () => void;
}

// Para funciones
interface PriceBreakdown {
  nights: number;
  basePrice: number;
  extraPeople: number;
  extraPeoplePrice: number;
  jacuzziDays: number;
  jacuzziPrice: number;
  total: number;
}
```

---

### 3. **Type Guards**

✅ **VALIDAR TIPOS EN RUNTIME:**
```typescript
// Crear type guard
function isCabin(obj: any): obj is Cabin {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.base_price === 'number'
  );
}

// Usar en API
const body = await request.json();
if (!isCabin(body)) {
  return NextResponse.json(
    { error: 'Invalid cabin data' },
    { status: 400 }
  );
}
```

---

## ⚛️ COMPONENTES REACT

### 1. **Estructura de Componente**

✅ **TEMPLATE ESTÁNDAR:**
```typescript
'use client'; // Solo si usa hooks

import { useState } from 'react';
import type { Cabin } from '@/types/database';

interface BookingFormProps {
  cabin: Cabin;
  onSubmit: (data: BookingData) => void;
}

/**
 * Formulario de reserva con validación
 * 
 * @param cabin - Información de la cabaña
 * @param onSubmit - Callback al enviar formulario
 */
export function BookingForm({ cabin, onSubmit }: BookingFormProps) {
  // 1. HOOKS (arriba)
  const [data, setData] = useState<BookingData | null>(null);
  
  // 2. FUNCIONES (medio)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // lógica
  };
  
  // 3. RENDER (abajo)
  return (
    <form onSubmit={handleSubmit}>
      {/* JSX */}
    </form>
  );
}
```

**Orden importancia:**
1. Hooks
2. Funciones helper
3. Handlers de eventos
4. Render

---

### 2. **Props Drilling vs Context**

✅ **USAR PROPS cuando:**
- Máximo 2-3 niveles de profundidad
- Datos específicos del componente
- Performance es crítica

✅ **USAR CONTEXT cuando:**
- Datos globales (usuario, tema)
- Muchos niveles de profundidad
- Compartido por muchos componentes

```typescript
// Context para tema (ejemplo)
const ThemeContext = createContext<'light' | 'dark'>('dark');

// Provider en layout
export default function RootLayout({ children }) {
  return (
    <ThemeContext.Provider value="dark">
      {children}
    </ThemeContext.Provider>
  );
}

// Uso en componente
const theme = useContext(ThemeContext);
```

---

### 3. **Client vs Server Components**

✅ **SERVER COMPONENT (default):**
```typescript
// NO 'use client'
// Para páginas, layouts, componentes sin estado

export default async function CabinPage({ params }: Props) {
  // Puede hacer fetch directo a Supabase
  const { data } = await supabase.from('cabins').select('*');
  
  return <div>{/* JSX */}</div>;
}
```

✅ **CLIENT COMPONENT:**
```typescript
'use client'; // ← Requerido

// SOLO cuando necesitas:
// - useState, useEffect, otros hooks
// - Event handlers (onClick, onChange)
// - Browser APIs (window, localStorage)

export function BookingWizard({ cabin }: Props) {
  const [step, setStep] = useState(0); // Hook = client
  
  return <div onClick={() => setStep(1)}>{/* JSX */}</div>;
}
```

**REGLA:** Usar Server Components por default, Client solo cuando sea necesario.

---

## 🌐 APIS Y ENDPOINTS

### 1. **Estructura de Route Handler**

✅ **TEMPLATE ESTÁNDAR:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 1. SCHEMA DE VALIDACIÓN
const schema = z.object({
  cabinId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * POST /api/bookings
 * Crea una nueva reserva
 */
export async function POST(request: NextRequest) {
  try {
    // 2. PARSEAR Y VALIDAR
    const body = await request.json();
    const validatedData = schema.parse(body);
    
    // 3. LÓGICA DE NEGOCIO
    // ... operaciones de base de datos
    
    // 4. RESPUESTA EXITOSA
    return NextResponse.json(
      { success: true, data: result },
      { status: 201 }
    );
    
  } catch (error) {
    // 5. MANEJO DE ERRORES
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### 2. **Validación con Zod**

✅ **PATRONES COMUNES:**
```typescript
import { z } from 'zod';

// UUID
const uuidSchema = z.string().uuid();

// Email
const emailSchema = z.string().email();

// Fecha ISO
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// Teléfono chileno
const phoneSchema = z.string().regex(/^(\+?56)?[2-9]\d{8}$/);

// Rango de números
const partySizeSchema = z.number().int().min(2).max(10);

// Objeto completo
const bookingSchema = z.object({
  cabinId: uuidSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  partySize: partySizeSchema,
  customerEmail: emailSchema,
});

// Usar
const result = bookingSchema.parse(data); // Throw si falla
const result = bookingSchema.safeParse(data); // { success, data, error }
```

---

### 3. **Respuestas Consistentes**

✅ **FORMATO ESTÁNDAR:**
```typescript
// Éxito
return NextResponse.json(
  {
    success: true,
    data: result,
    message: 'Operation successful', // Opcional
  },
  { status: 200 }
);

// Error de validación (400)
return NextResponse.json(
  {
    success: false,
    error: 'Invalid input',
    code: 'VALIDATION_ERROR',
    details: zodError.errors,
  },
  { status: 400 }
);

// Error de negocio (409)
return NextResponse.json(
  {
    success: false,
    error: 'Dates not available',
    code: 'DATES_UNAVAILABLE',
  },
  { status: 409 }
);

// Error interno (500)
return NextResponse.json(
  {
    success: false,
    error: 'Internal server error',
    code: 'SERVER_ERROR',
  },
  { status: 500 }
);
```

---

## 🧪 TESTING Y VALIDACIÓN

### 1. **Checklist Pre-Commit**

✅ **ANTES DE CADA COMMIT:**
```bash
# 1. Lint
npm run lint

# 2. Type check
npx tsc --noEmit

# 3. Build
npm run build

# 4. Test manual
npm run dev
# Probar funcionalidad cambiada

# 5. Verificar que no rompiste nada
# Probar flujo completo de la feature
```

---

### 2. **Casos de Prueba Mínimos**

Para cada feature, probar:

✅ **HAPPY PATH:**
- Usuario completa flujo exitosamente
- Datos se guardan correctamente
- UI muestra información correcta

✅ **ERROR CASES:**
- Datos inválidos (validación funciona)
- Recursos no encontrados (404)
- Conflictos (409)
- Errores de servidor (500)

✅ **EDGE CASES:**
- Valores mínimos/máximos
- Fechas límite (hoy, pasado, futuro lejano)
- Strings vacíos, null, undefined
- Arrays vacíos

**Ejemplo para BookingForm:**
```
✅ Happy: Reserva 2 personas, 2 noches → Total correcto
✅ Error: Email inválido → Muestra error
✅ Error: Fechas en el pasado → Muestra error
✅ Edge: 10 personas (máximo) → Acepta
✅ Edge: 1 persona → Rechaza (mínimo 2)
```

---

## 📝 GIT Y COMMITS

### 1. **Mensajes de Commit Descriptivos**

✅ **FORMATO:**
```
[TIPO]: Descripción corta (máx 50 chars)

Descripción detallada si es necesario.
Explicar QUÉ cambió y POR QUÉ.

Archivos modificados:
- path/to/file1.ts
- path/to/file2.tsx

Relacionado a: #issue-number
```

**TIPOS:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `refactor`: Cambio de código sin cambiar funcionalidad
- `docs`: Cambios en documentación
- `style`: Formato, espacios, etc.
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

**Ejemplos:**
```bash
✅ BIEN:
feat: Agregar cálculo de precio por persona extra

Implementa BUG-003: Sistema de precios ahora incluye
cargo de $10,000 por cada persona adicional sobre
capacidad base de 2 personas.

Archivos modificados:
- lib/utils/pricing.ts
- components/booking/BookingWizard.tsx
- types/database.ts

❌ MAL:
"cambios"
"fix bugs"
"update"
```

---

### 2. **Branches**

✅ **ESTRATEGIA:**
```bash
main              # Producción, siempre estable
├─ develop        # Desarrollo, integración
   ├─ feature/booking-wizard    # Features
   ├─ fix/image-config          # Bug fixes
   └─ refactor/pricing-logic    # Refactors
```

**Nombrado:**
- `feature/nombre-descriptivo`
- `fix/bug-nombre`
- `refactor/componente-nombre`
- `docs/seccion-nombre`

---

## 📚 DOCUMENTACIÓN

### 1. **Comentarios en Código**

✅ **CUÁNDO COMENTAR:**
```typescript
// ✅ BIEN: Explicar POR QUÉ
// Usar .limit(1) en lugar de .single() porque
// .single() retorna tipo 'never' en build
const { data } = await supabase
  .from('cabins')
  .select('*')
  .limit(1);

// ✅ BIEN: Lógica compleja
// Calcular personas extras: Si capacity_base es 2 y 
// partySize es 4, entonces 2 personas extras × precio × noches
const extraPeople = Math.max(0, partySize - cabin.capacity_base);

// ❌ MAL: Obvio
// Sumar 1 a counter
counter = counter + 1;
```

✅ **JSDoc para funciones públicas:**
```typescript
/**
 * Calcula el precio total de una reserva
 * 
 * @param cabin - Información de la cabaña
 * @param startDate - Fecha inicio formato YYYY-MM-DD
 * @param endDate - Fecha fin formato YYYY-MM-DD
 * @param partySize - Cantidad de personas (mínimo 2)
 * @param jacuzziDays - Array de fechas con jacuzzi
 * @returns Desglose completo del precio
 * 
 * @example
 * const price = calculatePrice(
 *   cabin,
 *   '2025-01-01',
 *   '2025-01-03',
 *   4,
 *   ['2025-01-01']
 * );
 * // { nights: 2, basePrice: 140000, extraPeoplePrice: 40000, ... }
 */
export function calculatePrice(/* ... */) {
  // implementación
}
```

---

### 2. **README y Documentación**

✅ **ESTRUCTURA MÍNIMA:**
```markdown
# Nombre del Proyecto

## Descripción
Qué hace el proyecto y para quién

## Tecnologías
- Next.js 14
- Supabase
- TypeScript
- Tailwind CSS

## Setup Local
```bash
# Clonar
git clone ...

# Instalar
npm install

# Configurar .env.local
cp .env.example .env.local
# Editar .env.local con tus valores

# Ejecutar
npm run dev
```

## Estructura del Proyecto
```
├── app/           # Rutas y páginas
├── components/    # Componentes React
├── lib/           # Utilidades y helpers
└── types/         # Tipos TypeScript
```

## Deployment
Ver DEPLOYMENT.md

## Bugs Conocidos
Ver BUGS-Y-SOLUCIONES.md

## Contribuir
Ver CONTRIBUTING.md
```

---

## 🚀 DEPLOYMENT

### 1. **Checklist Pre-Deployment**

✅ **VERIFICAR:**
```bash
# 1. Build exitoso
npm run build && npm run start

# 2. Variables de entorno
# Verificar que .env.production tiene TODAS las variables

# 3. Migraciones de DB
# Ejecutar migrations en Supabase producción

# 4. Tests
# Ejecutar suite completa de tests

# 5. Lighthouse
# Performance > 80
# Accessibility > 90
# Best Practices > 90
# SEO > 90

# 6. Seguridad
# No hay secrets hardcodeados
# CORS configurado correctamente
# Rate limiting activado
```

---

### 2. **Rollback Plan**

✅ **TENER SIEMPRE:**
```bash
# 1. Backup de DB antes de migrations
# En Supabase: Backups automáticos cada 24h

# 2. Tag de última versión estable
git tag -a v1.0.0 -m "Versión estable antes de cambio X"
git push origin v1.0.0

# 3. Proceso de rollback documentado
# Ver ROLLBACK.md

# 4. Monitoreo activo post-deployment
# Logs en tiempo real
# Alertas configuradas
```

---

## 📊 MÉTRICAS DE CALIDAD

### 1. **Código**

✅ **OBJETIVOS:**
- Cobertura de tests: > 70%
- Complejidad ciclomática: < 10 por función
- Duplicación de código: < 3%
- Deuda técnica: 0 issues críticos

### 2. **Performance**

✅ **OBJETIVOS:**
- Tiempo de carga: < 3 segundos
- Time to Interactive: < 5 segundos
- Lighthouse Performance: > 90
- Build size: < 500 KB (First Load JS)

### 3. **Mantenibilidad**

✅ **OBJETIVOS:**
- Documentación: Todas las funciones públicas
- Tests: Todos los casos críticos
- README actualizado: Siempre
- Bugs documentados: 100%

---

## 🎓 RECURSOS DE APRENDIZAJE

### Documentación Oficial
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Docs](https://react.dev)

### Buenas Prácticas
- [Clean Code - Robert Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [The Pragmatic Programmer](https://pragprog.com/titles/tpp20/)
- [You Don't Know JS](https://github.com/getify/You-Dont-Know-JS)

---

## ✅ CHECKLIST FINAL

Antes de considerar una iteración completada:

- [ ] Código sigue patrones de este documento
- [ ] Todos los archivos tienen tipos correctos
- [ ] Build de producción exitoso
- [ ] Tests manuales pasados
- [ ] Documentación actualizada
- [ ] Bugs conocidos documentados
- [ ] Commit con mensaje descriptivo
- [ ] Pull request revisado (si aplica)
- [ ] Deploy a staging exitoso (si aplica)
- [ ] Cliente/stakeholder aprobó (si aplica)

---

**FIN DE BUENAS PRÁCTICAS**

_Última actualización: 11 de Noviembre 2025_

_Este documento es vivo y debe actualizarse cuando se descubran nuevos patrones o mejores prácticas._
