# 🔧 ITERACIÓN 1: Setup del Proyecto y Base de Datos

**OBJETIVO:** Inicializar el proyecto Next.js, configurar Supabase y crear el esquema de base de datos completo.

**DURACIÓN ESTIMADA:** 2-3 horas

**ESTADO:** 🔴 Pendiente

---

## **📋 PRE-REQUISITOS**

Antes de comenzar esta iteración, asegúrate de que:

- [ ] Has leído completamente `00-START-HERE.md`
- [ ] Has leído todos los archivos en `AI-CONTEXT/`
- [ ] Tienes acceso a las credenciales de Supabase
- [ ] Node.js 20+ está instalado
- [ ] Git está configurado

---

## **🎯 OBJETIVOS DE ESTA ITERACIÓN**

Al finalizar, deberás tener:

1. ✅ Proyecto Next.js 14 inicializado con TypeScript
2. ✅ Tailwind CSS configurado
3. ✅ Supabase client configurado
4. ✅ Schema de base de datos creado y poblado
5. ✅ Variables de entorno configuradas
6. ✅ Estructura de carpetas base creada
7. ✅ Proyecto compilando sin errores

---

## **PASO 1: Inicializar Proyecto Next.js**

### **Instrucciones para el Agente IA:**

```bash
# EJECUTAR EN TERMINAL
# Asegúrate de estar en el directorio correcto

# Crear proyecto Next.js con configuración exacta
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src \
  --import-alias "@/*" \
  --eslint

# Si te pregunta algo, responde:
# - TypeScript: Yes
# - ESLint: Yes
# - Tailwind CSS: Yes
# - src/ directory: No
# - App Router: Yes
# - Import alias: @/*
```

### **Validación:**
```bash
# Debe aparecer esta estructura:
tree -L 1
# .
# ├── app/
# ├── node_modules/
# ├── public/
# ├── .eslintrc.json
# ├── .gitignore
# ├── next.config.js
# ├── package.json
# ├── postcss.config.js
# ├── tailwind.config.ts
# └── tsconfig.json
```

---

## **PASO 2: Instalar Dependencias**

### **Paquetes de Producción:**

```bash
npm install \
  @supabase/supabase-js \
  zod \
  date-fns \
  react-day-picker \
  @sendgrid/mail \
  react-hook-form \
  @hookform/resolvers \
  clsx \
  tailwind-merge
```

### **Paquetes de Desarrollo:**

```bash
npm install -D \
  @types/node \
  vitest \
  @vitejs/plugin-react \
  @playwright/test \
  prettier \
  prettier-plugin-tailwindcss
```

### **Validación:**

```bash
# Verificar que todo se instaló
npm list --depth=0

# Debe mostrar todos los paquetes listados arriba
```

---

## **PASO 3: Configurar Variables de Entorno**

### **Crear archivo `.env.local`:**

```env
# ==============================================
# SUPABASE
# ==============================================
# URL del proyecto (obtener de Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co

# Anon/Public Key (obtener de Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# Service Role Key (¡NUNCA exponer al cliente!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# ==============================================
# FLOW (SANDBOX para desarrollo)
# ==============================================
FLOW_API_KEY=tu-api-key-sandbox
FLOW_SECRET_KEY=tu-secret-key-sandbox
FLOW_BASE_URL=https://sandbox.flow.cl/api

# ==============================================
# SENDGRID
# ==============================================
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=no-reply@tresmorroscoliumo.cl
SENDGRID_FROM_NAME=Tres Morros de Coliumo

# ==============================================
# APLICACIÓN
# ==============================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Tres Morros de Coliumo

# ==============================================
# SEGURIDAD
# ==============================================
# Secret para validar cron jobs
CRON_SECRET=genera-un-string-aleatorio-largo-y-seguro

# Secret para validar webhooks de Flow
FLOW_WEBHOOK_SECRET=otro-string-aleatorio-seguro
```

### **Crear archivo `.env.example` (template para el cliente):**

```env
# Copiar a .env.local y completar con valores reales

# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# FLOW
FLOW_API_KEY=
FLOW_SECRET_KEY=
FLOW_BASE_URL=https://sandbox.flow.cl/api

# SENDGRID
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
SENDGRID_FROM_NAME=

# APLICACIÓN
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Tres Morros de Coliumo

# SEGURIDAD
CRON_SECRET=
FLOW_WEBHOOK_SECRET=
```

