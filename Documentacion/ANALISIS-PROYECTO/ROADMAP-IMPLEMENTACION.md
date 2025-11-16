# 🗺️ ROADMAP DE IMPLEMENTACIÓN - FUNCIONALIDADES RECOMENDADAS

**Proyecto:** Tres Morros de Coliumo  
**Fecha:** 13 de Noviembre 2025  
**Estado actual:** Iteración 7 completada

---

## 📋 PLAN DE IMPLEMENTACIÓN RÁPIDA

### **FASE 1: QUICK WINS (1 semana - 8 horas total)**

Implementar las 4 funcionalidades de mayor impacto y menor esfuerzo.

---

## ✅ TAREA 1: SISTEMA DE DESCUENTOS (2 horas)

### **Objetivo:**
Implementar descuentos por cantidad de noches, temporada baja y cupones.

### **Archivos a crear:**

**1. Base de datos (30 min)**
```sql
-- migrations/add-discount-system.sql

-- Tabla de cupones
CREATE TABLE IF NOT EXISTS discount_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  max_uses INTEGER CHECK (max_uses > 0),
  times_used INTEGER DEFAULT 0,
  min_nights INTEGER DEFAULT 1,
  applicable_cabins JSONB DEFAULT '[]'::jsonb, -- [] = todas, ["slug1", "slug2"] = específicas
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_discount_coupons_code ON discount_coupons(code) WHERE active = true;
CREATE INDEX idx_discount_coupons_dates ON discount_coupons(valid_from, valid_until) WHERE active = true;

-- Comentarios
COMMENT ON TABLE discount_coupons IS 'Cupones de descuento para promociones';
COMMENT ON COLUMN discount_coupons.discount_type IS 'percent=porcentaje (15=15%), fixed=monto fijo (10000=$10,000)';

-- Agregar columna a bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_coupon_id UUID REFERENCES discount_coupons(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;

-- Cupones de ejemplo
INSERT INTO discount_coupons (code, discount_type, discount_value, valid_from, valid_until, max_uses) VALUES
('BIENVENIDA2025', 'percent', 10, '2025-01-01', '2025-12-31', 100),
('VERANO20', 'percent', 20, '2025-12-20', '2026-03-15', 50),
('PRIMERACOMPRA', 'fixed', 15000, '2025-01-01', '2025-12-31', 200);
```

**2. Tipos (10 min)**
```typescript
// types/database.ts - AGREGAR

discount_coupons: {
  Row: {
    id: string;
    code: string;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    valid_from: string;
    valid_until: string;
    max_uses: number | null;
    times_used: number;
    min_nights: number;
    applicable_cabins: string[];
    active: boolean;
    created_at: string;
  };
  Insert: {
    id?: string;
    code: string;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    valid_from: string;
    valid_until: string;
    max_uses?: number | null;
    times_used?: number;
    min_nights?: number;
    applicable_cabins?: string[];
    active?: boolean;
    created_at?: string;
  };
  Update: {
    // ... igual que Insert pero todo opcional
  };
};
```

