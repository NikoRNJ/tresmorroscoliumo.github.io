# 📅 ITERACIÓN 3: Sistema de Calendario y Disponibilidad

**OBJETIVO:** Implementar el calendario interactivo con visualización de disponibilidad en tiempo real y lógica de negocio para reservas.

**DURACIÓN ESTIMADA:** 4-5 horas

**ESTADO:** 🔴 Pendiente

**DEPENDENCIAS:** Iteración 2 completada ✅

---

## **📋 PRE-REQUISITOS**

Antes de comenzar, verifica que:

- [ ] Iteración 2 está 100% completada
- [ ] Todas las páginas de cabañas cargan correctamente
- [ ] Base de datos tiene las 3 cabañas
- [ ] `npm run dev` funciona sin errores
- [ ] No hay errores de TypeScript

---

## **🎯 OBJETIVOS DE ESTA ITERACIÓN**

Al finalizar, deberás tener:

1. ✅ Calendario interactivo con `react-day-picker`
2. ✅ API endpoint de disponibilidad (`/api/availability`)
3. ✅ Lógica de cálculo de fechas disponibles/bloqueadas
4. ✅ Visualización de estados: verde (disponible), amarillo (hold), rojo (reservado)
5. ✅ Validación de rangos de fechas
6. ✅ Cálculo automático de precio según fechas seleccionadas
7. ✅ Selector de jacuzzi por día
8. ✅ Componente de resumen de reserva

---

## **PASO 1: Instalar Dependencias del Calendario**

```bash
# Ya deberían estar instaladas de la Iteración 1, pero verificar:
npm install react-day-picker date-fns

# Verificar versiones
npm list react-day-picker date-fns

# Debe mostrar:
# react-day-picker@8.10.0 o superior
# date-fns@3.0.0 o superior
```

---

## **PASO 2: Crear Validaciones de Reserva**

### **Archivo: `lib/validations/booking.ts`**

```typescript
import { z } from 'zod';
import { addDays, isAfter, isBefore, parseISO, format } from 'date-fns';

/**
 * Schema de validación para disponibilidad
 */
export const availabilityQuerySchema = z.object({
  cabinId: z.string().uuid('ID de cabaña inválido'),
  year: z.coerce.number().int().min(2024).max(2030),
  month: z.coerce.number().int().min(1).max(12),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

/**
 * Schema de validación para crear hold de reserva
 */
export const createBookingHoldSchema = z
  .object({
    cabinId: z.string().uuid('ID de cabaña inválido'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
    partySize: z.number().int().min(1, 'Mínimo 1 persona').max(10, 'Máximo 10 personas'),
    jacuzziDays: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().default([]),
    customerName: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
    customerEmail: z.string().email('Email inválido'),
    customerPhone: z.string().min(8, 'Teléfono muy corto').max(20, 'Teléfono muy largo'),
    customerNotes: z.string().max(500, 'Notas muy largas').optional(),
  })
  .refine(
    (data) => {
      const start = parseISO(data.startDate);
      const end = parseISO(data.endDate);
      return isAfter(end, start);
    },
    {
      message: 'La fecha de fin debe ser posterior a la fecha de inicio',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      const start = parseISO(data.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return isAfter(start, today) || start.getTime() === today.getTime();
    },
    {
      message: 'La fecha de inicio no puede ser en el pasado',
      path: ['startDate'],
    }
  )
  .refine(
    (data) => {
      const start = parseISO(data.startDate);
      const end = parseISO(data.endDate);
      const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return nights >= 1 && nights <= 30;
    },
    {
      message: 'La estancia debe ser de mínimo 1 noche y máximo 30 noches',
      path: ['endDate'],
    }
  );

export type CreateBookingHold = z.infer<typeof createBookingHoldSchema>;

/**
 * Validar que las fechas de jacuzzi están dentro del rango de la reserva
 */
export function validateJacuzziDays(
  startDate: string,
  endDate: string,
  jacuzziDays: string[]
): boolean {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  return jacuzziDays.every((day) => {
    const jacuzziDate = parseISO(day);
    return (
      (isAfter(jacuzziDate, start) || jacuzziDate.getTime() === start.getTime()) &&
      isBefore(jacuzziDate, end)
    );
  });
}

/**
 * Generar array de fechas entre dos fechas
 */
export function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let currentDate = parseISO(startDate);
  const end = parseISO(endDate);

  while (isBefore(currentDate, end)) {
    dates.push(format(currentDate, 'yyyy-MM-dd'));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}
```