### **Actualizar `.gitignore`:**

```bash
# Agregar al final del .gitignore existente
echo "" >> .gitignore
echo "# Environment variables" >> .gitignore
echo ".env*.local" >> .gitignore
echo ".env.production" >> .gitignore
```

---

## **PASO 4: Crear Estructura de Carpetas**

### **Ejecutar comando para crear estructura:**

```bash
# ESTRUCTURA COMPLETA DEL PROYECTO
mkdir -p \
  app/api/bookings \
  app/api/payments/flow \
  app/api/contact \
  app/api/health \
  app/api/admin \
  app/cabanas/[slug] \
  app/admin \
  components/booking \
  components/cabin \
  components/ui \
  components/forms \
  lib/supabase \
  lib/flow \
  lib/email \
  lib/utils \
  lib/validations \
  types \
  public/images/cabins \
  public/images/common \
  AI-CONTEXT \
  AI-INSTRUCTIONS \
  AI-VALIDATION
```

### **Verificar estructura:**

```bash
tree -L 2 -d

# Debe mostrar:
# .
# ├── AI-CONTEXT
# ├── AI-INSTRUCTIONS
# ├── AI-VALIDATION
# ├── app
# │   ├── api
# │   ├── admin
# │   └── cabanas
# ├── components
# │   ├── booking
# │   ├── cabin
# │   ├── forms
# │   └── ui
# ├── lib
# │   ├── email
# │   ├── flow
# │   ├── supabase
# │   ├── utils
# │   └── validations
# ├── public
# │   └── images
# └── types
```

---

## **PASO 5: Configurar Supabase Client**

### **Archivo: `lib/supabase/client.ts`**

```typescript
/**
 * Supabase Client para uso en el CLIENTE (Browser)
 * Solo usa la ANON key que es segura para exponer
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Validar que las variables de entorno existen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

/**
 * Cliente de Supabase para usar en componentes del cliente
 * @example
 * import { supabase } from '@/lib/supabase/client'
 * const { data } = await supabase.from('cabins').select('*')
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // No necesitamos sesiones de usuario por ahora
  },
});
```

### **Archivo: `lib/supabase/server.ts`**

```typescript
/**
 * Supabase Client para uso en el SERVIDOR (API Routes, Server Components)
 * Usa la SERVICE_ROLE key que tiene permisos completos
 * ⚠️ NUNCA exponer este cliente al navegador
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  );
}

/**
 * Cliente de Supabase con permisos de admin
 * SOLO usar en:
 * - API Routes (app/api/*)
 * - Server Components
 * - Server Actions
 * 
 * ⚠️ NUNCA importar en componentes con 'use client'
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

---

## **PASO 6: Crear Schema de Base de Datos en Supabase**

### **Instrucciones:**

1. Ir a Supabase Dashboard: https://app.supabase.com
2. Seleccionar tu proyecto "tres-morros-coliumo"
3. Ir a "SQL Editor" (icono de SQL en el sidebar)
4. Crear nueva query
5. Copiar y pegar el siguiente SQL completo

### **SQL Schema Completo:**

```sql
-- ==============================================
-- TRES MORROS DE COLIUMO - DATABASE SCHEMA
-- Fecha: 2025-11-11
-- Autor: NikoRNJ
-- ==============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- TABLA: cabins
-- Descripción: Almacena información de las 3 cabañas
-- ==============================================
CREATE TABLE IF NOT EXISTS cabins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  capacity_base INTEGER NOT NULL CHECK (capacity_base > 0),
  capacity_max INTEGER NOT NULL CHECK (capacity_max >= capacity_base),
  base_price NUMERIC(10, 2) NOT NULL CHECK (base_price > 0),
  jacuzzi_price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (jacuzzi_price >= 0),
  amenities JSONB DEFAULT '[]'::jsonb,
  location_details TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para cabins
CREATE INDEX idx_cabins_slug ON cabins(slug);
CREATE INDEX idx_cabins_active ON cabins(active);