**3. Lógica de descuentos (40 min)**
```typescript
// lib/utils/pricing.ts - MODIFICAR calculatePrice()

export interface PriceBreakdown {
  nights: number;
  basePrice: number;
  extraPeople: number;
  extraPeoplePrice: number;
  jacuzziDays: number;
  jacuzziPrice: number;
  subtotal: number;
  // NUEVOS
  nightsDiscount: number;        // Descuento por cantidad de noches
  seasonalDiscount: number;      // Descuento temporada baja
  couponDiscount: number;        // Descuento por cupón
  totalDiscounts: number;        // Suma de todos los descuentos
  total: number;                 // Total final
  includedGuests: number;
  appliedCouponCode?: string;    // Código aplicado
}

// Nueva función
export function calculateNightsDiscount(nights: number, subtotal: number): number {
  if (nights >= 30) return subtotal * 0.20;  // 20% descuento 1 mes+
  if (nights >= 14) return subtotal * 0.15;  // 15% descuento 2 semanas
  if (nights >= 7) return subtotal * 0.10;   // 10% descuento 1 semana
  return 0;
}

// Nueva función
export function calculateSeasonalDiscount(startDate: string, subtotal: number): number {
  const month = parseISO(startDate).getMonth() + 1; // 1-12
  // Temporada baja: Marzo-Noviembre (excepto Fiestas Patrias)
  // Temporada alta: Diciembre-Febrero + Semana de Fiestas Patrias
  
  // Fiestas Patrias (15-20 septiembre)
  const day = parseISO(startDate).getDate();
  if (month === 9 && day >= 15 && day <= 20) {
    return 0; // Sin descuento en Fiestas Patrias
  }
  
  // Verano (Diciembre-Febrero)
  if (month === 12 || month === 1 || month === 2) {
    return 0; // Sin descuento en verano
  }
  
  // Resto del año: 10% descuento
  return subtotal * 0.10;
}

// MODIFICAR función principal
export function calculatePrice(
  cabin: Pick<Cabin, 'base_price' | 'jacuzzi_price' | 'capacity_base' | 'capacity_max' | 'price_per_extra_person' | 'slug'>,
  startDate: string,
  endDate: string,
  partySize: number,
  jacuzziDays: string[] = [],
  coupon?: DiscountCoupon | null // NUEVO parámetro
): PriceBreakdown {
  // ... código existente ...
  
  const subtotal = basePrice + extraPeoplePrice + jacuzziPrice;
  
  // DESCUENTOS
  const nightsDiscount = calculateNightsDiscount(nights, subtotal);
  const seasonalDiscount = calculateSeasonalDiscount(startDate, subtotal);
  
  let couponDiscount = 0;
  let appliedCouponCode: string | undefined;
  
  if (coupon && coupon.active) {
    // Validar que el cupón aplica a esta cabaña
    const applicableCabins = coupon.applicable_cabins as string[];
    const appliesToAllCabins = !applicableCabins || applicableCabins.length === 0;
    const appliesToThisCabin = applicableCabins.includes(cabin.slug);
    
    if (appliesToAllCabins || appliesToThisCabin) {
      // Validar mínimo de noches
      if (nights >= coupon.min_nights) {
        if (coupon.discount_type === 'percent') {
          couponDiscount = subtotal * (coupon.discount_value / 100);
        } else {
          couponDiscount = coupon.discount_value;
        }
        appliedCouponCode = coupon.code;
      }
    }
  }
  
  const totalDiscounts = nightsDiscount + seasonalDiscount + couponDiscount;
  const total = Math.max(0, subtotal - totalDiscounts);
  
  return {
    nights,
    basePrice,
    extraPeople,
    extraPeoplePrice,
    jacuzziDays: jacuzziDaysCount,
    jacuzziPrice,
    subtotal,
    nightsDiscount,
    seasonalDiscount,
    couponDiscount,
    totalDiscounts,
    total,
    includedGuests,
    appliedCouponCode,
  };
}
```

**4. API validar cupón (20 min)**
```typescript
// app/api/coupons/validate/route.ts - CREAR

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  code: z.string().min(1),
  startDate: z.string(),
  nights: number(),
  cabinSlug: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, startDate, nights, cabinSlug } = schema.parse(body);
    
    // Buscar cupón
    const { data: coupons } = await supabaseAdmin
      .from('discount_coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .limit(1);
    
    const coupon = coupons?.[0];
    
    if (!coupon) {
      return NextResponse.json(
        { valid: false, error: 'Cupón no válido' },
        { status: 404 }
      );
    }
    
    // Validar fechas
    const today = new Date().toISOString().split('T')[0];
    if (today < coupon.valid_from || today > coupon.valid_until) {
      return NextResponse.json(
        { valid: false, error: 'Cupón expirado' },
        { status: 400 }
      );
    }
    
    // Validar usos
    if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
      return NextResponse.json(
        { valid: false, error: 'Cupón agotado' },
        { status: 400 }
      );
    }
    
    // Validar mínimo de noches
    if (nights < coupon.min_nights) {
      return NextResponse.json(
        { valid: false, error: `Mínimo ${coupon.min_nights} noches` },
        { status: 400 }
      );
    }
    
    // Validar cabaña aplicable
    const applicableCabins = coupon.applicable_cabins as string[];
    const appliesToAll = !applicableCabins || applicableCabins.length === 0;
    const appliesToCabin = applicableCabins.includes(cabinSlug);
    
    if (!appliesToAll && !appliesToCabin) {
      return NextResponse.json(
        { valid: false, error: 'Cupón no válido para esta cabaña' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ 
      valid: true, 
      coupon 
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { valid: false, error: 'Error al validar cupón' },
      { status: 500 }
    );
  }
}
```