---

## **PASO 3: Crear Lógica de Cálculo de Precios**

### **Archivo: `lib/utils/pricing.ts`**

```typescript
import { differenceInDays, parseISO } from 'date-fns';
import type { Cabin } from '@/types/database';

/**
 * Calcular el precio total de una reserva
 */
export interface PriceBreakdown {
  nights: number;
  basePrice: number;
  jacuzziDays: number;
  jacuzziPrice: number;
  subtotal: number;
  total: number;
}

/**
 * Calcular el desglose de precio de una reserva
 *
 * @param cabin - Información de la cabaña
 * @param startDate - Fecha de inicio (YYYY-MM-DD)
 * @param endDate - Fecha de fin (YYYY-MM-DD)
 * @param jacuzziDays - Array de fechas con jacuzzi (YYYY-MM-DD)
 * @returns Desglose completo del precio
 */
export function calculatePrice(
  cabin: Pick<Cabin, 'base_price' | 'jacuzzi_price'>,
  startDate: string,
  endDate: string,
  jacuzziDays: string[] = []
): PriceBreakdown {
  // Calcular noches
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const nights = differenceInDays(end, start);

  if (nights < 1) {
    throw new Error('Debe haber al menos 1 noche de diferencia entre las fechas');
  }

  // Precio base (precio por noche * cantidad de noches)
  const basePrice = cabin.base_price * nights;

  // Precio de jacuzzi (precio por día * cantidad de días con jacuzzi)
  const jacuzziDaysCount = jacuzziDays.length;
  const jacuzziPrice = cabin.jacuzzi_price * jacuzziDaysCount;

  // Subtotal y total (por ahora son iguales, pero podríamos agregar descuentos)
  const subtotal = basePrice + jacuzziPrice;
  const total = subtotal;

  return {
    nights,
    basePrice,
    jacuzziDays: jacuzziDaysCount,
    jacuzziPrice,
    subtotal,
    total,
  };
}

/**
 * Formatear el desglose de precio para mostrar al usuario
 */
export function formatPriceBreakdown(breakdown: PriceBreakdown): string {
  const lines: string[] = [];

  lines.push(`${breakdown.nights} noche${breakdown.nights > 1 ? 's' : ''}: $${breakdown.basePrice.toLocaleString('es-CL')}`);

  if (breakdown.jacuzziDays > 0) {
    lines.push(`Jacuzzi (${breakdown.jacuzziDays} día${breakdown.jacuzziDays > 1 ? 's' : ''}): $${breakdown.jacuzziPrice.toLocaleString('es-CL')}`);
  }

  lines.push(`Total: $${breakdown.total.toLocaleString('es-CL')}`);

  return lines.join('\n');
}
```

---

## **PASO 4: Crear API de Disponibilidad**

### **Archivo: `app/api/availability/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { availabilityQuerySchema } from '@/lib/validations/booking';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO } from 'date-fns';