-- Comentarios
COMMENT ON TABLE cabins IS 'Información de las cabañas disponibles para reserva';
COMMENT ON COLUMN cabins.slug IS 'Identificador único URL-friendly (ej: vegas-del-coliumo)';
COMMENT ON COLUMN cabins.capacity_base IS 'Capacidad base incluida en precio base';
COMMENT ON COLUMN cabins.capacity_max IS 'Capacidad máxima permitida';
COMMENT ON COLUMN cabins.base_price IS 'Precio por noche en CLP';
COMMENT ON COLUMN cabins.jacuzzi_price IS 'Precio adicional por día de jacuzzi en CLP';

-- ==============================================
-- TABLA: cabin_images
-- Descripción: Imágenes de cada cabaña
-- ==============================================
CREATE TABLE IF NOT EXISTS cabin_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabin_id UUID NOT NULL REFERENCES cabins(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para cabin_images
CREATE INDEX idx_cabin_images_cabin_id ON cabin_images(cabin_id);
CREATE INDEX idx_cabin_images_sort_order ON cabin_images(cabin_id, sort_order);

-- Asegurar solo una imagen primaria por cabaña
CREATE UNIQUE INDEX idx_cabin_images_primary ON cabin_images(cabin_id) 
  WHERE is_primary = true;

COMMENT ON TABLE cabin_images IS 'Galería de imágenes de cada cabaña';
COMMENT ON COLUMN cabin_images.is_primary IS 'Imagen principal que se muestra en listados';

-- ==============================================
-- TABLA: bookings
-- Descripción: Reservas de cabañas
-- ==============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabin_id UUID NOT NULL REFERENCES cabins(id) ON DELETE RESTRICT,
  
  -- Fechas de la reserva
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date > start_date),
  nights INTEGER GENERATED ALWAYS AS (end_date - start_date) STORED,
  
  -- Información de huéspedes
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  
  -- Jacuzzi (array de fechas donde se solicitó jacuzzi)
  jacuzzi_days JSONB DEFAULT '[]'::jsonb,
  
  -- Estado de la reserva
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'paid', 'expired', 'canceled')),
  
  -- Información de pago
  flow_order_id TEXT UNIQUE,
  flow_payment_data JSONB,
  amount_base NUMERIC(10, 2) NOT NULL,
  amount_jacuzzi NUMERIC(10, 2) DEFAULT 0,
  amount_total NUMERIC(10, 2) NOT NULL,
  
  -- Información del cliente
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- Para holds temporales de 20 minutos
  paid_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ
);