**5. UI - Input de cupón (30 min)**
```typescript
// components/booking/CouponInput.tsx - CREAR

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface CouponInputProps {
  onCouponApplied: (coupon: any) => void;
  startDate: string;
  nights: number;
  cabinSlug: string;
}

export function CouponInput({ onCouponApplied, startDate, nights, cabinSlug }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);
  
  const handleValidate = async () => {
    if (!code.trim()) return;
    
    setIsValidating(true);
    setValidationResult(null);
    
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase(), startDate, nights, cabinSlug }),
      });
      
      const result = await response.json();
      setValidationResult(result);
      
      if (result.valid) {
        onCouponApplied(result.coupon);
      }
    } catch (error) {
      setValidationResult({ valid: false, error: 'Error de conexión' });
    } finally {
      setIsValidating(false);
    }
  };
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Código de descuento (opcional)
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="BIENVENIDA2025"
          className="flex-1 rounded-lg border border-dark-700 bg-dark-900 px-4 py-2 text-white placeholder-gray-500"
          disabled={isValidating || validationResult?.valid}
        />
        <Button
          type="button"
          onClick={handleValidate}
          disabled={!code.trim() || isValidating || validationResult?.valid}
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Aplicar'
          )}
        </Button>
      </div>
      
      {validationResult && (
        <div className={`flex items-center gap-2 text-sm ${validationResult.valid ? 'text-green-500' : 'text-red-500'}`}>
          {validationResult.valid ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Cupón aplicado correctamente
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              {validationResult.error}
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

**6. Modificar BookingSidebar (30 min)**
```typescript
// components/booking/BookingSidebar.tsx - MODIFICAR

import { CouponInput } from './CouponInput';