/**
 * GET /api/availability
 * 
 * Obtiene la disponibilidad de una cabaña para un mes específico
 * 
 * Query params:
 * - cabinId: UUID de la cabaña
 * - year: Año (ej: 2025)
 * - month: Mes (1-12)
 * 
 * Retorna:
 * {
 *   available: string[],   // Fechas completamente disponibles
 *   pending: string[],     // Fechas con hold temporal (amarillo)
 *   booked: string[],      // Fechas reservadas (rojo)
 *   blocked: string[]      // Fechas bloqueadas por admin
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Parsear y validar query params
    const searchParams = request.nextUrl.searchParams;
    const query = availabilityQuerySchema.parse({
      cabinId: searchParams.get('cabinId'),
      year: searchParams.get('year'),
      month: searchParams.get('month'),
    });

    const { cabinId, year, month } = query;

    // Verificar que la cabaña existe
    const { data: cabin, error: cabinError } = await supabaseAdmin
      .from('cabins')
      .select('id')
      .eq('id', cabinId)
      .single();

    if (cabinError || !cabin) {
      return NextResponse.json(
        { error: 'Cabaña no encontrada' },
        { status: 404 }
      );
    }

    // Calcular rango de fechas del mes
    const startDate = new Date(year, month - 1, 1);
    const endDate = endOfMonth(startDate);
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    // Obtener todas las reservas que afectan este mes
    // (reservas que empiezan antes del fin del mes Y terminan después del inicio del mes)
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('start_date, end_date, status')
      .eq('cabin_id', cabinId)
      .gte('end_date', startDateStr)
      .lte('start_date', endDateStr)
      .in('status', ['pending', 'paid']);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json(
        { error: 'Error al consultar reservas' },
        { status: 500 }
      );
    }

    // Obtener bloqueos administrativos
    const { data: blocks, error: blocksError } = await supabaseAdmin
      .from('admin_blocks')
      .select('start_date, end_date')
      .eq('cabin_id', cabinId)
      .gte('end_date', startDateStr)
      .lte('start_date', endDateStr);

    if (blocksError) {
      console.error('Error fetching blocks:', blocksError);
      return NextResponse.json(
        { error: 'Error al consultar bloqueos' },
        { status: 500 }
      );
    }

    // Generar todos los días del mes
    const allDaysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
    const allDaysStr = allDaysInMonth.map((day) => format(day, 'yyyy-MM-dd'));

    // Sets para categorizar fechas
    const bookedDates = new Set<string>();
    const pendingDates = new Set<string>();
    const blockedDates = new Set<string>();

    // Procesar reservas
    bookings?.forEach((booking) => {
      const start = parseISO(booking.start_date);
      const end = parseISO(booking.end_date);
      const bookingDays = eachDayOfInterval({ start, end });

      bookingDays.forEach((day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        
        // Solo agregar si está dentro del mes consultado
        if (allDaysStr.includes(dayStr)) {
          if (booking.status === 'paid') {
            bookedDates.add(dayStr);
          } else if (booking.status === 'pending') {
            pendingDates.add(dayStr);
          }
        }
      });
    });

    // Procesar bloqueos administrativos
    blocks?.forEach((block) => {
      const start = parseISO(block.start_date);
      const end = parseISO(block.end_date);
      const blockDays = eachDayOfInterval({ start, end });

      blockDays.forEach((day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        if (allDaysStr.includes(dayStr)) {
          blockedDates.add(dayStr);
        }
      });
    });

    // Calcular disponibles (los que no están en ninguna otra categoría)
    const availableDates = allDaysStr.filter(
      (day) => !bookedDates.has(day) && !pendingDates.has(day) && !blockedDates.has(day)
    );

    // Retornar la disponibilidad
    return NextResponse.json({
      available: availableDates,
      pending: Array.from(pendingDates),
      booked: Array.from(bookedDates),
      blocked: Array.from(blockedDates),
    });
  } catch (error) {
    console.error('Error in availability endpoint:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

---

## **PASO 5: Crear Hook Personalizado para el Calendario**

### **Archivo: `lib/hooks/useAvailability.ts`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface AvailabilityData {
  available: string[];
  pending: string[];
  booked: string[];
  blocked: string[];
}

interface UseAvailabilityReturn {
  availability: AvailabilityData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook para obtener la disponibilidad de una cabaña
 * 
 * @param cabinId - ID de la cabaña
 * @param currentMonth - Fecha del mes a consultar
 */