-- Índices para bookings
CREATE INDEX idx_bookings_cabin_id ON bookings(cabin_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_flow_order ON bookings(flow_order_id);
CREATE INDEX idx_bookings_expires_at ON bookings(expires_at) 
  WHERE expires_at IS NOT NULL;

-- Prevenir reservas superpuestas
CREATE UNIQUE INDEX idx_bookings_no_overlap ON bookings(cabin_id, start_date, end_date)
  WHERE status IN ('pending', 'paid');

COMMENT ON TABLE bookings IS 'Reservas de cabañas (incluye pending holds y confirmadas)';
COMMENT ON COLUMN bookings.status IS 'pending=hold temporal, paid=confirmada, expired=hold expirado, canceled=cancelada';
COMMENT ON COLUMN bookings.expires_at IS 'Momento en que expira el hold (20 min desde creación)';
COMMENT ON COLUMN bookings.jacuzzi_days IS 'Array de fechas ISO donde se solicita jacuzzi: ["2025-12-25", "2025-12-26"]';

-- ==============================================
-- TABLA: admin_blocks
-- Descripción: Bloqueos manuales de fechas (mantenimiento, etc)
-- ==============================================
CREATE TABLE IF NOT EXISTS admin_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabin_id UUID NOT NULL REFERENCES cabins(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date >= start_date),
  reason TEXT,
  created_by TEXT, -- Email del admin que creó el bloqueo
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para admin_blocks
CREATE INDEX idx_admin_blocks_cabin_id ON admin_blocks(cabin_id);
CREATE INDEX idx_admin_blocks_dates ON admin_blocks(start_date, end_date);

COMMENT ON TABLE admin_blocks IS 'Bloqueos administrativos de fechas (mantenimiento, reparaciones)';

-- ==============================================
-- TABLA: api_events
-- Descripción: Log de eventos importantes (webhooks, pagos, emails)
-- ==============================================
CREATE TABLE IF NOT EXISTS api_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL, -- 'webhook_received', 'payment_success', 'email_sent', etc
  event_source TEXT NOT NULL, -- 'flow', 'sendgrid', 'system'
  booking_id UUID REFERENCES bookings(id),
  payload JSONB,
  status TEXT, -- 'success', 'error'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para api_events
CREATE INDEX idx_api_events_type ON api_events(event_type);
CREATE INDEX idx_api_events_booking ON api_events(booking_id);
CREATE INDEX idx_api_events_created ON api_events(created_at DESC);

COMMENT ON TABLE api_events IS 'Log de eventos del sistema para debugging y auditoría';

-- ==============================================
-- FUNCIONES AUXILIARES
-- ==============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en cabins
CREATE TRIGGER update_cabins_updated_at
  BEFORE UPDATE ON cabins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- DATOS INICIALES (SEED)
-- ==============================================

-- Insertar las 3 cabañas
INSERT INTO cabins (slug, title, description, capacity_base, capacity_max, base_price, jacuzzi_price, amenities, location_details)
VALUES 
  (
    'vegas-del-coliumo',
    'Vegas del Coliumo',
    'Cabaña amplia con vista panorámica al mar, terraza privada y acceso directo a la playa. Perfecta para familias que buscan tranquilidad y contacto con la naturaleza.',
    2,
    6,
    65000,
    20000,
    '["Terraza privada", "Vista al mar", "Acceso a playa", "Parrilla", "Cocina equipada", "WiFi", "Estacionamiento"]'::jsonb,
    'Ubicada en la zona alta con vistas privilegiadas al Océano Pacífico'
  ),
  (
    'caleta-del-medio',
    'Caleta del Medio',
    'Acogedora cabaña cercana a la caleta de pescadores artesanales. Ideal para parejas o familias pequeñas que desean experimentar la vida costera auténtica.',
    2,
    5,
    60000,
    18000,
    '["Cerca de caleta", "Vista al mar", "Cocina equipada", "Parrilla", "WiFi", "Estacionamiento"]'::jsonb,
    'A pasos de la caleta de pescadores, ambiente tranquilo y familiar'
  ),
  (
    'los-morros',
    'Los Morros',
    'Cabaña espaciosa y luminosa con jacuzzi opcional y vistas espectaculares a los característicos morros de Coliumo. Perfecta para grupos o familias grandes.',
    2,
    6,
    70000,
    22000,
    '["Vista a los Morros", "Jacuzzi disponible", "Amplio living", "Cocina completa", "Parrilla", "WiFi", "Estacionamiento", "Terraza"]'::jsonb,
    'Vista privilegiada a los morros, ambiente de lujo campestre'
  )
ON CONFLICT (slug) DO NOTHING;

-- Verificar que se insertaron
SELECT id, slug, title, base_price FROM cabins;

-- ==============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ==============================================
-- Por ahora deshabilitado, se configurará en iteración de admin
-- ALTER TABLE cabins ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- etc...

-- ==============================================
-- FIN DEL SCHEMA
-- ==============================================
```

### **Ejecutar el SQL:**

1. Pegar el SQL completo en el editor
2. Click en "Run" (o Ctrl/Cmd + Enter)
3. Verificar que no hay errores (debe mostrar "Success")
4. Verificar que las tablas se crearon:

```sql
-- Ejecutar esta query para verificar
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Debe mostrar:
-- admin_blocks
-- api_events
-- bookings
-- cabin_images
-- cabins
```

---

## **PASO 7: Generar Types de TypeScript desde Supabase**

### **Archivo: `types/database.ts`**

```typescript
/**
 * TIPOS GENERADOS DESDE SUPABASE
 * 
 * Este archivo define los tipos de TypeScript basados en el schema de Supabase.
 * 
 * Para regenerar estos tipos automáticamente:
 * 1. Instalar Supabase CLI: npm install -g supabase
 * 2. Ejecutar: supabase gen types typescript --project-id "tu-project-id" > types/database.ts
 * 
 * Por ahora, los definimos manualmente basados en el schema SQL.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      cabins: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          capacity_base: number;
          capacity_max: number;
          base_price: number;
          jacuzzi_price: number;
          amenities: Json;
          location_details: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          capacity_base: number;
          capacity_max: number;
          base_price: number;
          jacuzzi_price?: number;
          amenities?: Json;
          location_details?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          capacity_base?: number;
          capacity_max?: number;
          base_price?: number;
          jacuzzi_price?: number;
          amenities?: Json;
          location_details?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      cabin_images: {
        Row: {
          id: string;
          cabin_id: string;
          image_url: string;
          alt_text: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          cabin_id: string;
          image_url: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          cabin_id?: string;
          image_url?: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          cabin_id: string;
          start_date: string;
          end_date: string;
          nights: number;
          party_size: number;
          jacuzzi_days: Json;
          status: 'pending' | 'paid' | 'expired' | 'canceled';
          flow_order_id: string | null;
          flow_payment_data: Json | null;
          amount_base: number;
          amount_jacuzzi: number;
          amount_total: number;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          customer_notes: string | null;
          created_at: string;
          expires_at: string | null;
          paid_at: string | null;
          canceled_at: string | null;
        };
        Insert: {
          id?: string;
          cabin_id: string;
          start_date: string;
          end_date: string;
          party_size: number;
          jacuzzi_days?: Json;
          status?: 'pending' | 'paid' | 'expired' | 'canceled';
          flow_order_id?: string | null;
          flow_payment_data?: Json | null;
          amount_base: number;
          amount_jacuzzi?: number;
          amount_total: number;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          customer_notes?: string | null;
          created_at?: string;
          expires_at?: string | null;
          paid_at?: string | null;
          canceled_at?: string | null;
        };
        Update: {
          id?: string;
          cabin_id?: string;
          start_date?: string;
          end_date?: string;
          party_size?: number;
          jacuzzi_days?: Json;
          status?: 'pending' | 'paid' | 'expired' | 'canceled';
          flow_order_id?: string | null;
          flow_payment_data?: Json | null;
          amount_base?: number;
          amount_jacuzzi?: number;
          amount_total?: number;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          customer_notes?: string | null;
          created_at?: string;
          expires_at?: string | null;
          paid_at?: string | null;
          canceled_at?: string | null;
        };
      };
      admin_blocks: {
        Row: {
          id: string;
          cabin_id: string;
          start_date: string;
          end_date: string;
          reason: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cabin_id: string;
          start_date: string;
          end_date: string;
          reason?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cabin_id?: string;
          start_date?: string;
          end_date?: string;
          reason?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      api_events: {
        Row: {
          id: string;
          event_type: string;
          event_source: string;
          booking_id: string | null;
          payload: Json | null;
          status: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          event_source: string;
          booking_id?: string | null;
          payload?: Json | null;
          status?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          event_source?: string;
          booking_id?: string | null;
          payload?: Json | null;
          status?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// Tipos auxiliares útiles
export type Cabin = Database['public']['Tables']['cabins']['Row'];
export type CabinInsert = Database['public']['Tables']['cabins']['Insert'];
export type CabinUpdate = Database['public']['Tables']['cabins']['Update'];

export type Booking = Database['public']['Tables']['bookings']['Row'];
export type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
export type BookingUpdate = Database['public']['Tables']['bookings']['Update'];
export type BookingStatus = Booking['status'];

export type CabinImage = Database['public']['Tables']['cabin_images']['Row'];
export type AdminBlock = Database['public']['Tables']['admin_blocks']['Row'];
export type ApiEvent = Database['public']['Tables']['api_events']['Row'];
```

---

## **PASO 8: Configurar Tailwind CSS**

### **Actualizar `tailwind.config.ts`:**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Verde principal
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Azul mar
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Amarillo cálido
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## **PASO 9: Crear Utilidades Base**

### **Archivo: `lib/utils/cn.ts`**

```typescript
/**
 * Utilidad para combinar clases de Tailwind
 * Basada en clsx + tailwind-merge
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### **Archivo: `lib/utils/format.ts`**

```typescript
/**
 * Utilidades de formateo (números, fechas, etc)
 */

/**
 * Formatear precio en pesos chilenos
 * @example formatPrice(65000) => "$65.000"
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatear fecha en formato chileno
 * @example formatDate(new Date()) => "11 de noviembre de 2025"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Formatear rango de fechas
 * @example formatDateRange(start, end) => "25 - 28 de diciembre de 2025"
 */
export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  
  if (sameMonth && sameYear) {
    return `${start.getDate()} - ${end.getDate()} de ${formatDate(start)}`;
  }
  
  return `${formatDate(start)} - ${formatDate(end)}`;
}
```

---

## **PASO 10: Configurar ESLint y Prettier**

### **Archivo: `.prettierrc.json`**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### **Archivo: `.prettierignore`**

```
node_modules
.next
dist
build
.env*.local
public
```

---

## **PASO 11: Crear Health Check API**

### **Archivo: `app/api/health/route.ts`**

```typescript
/**
 * Health Check Endpoint
 * Verifica que la API está funcionando y puede conectarse a Supabase
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Intentar hacer una query simple a Supabase
    const { data, error } = await supabaseAdmin
      .from('cabins')
      .select('count')
      .limit(1)
      .single();

    if (error) throw error;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

---

## **✅ VALIDACIÓN DE LA ITERACIÓN 1**

Antes de continuar a la Iteración 2, verifica que TODO lo siguiente funciona:

### **Checklist de Validación:**

```bash
# 1. Compilar el proyecto sin errores
npm run build

# Debe completar sin errores

# 2. Verificar linting
npm run lint

# Debe mostrar: "No ESLint warnings or errors"

# 3. Verificar que el servidor arranca
npm run dev

# Abrir http://localhost:3000
# Debe mostrar la página por defecto de Next.js (por ahora)

# 4. Verificar health check
curl http://localhost:3000/api/health

# Debe devolver:
# {
#   "status": "ok",
#   "timestamp": "2025-11-11T03:44:38.000Z",
#   "database": "connected",
#   "environment": "development"
# }

# 5. Verificar variables de entorno
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"

# Debe mostrar la URL de Supabase (no undefined)

# 6. Verificar tipos de TypeScript
npx tsc --noEmit

# No debe mostrar errores
```

### **Verificar Base de Datos:**

```sql
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que las 3 cabañas existen
SELECT slug, title, base_price FROM cabins;

-- Debe mostrar:
-- vegas-del-coliumo | Vegas del Coliumo | 65000
-- caleta-del-medio | Caleta del Medio | 60000
-- los-morros | Los Morros | 70000

-- 2. Verificar estructura de tablas
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Debe mostrar: 5 (cabins, cabin_images, bookings, admin_blocks, api_events)
```

---

## **📝 CHECKLIST FINAL ITERACIÓN 1**

Marca cada item cuando esté completado:

- [ ] Proyecto Next.js creado
- [ ] Todas las dependencias instaladas
- [ ] Variables de entorno configuradas (`.env.local`)
- [ ] Estructura de carpetas creada
- [ ] Supabase client configurado (`lib/supabase/client.ts` y `server.ts`)
- [ ] Schema SQL ejecutado en Supabase
- [ ] Las 3 cabañas insertadas en la DB
- [ ] Types de TypeScript generados (`types/database.ts`)
- [ ] Tailwind CSS configurado
- [ ] Utilidades creadas (`lib/utils/`)
- [ ] Health check API funcionando
- [ ] `npm run build` compila sin errores
- [ ] `npm run lint` pasa sin warnings
- [ ] `npm run dev` arranca correctamente
- [ ] Health check devuelve `status: ok`

---

## **🎯 PRÓXIMOS PASOS**

Si TODOS los checks anteriores están ✅, entonces:

1. ✅ Commit de todos los cambios:
```bash
git add .
git commit -m "feat: iteration 1 - project setup and database schema"
git push origin main
```

2. ✅ Continuar con **02-ITERATION-2.md** (Frontend Básico)

---

## **❌ Si algo falló:**

1. Revisa los logs de error cuidadosamente
2. Verifica que todas las variables de entorno están correctas
3. Asegúrate de que Supabase está accesible
4. Revisa que el SQL se ejecutó sin errores
5. Si es un error de tipos, regenera `types/database.ts`

---

**ESTADO:** 🔴 Pendiente → 🟢 Completada  
**PRÓXIMO ARCHIVO:** AI-INSTRUCTIONS/02-ITERATION-2.md

---

**FIN DE LA ITERACIÓN 1**