export function BookingSidebar({ ... }) {
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  
  const priceBreakdown = calculatePrice(
    cabin,
    startDate,
    endDate,
    partySize,
    jacuzziDays,
    appliedCoupon // NUEVO
  );
  
  return (
    <div>
      {/* ... código existente ... */}
      
      {/* AGREGAR input de cupón */}
      <CouponInput
        onCouponApplied={setAppliedCoupon}
        startDate={startDate}
        nights={priceBreakdown.nights}
        cabinSlug={cabin.slug}
      />
      
      {/* MODIFICAR desglose de precio */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>{formatPrice(priceBreakdown.subtotal)}</span>
        </div>
        
        {priceBreakdown.nightsDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-500">
            <span>Descuento por {priceBreakdown.nights} noches:</span>
            <span>-{formatPrice(priceBreakdown.nightsDiscount)}</span>
          </div>
        )}
        
        {priceBreakdown.seasonalDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-500">
            <span>Descuento temporada baja:</span>
            <span>-{formatPrice(priceBreakdown.seasonalDiscount)}</span>
          </div>
        )}
        
        {priceBreakdown.couponDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-500">
            <span>Cupón {priceBreakdown.appliedCouponCode}:</span>
            <span>-{formatPrice(priceBreakdown.couponDiscount)}</span>
          </div>
        )}
        
        <div className="border-t border-dark-700 pt-2">
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span className="text-xl text-primary-500">{formatPrice(priceBreakdown.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**7. Modificar API de hold (20 min)**
```typescript
// app/api/bookings/hold/route.ts - MODIFICAR

// Al crear el hold, si hay cupón:
if (couponId) {
  // Incrementar times_used
  await supabaseAdmin
    .from('discount_coupons')
    .update({ times_used: supabaseAdmin.sql`times_used + 1` })
    .eq('id', couponId);
}

// Guardar discount_amount y discount_coupon_id en booking
await supabaseAdmin.from('bookings').insert({
  // ... campos existentes ...
  discount_coupon_id: couponId,
  discount_amount: priceBreakdown.totalDiscounts,
});
```

---

## ✅ TAREA 2: GALERÍA DE FOTOS (3 horas)

### **Objetivo:**
Mostrar galería de fotos de cada cabaña y permitir upload desde admin.

### **Archivos a crear:**

**1. API de imágenes (30 min)**
```typescript
// app/api/cabins/[id]/images/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: images, error } = await supabaseAdmin
      .from('cabin_images')
      .select('*')
      .eq('cabin_id', params.id)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    
    return NextResponse.json({ images: images || [] });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}
```

**2. Componente de galería (1 hora)**
```typescript
// components/features/gallery/Gallery.tsx - REEMPLAZAR

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface GalleryProps {
  cabinId: string;
}

export function Gallery({ cabinId }: GalleryProps) {
  const [images, setImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetch(`/api/cabins/${cabinId}/images`)
      .then(r => r.json())
      .then(data => {
        setImages(data.images || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [cabinId]);
  
  if (isLoading) {
    return <div>Cargando galería...</div>;
  }
  
  if (images.length === 0) {
    return null;
  }
  
  const handlePrevious = () => {
    setSelectedImage(prev => 
      prev === null || prev === 0 ? images.length - 1 : prev - 1
    );
  };
  
  const handleNext = () => {
    setSelectedImage(prev => 
      prev === null || prev === images.length - 1 ? 0 : prev + 1
    );
  };
  
  return (
    <>
      {/* Grid de miniaturas */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setSelectedImage(index)}
            className="relative aspect-video overflow-hidden rounded-lg"
          >
            <Image
              src={image.image_url}
              alt={image.alt_text || `Imagen ${index + 1}`}
              fill
              className="object-cover transition hover:scale-105"
            />
          </button>
        ))}
      </div>
      
      {/* Lightbox */}
      {selectedImage !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 hover:bg-white/20"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          
          <button
            onClick={handlePrevious}
            className="absolute left-4 rounded-full bg-white/10 p-2 hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          
          <div className="relative max-h-[80vh] max-w-[90vw]">
            <Image
              src={images[selectedImage].image_url}
              alt={images[selectedImage].alt_text || ''}
              width={1200}
              height={800}
              className="h-auto w-auto max-h-[80vh] object-contain"
            />
          </div>
          
          <button
            onClick={handleNext}
            className="absolute right-4 rounded-full bg-white/10 p-2 hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
            {selectedImage + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
```

**3. Admin - Gestión de imágenes (1.5 horas)**
```typescript
// app/admin/cabanas/[id]/page.tsx - CREAR

import { supabaseAdmin } from '@/lib/supabase/server';
import { ImageUploader } from '@/components/admin/ImageUploader';

export default async function AdminCabinPage({ params }: { params: { id: string } }) {
  const { data: cabin } = await supabaseAdmin
    .from('cabins')
    .select('*')
    .eq('id', params.id)
    .limit(1);
  
  const { data: images } = await supabaseAdmin
    .from('cabin_images')
    .select('*')
    .eq('cabin_id', params.id)
    .order('sort_order');
  
  return (
    <div>
      <h1>{cabin?.[0]?.title}</h1>
      
      <ImageUploader 
        cabinId={params.id}
        existingImages={images || []}
      />
    </div>
  );
}
```

---

## ✅ TAREA 3: BLOQUEOS ADMINISTRATIVOS UI (2 horas)

### **Objetivo:**
Permitir al admin bloquear fechas para mantenimiento.

### **Archivos a crear:**

**1. API de bloqueos (40 min)**
```typescript
// app/api/admin/blocks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { z } from 'zod';

const schema = z.object({
  cabinId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string(),
});

export async function GET() {
  const isAuth = await requireAdmin();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data: blocks } = await supabaseAdmin
    .from('admin_blocks')
    .select('*, cabin:cabins(title)')
    .order('start_date', { ascending: false });
  
  return NextResponse.json({ blocks: blocks || [] });
}

export async function POST(request: NextRequest) {
  const isAuth = await requireAdmin();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { cabinId, startDate, endDate, reason } = schema.parse(body);
    
    // Validar que end >= start
    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'Fecha de fin debe ser mayor o igual a fecha de inicio' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabaseAdmin
      .from('admin_blocks')
      .insert({
        cabin_id: cabinId,
        start_date: startDate,
        end_date: endDate,
        reason,
        created_by: 'admin@tresmorros.cl',
      })
      .select()
      .limit(1);
    
    if (error) throw error;
    
    return NextResponse.json({ block: data?.[0] });
  } catch (error) {
    console.error('Error creating block:', error);
    return NextResponse.json({ error: 'Error al crear bloqueo' }, { status: 500 });
  }
}
```

**2. Página de bloqueos (1 hora)**
```typescript
// app/admin/bloqueos/page.tsx - CREAR

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils/format';

export default function AdminBlocksPage() {
  const [blocks, setBlocks] = useState([]);
  const [cabins, setCabins] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  
  useEffect(() => {
    // Fetch blocks
    fetch('/api/admin/blocks')
      .then(r => r.json())
      .then(data => setBlocks(data.blocks || []));
    
    // Fetch cabins
    fetch('/api/cabins')
      .then(r => r.json())
      .then(data => setCabins(data.cabins || []));
  }, []);
  
  const handleCreateBlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      cabinId: formData.get('cabinId'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      reason: formData.get('reason'),
    };
    
    try {
      const response = await fetch('/api/admin/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        // Refresh blocks
        const { blocks: newBlocks } = await fetch('/api/admin/blocks').then(r => r.json());
        setBlocks(newBlocks);
        e.currentTarget.reset();
      }
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Bloqueos Administrativos</h1>
      
      {/* Formulario */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-bold">Crear Nuevo Bloqueo</h2>
        <form onSubmit={handleCreateBlock} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cabaña</label>
            <select name="cabinId" className="mt-1 block w-full rounded-md border-gray-300" required>
              {cabins.map(cabin => (
                <option key={cabin.id} value={cabin.id}>{cabin.title}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha inicio</label>
              <input type="date" name="startDate" className="mt-1 block w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha fin</label>
              <input type="date" name="endDate" className="mt-1 block w-full" required />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Motivo</label>
            <textarea name="reason" className="mt-1 block w-full" rows={3} required />
          </div>
          
          <Button type="submit" disabled={isCreating}>
            {isCreating ? 'Creando...' : 'Crear Bloqueo'}
          </Button>
        </form>
      </div>
      
      {/* Tabla */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Cabaña</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Fechas</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Motivo</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Creado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {blocks.map(block => (
              <tr key={block.id}>
                <td className="px-6 py-4">{block.cabin.title}</td>
                <td className="px-6 py-4">
                  {formatDate(block.start_date)} - {formatDate(block.end_date)}
                </td>
                <td className="px-6 py-4">{block.reason}</td>
                <td className="px-6 py-4">{formatDate(block.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## ✅ TAREA 4: EXPORTAR CSV (1 hora)

### **Objetivo:**
Permitir exportar reservas a CSV para contabilidad.

### **Implementación:**

```typescript
// app/admin/reservas/page.tsx - AGREGAR

'use client';

function exportToCSV(bookings: Booking[]) {
  // Headers
  const headers = [
    'Referencia',
    'Fecha Creación',
    'Cliente',
    'Email',
    'Teléfono',
    'Cabaña',
    'Check-in',
    'Check-out',
    'Noches',
    'Personas',
    'Subtotal',
    'Descuento',
    'Total',
    'Estado',
    'Flow Order ID',
    'Fecha Pago'
  ];
  
  // Rows
  const rows = bookings.map(b => [
    b.id.substring(0, 8).toUpperCase(),
    format(parseISO(b.created_at), 'yyyy-MM-dd HH:mm'),
    b.customer_name,
    b.customer_email,
    b.customer_phone,
    b.cabin.title,
    b.start_date,
    b.end_date,
    b.nights,
    b.party_size,
    b.amount_base + b.amount_jacuzzi,
    b.discount_amount || 0,
    b.amount_total,
    b.status,
    b.flow_order_id || '',
    b.paid_at ? format(parseISO(b.paid_at), 'yyyy-MM-dd HH:mm') : ''
  ]);
  
  // Generate CSV
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reservas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// En el JSX
<Button onClick={() => exportToCSV(bookings)}>
  Exportar CSV
</Button>
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### **Fase 1 completada cuando:**
- [ ] Migración de descuentos ejecutada en Supabase
- [ ] API de cupones funcionando (`/api/coupons/validate`)
- [ ] Input de cupón visible en BookingForm
- [ ] Descuentos visibles en BookingSidebar
- [ ] Descuentos guardados en base de datos
- [ ] API de imágenes funcionando
- [ ] Galería visible en páginas de cabañas
- [ ] Admin puede ver/subir imágenes
- [ ] API de bloqueos funcionando
- [ ] Admin puede crear bloqueos desde UI
- [ ] Bloqueos reflejados en calendario
- [ ] Exportar CSV funciona desde admin/reservas

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DE FASE 1

### **Fase 2: Mejoras de experiencia (2 semanas)**
1. WhatsApp automático
2. Reviews y calificaciones
3. Email de recordatorio
4. Check-in digital

### **Fase 3: Analytics y optimización (1 semana)**
1. Dashboard avanzado
2. Métricas de conversión
3. A/B testing de precios
4. Heatmaps de disponibilidad

### **Fase 4: Deployment y producción (1 semana)**
1. Deploy en Vercel/DigitalOcean
2. Configurar dominio
3. SSL
4. Monitoreo (Sentry)
5. Backups automáticos

---

**FIN DEL ROADMAP**