export function useAvailability(
  cabinId: string | null,
  currentMonth: Date
): UseAvailabilityReturn {
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = async () => {
    if (!cabinId) return;

    setIsLoading(true);
    setError(null);

    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1; // getMonth() es 0-indexed

      const params = new URLSearchParams({
        cabinId,
        year: year.toString(),
        month: month.toString(),
      });

      const response = await fetch(`/api/availability?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener disponibilidad');
      }

      const data: AvailabilityData = await response.json();
      setAvailability(data);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [cabinId, currentMonth]);

  return {
    availability,
    isLoading,
    error,
    refetch: fetchAvailability,
  };
}
```

---

## **PASO 6: Crear Componente de Calendario**

### **Archivo: `components/booking/AvailabilityCalendar.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { format, parseISO, addMonths, subMonths } from 'date-fns';
import { useAvailability } from '@/lib/hooks/useAvailability';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import 'react-day-picker/dist/style.css';

interface AvailabilityCalendarProps {
  cabinId: string;
  onRangeSelect: (range: DateRange | undefined) => void;
  selectedRange?: DateRange;
}

/**
 * Calendario de disponibilidad de cabaña
 * 
 * Colores:
 * - Verde: Disponible
 * - Amarillo: Hold temporal (pending)
 * - Rojo: Reservado (paid)
 * - Gris: Bloqueado por admin
 */
export function AvailabilityCalendar({
  cabinId,
  onRangeSelect,
  selectedRange,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { availability, isLoading, error } = useAvailability(cabinId, currentMonth);

  // Convertir arrays de strings a Sets de Dates para react-day-picker
  const bookedDates = availability?.booked.map((d) => parseISO(d)) || [];
  const pendingDates = availability?.pending.map((d) => parseISO(d)) || [];
  const blockedDates = availability?.blocked.map((d) => parseISO(d)) || [];
  const availableDates = availability?.available.map((d) => parseISO(d)) || [];

  // Todas las fechas no disponibles (para deshabilitar en el calendario)
  const disabledDates = [...bookedDates, ...blockedDates, ...pendingDates];

  // Modifiers para los estilos
  const modifiers = {
    booked: bookedDates,
    pending: pendingDates,
    blocked: blockedDates,
    available: availableDates,
  };

  const modifiersStyles = {
    booked: {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      fontWeight: 'bold',
    },
    pending: {
      backgroundColor: '#fef3c7',
      color: '#d97706',
      fontWeight: 'bold',
    },
    blocked: {
      backgroundColor: '#f3f4f6',
      color: '#9ca3af',
      textDecoration: 'line-through',
    },
    available: {
      backgroundColor: '#d1fae5',
      color: '#059669',
    },
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {/* Header con navegación de meses */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="rounded-md p-2 hover:bg-gray-100"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>

        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="rounded-md p-2 hover:bg-gray-100"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-600">Cargando disponibilidad...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Calendario */}
      {!isLoading && !error && (
        <>
          <DayPicker
            mode="range"
            selected={selectedRange}
            onSelect={onRangeSelect}
            disabled={[
              { before: new Date() }, // Deshabilitar fechas pasadas
              ...disabledDates,
            ]}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            locale={es}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            showOutsideDays={false}
            numberOfMonths={1}
            className="mx-auto"
          />

          {/* Leyenda */}
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-200 pt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-green-200"></div>
              <span className="text-gray-700">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-yellow-200"></div>
              <span className="text-gray-700">Reserva temporal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-red-200"></div>
              <span className="text-gray-700">Reservado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-gray-200"></div>
              <span className="text-gray-700">No disponible</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## **PASO 7: Crear Selector de Jacuzzi**

### **Archivo: `components/booking/JacuzziSelector.tsx`**

```typescript
'use client';

import { eachDayOfInterval, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface JacuzziSelectorProps {
  startDate: Date;
  endDate: Date;
  selectedDays: string[];
  onToggleDay: (day: string) => void;
  pricePerDay: number;
}

/**
 * Selector de días con jacuzzi
 * Permite seleccionar qué días de la estadía se quiere jacuzzi
 */
export function JacuzziSelector({
  startDate,
  endDate,
  selectedDays,
  onToggleDay,
  pricePerDay,
}: JacuzziSelectorProps) {
  // Generar array de días entre start y end (excluyendo el último día)
  const days = eachDayOfInterval({ start: startDate, end: endDate }).slice(0, -1);

  if (days.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h4 className="font-semibold text-gray-900">Jacuzzi (Opcional)</h4>
        <span className="text-sm text-gray-600">
          ${pricePerDay.toLocaleString('es-CL')} por día
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const isSelected = selectedDays.includes(dayStr);

          return (
            <button
              key={dayStr}
              type="button"
              onClick={() => onToggleDay(dayStr)}
              className={cn(
                'flex items-center justify-between rounded-lg border-2 p-3 text-left transition-all',
                isSelected
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              <div>
                <p className="font-medium text-gray-900">
                  {format(day, "EEEE d 'de' MMMM", { locale: es })}
                </p>
                <p className="text-sm text-gray-600">
                  +${pricePerDay.toLocaleString('es-CL')}
                </p>
              </div>

              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border-2',
                  isSelected
                    ? 'border-primary-600 bg-primary-600'
                    : 'border-gray-300 bg-white'
                )}
              >
                {isSelected && <Check className="h-4 w-4 text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDays.length > 0 && (
        <div className="rounded-md bg-primary-50 p-3 text-sm text-primary-800">
          Has seleccionado jacuzzi para {selectedDays.length} día
          {selectedDays.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
```

---

## **PASO 8: Crear Resumen de Reserva**

### **Archivo: `components/booking/BookingSummary.tsx`**

```typescript
'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatPrice } from '@/lib/utils/format';
import { PriceBreakdown } from '@/lib/utils/pricing';
import { Calendar, Users, Waves } from 'lucide-react';

interface BookingSummaryProps {
  cabinName: string;
  startDate: Date;
  endDate: Date;
  partySize: number;
  priceBreakdown: PriceBreakdown;
}

/**
 * Resumen de la reserva antes de confirmar
 */
export function BookingSummary({
  cabinName,
  startDate,
  endDate,
  partySize,
  priceBreakdown,
}: BookingSummaryProps) {
  return (
    <div className="rounded-lg border-2 border-primary-200 bg-primary-50 p-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900">Resumen de tu reserva</h3>

      <div className="space-y-4">
        {/* Cabaña */}
        <div>
          <p className="text-sm font-medium text-gray-600">Cabaña</p>
          <p className="text-base font-semibold text-gray-900">{cabinName}</p>
        </div>

        {/* Fechas */}
        <div className="flex items-start gap-2">
          <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
          <div>
            <p className="text-sm font-medium text-gray-600">Fechas</p>
            <p className="text-base font-semibold text-gray-900">
              {format(startDate, "d 'de' MMMM", { locale: es })} -{' '}
              {format(endDate, "d 'de' MMMM yyyy", { locale: es })}
            </p>
            <p className="text-sm text-gray-600">
              {priceBreakdown.nights} noche{priceBreakdown.nights !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Huéspedes */}
        <div className="flex items-start gap-2">
          <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
          <div>
            <p className="text-sm font-medium text-gray-600">Huéspedes</p>
            <p className="text-base font-semibold text-gray-900">
              {partySize} persona{partySize !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Jacuzzi (si aplica) */}
        {priceBreakdown.jacuzziDays > 0 && (
          <div className="flex items-start gap-2">
            <Waves className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Jacuzzi</p>
              <p className="text-base font-semibold text-gray-900">
                {priceBreakdown.jacuzziDays} día{priceBreakdown.jacuzziDays !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Desglose de precios */}
        <div className="space-y-2 border-t border-primary-200 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {priceBreakdown.nights} noche{priceBreakdown.nights !== 1 ? 's' : ''}
            </span>
            <span className="font-medium text-gray-900">
              {formatPrice(priceBreakdown.basePrice)}
            </span>
          </div>

          {priceBreakdown.jacuzziDays > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Jacuzzi ({priceBreakdown.jacuzziDays} día
                {priceBreakdown.jacuzziDays !== 1 ? 's' : ''})
              </span>
              <span className="font-medium text-gray-900">
                {formatPrice(priceBreakdown.jacuzziPrice)}
              </span>
            </div>
          )}

          <div className="flex justify-between border-t border-primary-200 pt-2">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-primary-600">
              {formatPrice(priceBreakdown.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## **PASO 9: Actualizar Página de Cabaña con Calendario**

### **Archivo: `app/cabanas/[slug]/page.tsx` (actualizar sidebar)**

```typescript
// ... imports existentes ...
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';

// Agregar esto dentro del sidebar (reemplazar el contenido actual del sticky div):

'use client'; // Agregar al inicio del archivo si no está

export default function CabinPage({ params }: CabinPageProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();

  // ... resto del código ...

  // Dentro del return, en el sidebar:
  <div className="lg:col-span-1">
    <div className="sticky top-24 space-y-6">
      {/* Información básica (mantener) */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        {/* ... contenido existente ... */}
      </div>

      {/* NUEVO: Calendario de disponibilidad */}
      <AvailabilityCalendar
        cabinId={cabin.id}
        onRangeSelect={setSelectedRange}
        selectedRange={selectedRange}
      />

      {/* Mostrar resumen si hay fechas seleccionadas */}
      {selectedRange?.from && selectedRange?.to && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-600">Fechas seleccionadas</p>
          <p className="font-semibold text-gray-900">
            {format(selectedRange.from, 'dd/MM/yyyy')} -{' '}
            {format(selectedRange.to, 'dd/MM/yyyy')}
          </p>
        </div>
      )}
    </div>
  </div>
}
```

---

## **✅ VALIDACIÓN DE LA ITERACIÓN 3**

### **Checklist de Validación:**

```bash
# 1. Compilar sin errores
npm run build

# 2. Iniciar servidor
npm run dev

# 3. Probar API de disponibilidad
curl "http://localhost:3000/api/availability?cabinId=ID-CABAÑA&year=2025&month=12"

# Debe devolver JSON con: available, pending, booked, blocked

# 4. Verificar en navegador:
# - Ir a una página de cabaña
# - El calendario debe aparecer
# - Hacer click en fechas debe seleccionarlas
# - Cambiar de mes debe funcionar
# - Las leyendas de colores deben ser visibles

# 5. Verificar tipos
npx tsc --noEmit

# No debe haber errores
```

---

## **📝 CHECKLIST FINAL ITERACIÓN 3**

- [ ] API `/api/availability` funciona correctamente
- [ ] Calendario muestra y se actualiza al cambiar mes
- [ ] Se pueden seleccionar rangos de fechas
- [ ] Las fechas pasadas están deshabilitadas
- [ ] La leyenda de colores es visible
- [ ] Validaciones de fechas funcionan
- [ ] Hook `useAvailability` obtiene datos correctamente
- [ ] Componente de calendario es responsive
- [ ] JacuzziSelector permite seleccionar días
- [ ] BookingSummary muestra info correcta
- [ ] Cálculo de precios es correcto
- [ ] No hay errores de TypeScript
- [ ] No hay errores en consola

---

## **🎯 PRÓXIMOS PASOS**

Si TODOS los checks están ✅:

```bash
git add .
git commit -m "feat: iteration 3 - calendario y disponibilidad"
git push origin main
```

**SIGUIENTE:** 04-ITERATION-4.md (Formulario de Reserva y Sistema de Holds)

---

**ESTADO:** 🔴 Pendiente → 🟢 Completada  
**PRÓXIMO ARCHIVO:** AI-INSTRUCTIONS/04-ITERATION-4.md

---

**FIN DE LA ITERACIÓN 3**