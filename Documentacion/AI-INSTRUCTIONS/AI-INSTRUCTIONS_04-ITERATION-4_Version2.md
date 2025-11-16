# 📝 ITERACIÓN 4: Formulario de Reserva y Sistema de Holds

**OBJETIVO:** Implementar el formulario completo de reserva con validaciones, sistema de holds temporales (20 minutos) y preparación para el pago.

**DURACIÓN ESTIMADA:** 4-5 horas

**ESTADO:** 🔴 Pendiente

**DEPENDENCIAS:** Iteración 3 completada ✅

---

## **📋 PRE-REQUISITOS**

Antes de comenzar, verifica que:

- [ ] Iteración 3 está 100% completada
- [ ] Calendario de disponibilidad funciona
- [ ] API de availability retorna datos correctos
- [ ] Cálculo de precios funciona correctamente
- [ ] No hay errores de TypeScript

---

## **🎯 OBJETIVOS DE ESTA ITERACIÓN**

Al finalizar, deberás tener:

1. ✅ Formulario completo de datos del cliente
2. ✅ Validación en tiempo real con Zod + React Hook Form
3. ✅ API endpoint para crear holds (`/api/bookings/hold`)
4. ✅ Sistema de expiración de holds (20 minutos)
5. ✅ Verificación de conflictos de reservas
6. ✅ Transición fluida a página de pago
7. ✅ Manejo de errores y edge cases
8. ✅ Loading states y feedback visual

---

## **PASO 1: Crear Types Adicionales**

### **Archivo: `types/booking.ts`**

```typescript
/**
 * Types relacionados con el proceso de reserva
 */

import type { Booking } from './database';

/**
 * Estado del formulario de reserva
 */
export interface BookingFormData {
  // Fechas
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  
  // Huéspedes
  partySize: number;
  
  // Jacuzzi
  jacuzziDays: string[]; // Array de YYYY-MM-DD
  
  // Cliente
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
}

/**
 * Respuesta de creación de hold
 */
export interface CreateHoldResponse {
  success: true;
  booking: Booking;
  expiresAt: string; // ISO timestamp
  redirectUrl: string; // URL para ir a pagar
}

/**
 * Error de reserva
 */
export interface BookingError {
  success: false;
  error: string;
  code?: 'DATES_UNAVAILABLE' | 'EXPIRED_HOLD' | 'INVALID_DATA' | 'SERVER_ERROR';
  details?: Record<string, string[]>;
}

/**
 * Hold temporal de reserva
 */
export interface BookingHold {
  id: string;
  cabinId: string;
  startDate: string;
  endDate: string;
  expiresAt: string;
  amountTotal: number;
}
```

---

## **PASO 2: Crear API de Creación de Holds**

### **Archivo: `app/api/bookings/hold/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createBookingHoldSchema, validateJacuzziDays, getDatesBetween } from '@/lib/validations/booking';
import { calculatePrice } from '@/lib/utils/pricing';
import { addMinutes, parseISO, isBefore, isAfter } from 'date-fns';
import type { CreateHoldResponse, BookingError } from '@/types/booking';

/**
 * POST /api/bookings/hold
 * 
 * Crea un "hold" temporal de 20 minutos para una reserva
 * 
 * Body:
 * {
 *   cabinId: string,
 *   startDate: string,
 *   endDate: string,
 *   partySize: number,
 *   jacuzziDays: string[],
 *   customerName: string,
 *   customerEmail: string,
 *   customerPhone: string,
 *   customerNotes?: string
 * }
 * 
 * Retorna:
 * - 200: Hold creado exitosamente
 * - 400: Datos inválidos
 * - 409: Fechas no disponibles
 * - 500: Error del servidor
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parsear y validar el body
    const body = await request.json();
    const validatedData = createBookingHoldSchema.parse(body);

    const {
      cabinId,
      startDate,
      endDate,
      partySize,
      jacuzziDays,
      customerName,
      customerEmail,
      customerPhone,
      customerNotes,
    } = validatedData;

    // 2. Verificar que la cabaña existe y está activa
    const { data: cabin, error: cabinError } = await supabaseAdmin
      .from('cabins')
      .select('*')
      .eq('id', cabinId)
      .eq('active', true)
      .single();

    if (cabinError || !cabin) {
      const errorResponse: BookingError = {
        success: false,
        error: 'Cabaña no encontrada o no disponible',
        code: 'INVALID_DATA',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // 3. Validar capacidad
    if (partySize < cabin.capacity_base || partySize > cabin.capacity_max) {
      const errorResponse: BookingError = {
        success: false,
        error: `La cabaña tiene capacidad para ${cabin.capacity_base}-${cabin.capacity_max} personas`,
        code: 'INVALID_DATA',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 4. Validar que los días de jacuzzi estén dentro del rango
    if (jacuzziDays.length > 0) {
      const isValid = validateJacuzziDays(startDate, endDate, jacuzziDays);
      if (!isValid) {
        const errorResponse: BookingError = {
          success: false,
          error: 'Los días de jacuzzi deben estar dentro del rango de la reserva',
          code: 'INVALID_DATA',
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }
    }

    // 5. VERIFICAR DISPONIBILIDAD (crítico para evitar doble reserva)
    const bookingDates = getDatesBetween(startDate, endDate);
    
    // Buscar reservas que se superpongan (incluyendo holds no expirados)
    const now = new Date().toISOString();
    const { data: conflictingBookings, error: conflictError } = await supabaseAdmin
      .from('bookings')
      .select('id, start_date, end_date, status, expires_at')
      .eq('cabin_id', cabinId)
      .in('status', ['pending', 'paid'])
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError);
      const errorResponse: BookingError = {
        success: false,
        error: 'Error al verificar disponibilidad',
        code: 'SERVER_ERROR',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Filtrar holds expirados
    const activeConflicts = conflictingBookings?.filter((booking) => {
      if (booking.status === 'paid') return true; // Reservas pagadas siempre cuentan
      if (booking.status === 'pending' && booking.expires_at) {
        return isAfter(parseISO(booking.expires_at), new Date()); // Hold aún válido
      }
      return false;
    });

    if (activeConflicts && activeConflicts.length > 0) {
      const errorResponse: BookingError = {
        success: false,
        error: 'Las fechas seleccionadas ya no están disponibles. Por favor elige otras fechas.',
        code: 'DATES_UNAVAILABLE',
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // 6. Verificar bloqueos administrativos
    const { data: adminBlocks } = await supabaseAdmin
      .from('admin_blocks')
      .select('id')
      .eq('cabin_id', cabinId)
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

    if (adminBlocks && adminBlocks.length > 0) {
      const errorResponse: BookingError = {
        success: false,
        error: 'Las fechas seleccionadas están bloqueadas por mantenimiento',
        code: 'DATES_UNAVAILABLE',
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // 7. Calcular el precio total
    const priceBreakdown = calculatePrice(cabin, startDate, endDate, jacuzziDays);

    // 8. Crear el hold (expires_at = now + 20 minutos)
    const expiresAt = addMinutes(new Date(), 20);

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        cabin_id: cabinId,
        start_date: startDate,
        end_date: endDate,
        party_size: partySize,
        jacuzzi_days: jacuzziDays,
        status: 'pending',
        amount_base: priceBreakdown.basePrice,
        amount_jacuzzi: priceBreakdown.jacuzziPrice,
        amount_total: priceBreakdown.total,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_notes: customerNotes || null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error('Error creating booking:', bookingError);
      const errorResponse: BookingError = {
        success: false,
        error: 'Error al crear la reserva. Por favor intenta nuevamente.',
        code: 'SERVER_ERROR',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // 9. Log del evento
    await supabaseAdmin.from('api_events').insert({
      event_type: 'booking_hold_created',
      event_source: 'system',
      booking_id: booking.id,
      payload: {
        cabin_id: cabinId,
        start_date: startDate,
        end_date: endDate,
        amount_total: priceBreakdown.total,
        expires_at: expiresAt.toISOString(),
      },
      status: 'success',
    });

    // 10. Retornar respuesta exitosa
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response: CreateHoldResponse = {
      success: true,
      booking,
      expiresAt: expiresAt.toISOString(),
      redirectUrl: `${siteUrl}/pago?booking=${booking.id}`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error in booking hold endpoint:', error);

    // Error de validación de Zod
    if (error instanceof Error && error.name === 'ZodError') {
      const errorResponse: BookingError = {
        success: false,
        error: 'Datos inválidos en el formulario',
        code: 'INVALID_DATA',
        details: JSON.parse(error.message),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Error genérico
    const errorResponse: BookingError = {
      success: false,
      error: 'Error interno del servidor',
      code: 'SERVER_ERROR',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
```

---

## **PASO 3: Crear Componente del Formulario**

### **Archivo: `components/booking/BookingForm.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { JacuzziSelector } from './JacuzziSelector';
import { BookingSummary } from './BookingSummary';
import { calculatePrice } from '@/lib/utils/pricing';
import { format } from 'date-fns';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Cabin } from '@/types/database';
import type { CreateHoldResponse, BookingError } from '@/types/booking';

// Schema de validación del formulario
const bookingFormSchema = z.object({
  customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  customerEmail: z.string().email('Email inválido'),
  customerPhone: z
    .string()
    .min(8, 'El teléfono debe tener al menos 8 dígitos')
    .max(20)
    .regex(/^[+]?[\d\s()-]+$/, 'Formato de teléfono inválido'),
  customerNotes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  cabin: Cabin;
  startDate: Date;
  endDate: Date;
  partySize: number;
  onBack: () => void;
}

/**
 * Formulario completo de reserva
 * Incluye datos del cliente, selección de jacuzzi y resumen
 */
export function BookingForm({ cabin, startDate, endDate, partySize, onBack }: BookingFormProps) {
  const router = useRouter();
  const [jacuzziDays, setJacuzziDays] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerNotes: '',
      acceptTerms: false,
    },
  });

  // Calcular precio total
  const priceBreakdown = calculatePrice(
    cabin,
    format(startDate, 'yyyy-MM-dd'),
    format(endDate, 'yyyy-MM-dd'),
    jacuzziDays
  );

  // Toggle día de jacuzzi
  const handleToggleJacuzziDay = (day: string) => {
    setJacuzziDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Submit del formulario
  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch('/api/bookings/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabinId: cabin.id,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          partySize,
          jacuzziDays,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          customerNotes: data.customerNotes,
        }),
      });

      const result: CreateHoldResponse | BookingError = await response.json();

      if (!response.ok || !result.success) {
        const error = result as BookingError;
        setApiError(error.error);
        return;
      }

      // Redirigir a la página de pago
      const successResponse = result as CreateHoldResponse;
      router.push(successResponse.redirectUrl);
    } catch (error) {
      console.error('Error submitting booking:', error);
      setApiError('Error al procesar la reserva. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Error de API */}
      {apiError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <h4 className="font-semibold text-red-900">Error al crear la reserva</h4>
            <p className="text-sm text-red-700">{apiError}</p>
          </div>
        </div>
      )}

      {/* Resumen de la reserva */}
      <BookingSummary
        cabinName={cabin.title}
        startDate={startDate}
        endDate={endDate}
        partySize={partySize}
        priceBreakdown={priceBreakdown}
      />

      {/* Selector de Jacuzzi */}
      {cabin.jacuzzi_price > 0 && (
        <JacuzziSelector
          startDate={startDate}
          endDate={endDate}
          selectedDays={jacuzziDays}
          onToggleDay={handleToggleJacuzziDay}
          pricePerDay={cabin.jacuzzi_price}
        />
      )}

      {/* Datos del cliente */}
      <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900">Tus datos</h3>

        {/* Nombre */}
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
            Nombre completo <span className="text-red-600">*</span>
          </label>
          <input
            {...register('customerName')}
            type="text"
            id="customerName"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Juan Pérez"
          />
          {errors.customerName && (
            <p className="mt-1 text-sm text-red-600">{errors.customerName.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">
            Email <span className="text-red-600">*</span>
          </label>
          <input
            {...register('customerEmail')}
            type="email"
            id="customerEmail"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="juan@ejemplo.com"
          />
          {errors.customerEmail && (
            <p className="mt-1 text-sm text-red-600">{errors.customerEmail.message}</p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">
            Teléfono <span className="text-red-600">*</span>
          </label>
          <input
            {...register('customerPhone')}
            type="tel"
            id="customerPhone"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="+56 9 1234 5678"
          />
          {errors.customerPhone && (
            <p className="mt-1 text-sm text-red-600">{errors.customerPhone.message}</p>
          )}
        </div>

        {/* Notas opcionales */}
        <div>
          <label htmlFor="customerNotes" className="block text-sm font-medium text-gray-700">
            Comentarios adicionales (opcional)
          </label>
          <textarea
            {...register('customerNotes')}
            id="customerNotes"
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Solicitudes especiales, hora estimada de llegada, etc."
          />
          {errors.customerNotes && (
            <p className="mt-1 text-sm text-red-600">{errors.customerNotes.message}</p>
          )}
        </div>

        {/* Términos y condiciones */}
        <div className="flex items-start gap-3">
          <input
            {...register('acceptTerms')}
            type="checkbox"
            id="acceptTerms"
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-700">
            Acepto los términos y condiciones de la reserva. Entiendo que tendré{' '}
            <strong>20 minutos</strong> para completar el pago una vez creada la reserva.{' '}
            <span className="text-red-600">*</span>
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
        )}
      </div>

      {/* Botones */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting} className="w-full sm:w-auto">
          Volver
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando reserva...
            </>
          ) : (
            `Continuar al pago (${priceBreakdown.total.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })})`
          )}
        </Button>
      </div>

      {/* Aviso de seguridad */}
      <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-semibold">Tu reserva estará protegida por 20 minutos</p>
        <p className="mt-1">
          Una vez hagas click en "Continuar al pago", las fechas quedarán reservadas temporalmente
          para ti. Tendrás 20 minutos para completar el pago de forma segura.
        </p>
      </div>
    </form>
  );
}
```

---

## **PASO 4: Crear Wizard de Reserva**

### **Archivo: `components/booking/BookingWizard.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { BookingForm } from './BookingForm';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Calendar, Users, FileText } from 'lucide-react';
import type { Cabin } from '@/types/database';

interface BookingWizardProps {
  cabin: Cabin;
}

type WizardStep = 'dates' | 'party-size' | 'details';

/**
 * Wizard de reserva en 3 pasos:
 * 1. Seleccionar fechas
 * 2. Seleccionar cantidad de personas
 * 3. Completar datos y confirmar
 */
export function BookingWizard({ cabin }: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('dates');
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [partySize, setPartySize] = useState<number>(cabin.capacity_base);

  // Indicador de progreso
  const steps = [
    { id: 'dates' as const, name: 'Fechas', icon: Calendar },
    { id: 'party-size' as const, name: 'Personas', icon: Users },
    { id: 'details' as const, name: 'Confirmación', icon: FileText },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  // Validar que se pueden avanzar pasos
  const canProceedFromDates = selectedRange?.from && selectedRange?.to;
  const canProceedFromPartySize = partySize >= cabin.capacity_base && partySize <= cabin.capacity_max;

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    isActive
                      ? 'border-primary-600 bg-primary-600 text-white'
                      : isCompleted
                      ? 'border-primary-600 bg-primary-100 text-primary-600'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isActive || isCompleted ? 'text-primary-600' : 'text-gray-400'
                  }`}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 ${
                    isCompleted ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Seleccionar fechas */}
      {currentStep === 'dates' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Selecciona tus fechas</h2>
            <p className="mt-1 text-gray-600">
              Elige cuándo quieres alojarte en {cabin.title}
            </p>
          </div>

          <AvailabilityCalendar
            cabinId={cabin.id}
            onRangeSelect={setSelectedRange}
            selectedRange={selectedRange}
          />

          <div className="flex justify-end">
            <Button onClick={() => setCurrentStep('party-size')} disabled={!canProceedFromDates}>
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Seleccionar cantidad de personas */}
      {currentStep === 'party-size' && selectedRange?.from && selectedRange?.to && (
        <div className="space-y-6">
          <button
            onClick={() => setCurrentStep('dates')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Cambiar fechas
          </button>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">¿Cuántas personas se alojarán?</h2>
            <p className="mt-1 text-gray-600">
              Capacidad: {cabin.capacity_base} - {cabin.capacity_max} personas
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="partySize" className="block text-sm font-medium text-gray-700">
                  Cantidad de personas
                </label>
                <p className="text-xs text-gray-500">
                  Mínimo {cabin.capacity_base}, máximo {cabin.capacity_max}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setPartySize(Math.max(cabin.capacity_base, partySize - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 text-lg font-bold text-gray-700 hover:border-primary-600 hover:text-primary-600 disabled:opacity-50"
                  disabled={partySize <= cabin.capacity_base}
                >
                  −
                </button>
                <span className="w-12 text-center text-2xl font-bold text-gray-900">
                  {partySize}
                </span>
                <button
                  type="button"
                  onClick={() => setPartySize(Math.min(cabin.capacity_max, partySize + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 text-lg font-bold text-gray-700 hover:border-primary-600 hover:text-primary-600 disabled:opacity-50"
                  disabled={partySize >= cabin.capacity_max}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setCurrentStep('details')} disabled={!canProceedFromPartySize}>
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Formulario de detalles */}
      {currentStep === 'details' && selectedRange?.from && selectedRange?.to && (
        <div className="space-y-6">
          <button
            onClick={() => setCurrentStep('party-size')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Cambiar cantidad de personas
          </button>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Confirma tu reserva</h2>
            <p className="mt-1 text-gray-600">Solo faltan tus datos para completar</p>
          </div>

          <BookingForm
            cabin={cabin}
            startDate={selectedRange.from}
            endDate={selectedRange.to}
            partySize={partySize}
            onBack={() => setCurrentStep('party-size')}
          />
        </div>
      )}
    </div>
  );
}
```

---

## **PASO 5: Integrar Wizard en Página de Cabaña**

### **Archivo: `app/cabanas/[slug]/page.tsx` (actualizar)**

Reemplazar el sidebar actual con el wizard completo:

```typescript
// ... imports existentes ...
import { BookingWizard } from '@/components/booking/BookingWizard';

export default async function CabinPage({ params }: CabinPageProps) {
  // ... código existente ...

  return (
    <div className="pb-16">
      {/* ... header existente ... */}

      <Container className="pt-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Columna principal (información de la cabaña) */}
          <div className="lg:col-span-2">
            {/* ... contenido existente ... */}
          </div>

          {/* Columna lateral: Wizard de reserva */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <BookingWizard cabin={cabin} />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
```

---

## **PASO 6: Crear Job de Expiración de Holds**

### **Archivo: `app/api/jobs/expire-holds/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/jobs/expire-holds
 * 
 * Job ejecutado por cron cada 5 minutos para expirar holds vencidos
 * 
 * Headers requeridos:
 * - x-cron-secret: Secret para autenticar el cron
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar secret del cron
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Buscar todos los holds expirados
    const { data: expiredHolds, error: selectError } = await supabaseAdmin
      .from('bookings')
      .select('id, cabin_id, start_date, end_date, customer_email')
      .eq('status', 'pending')
      .lt('expires_at', now);

    if (selectError) {
      console.error('Error fetching expired holds:', selectError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!expiredHolds || expiredHolds.length === 0) {
      return NextResponse.json({
        message: 'No expired holds found',
        expired: 0,
      });
    }

    // Actualizar status a 'expired'
    const holdIds = expiredHolds.map((h) => h.id);
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'expired' })
      .in('id', holdIds);

    if (updateError) {
      console.error('Error updating holds:', updateError);
      return NextResponse.json({ error: 'Update error' }, { status: 500 });
    }

    // Log del evento
    await supabaseAdmin.from('api_events').insert(
      expiredHolds.map((hold) => ({
        event_type: 'booking_hold_expired',
        event_source: 'system',
        booking_id: hold.id,
        payload: {
          cabin_id: hold.cabin_id,
          customer_email: hold.customer_email,
        },
        status: 'success',
      }))
    );

    return NextResponse.json({
      message: `Expired ${expiredHolds.length} holds`,
      expired: expiredHolds.length,
      bookingIds: holdIds,
    });
  } catch (error) {
    console.error('Error in expire-holds job:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## **PASO 7: Crear Página de Placeholder para Pago**

### **Archivo: `app/pago/page.tsx`**

```typescript
import { Container } from '@/components/ui/Container';
import { supabaseAdmin } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Clock, CheckCircle } from 'lucide-react';
import { formatPrice, formatDateRange } from '@/lib/utils/format';
import { differenceInMinutes, parseISO } from 'date-fns';

interface PaymentPageProps {
  searchParams: {
    booking?: string;
  };
}

/**
 * Página de pago (placeholder)
 * En la próxima iteración se integrará con Flow
 */
export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const bookingId = searchParams.booking;

  if (!bookingId) {
    redirect('/');
  }

  // Obtener la reserva
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('*, cabin:cabins(*)')
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    notFound();
  }

  // Verificar que el hold aún es válido
  if (booking.status === 'expired') {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-100 p-4">
              <Clock className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900">Reserva expirada</h1>
          <p className="mb-8 text-lg text-gray-600">
            Lo sentimos, tu reserva ha expirado. Por favor intenta reservar nuevamente.
          </p>
          <a
            href={`/cabanas/${booking.cabin.slug}`}
            className="inline-block rounded-md bg-primary-600 px-6 py-3 text-white hover:bg-primary-700"
          >
            Volver a reservar
          </a>
        </div>
      </Container>
    );
  }

  // Calcular tiempo restante
  const now = new Date();
  const expiresAt = parseISO(booking.expires_at!);
  const minutesLeft = differenceInMinutes(expiresAt, now);

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-900">Tiempo restante para pagar:</p>
              <p className="text-2xl font-bold text-yellow-600">{minutesLeft} minutos</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-8">
          <div className="mb-6 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Reserva creada exitosamente</h1>
          </div>

          <div className="space-y-4 border-t border-gray-200 pt-6">
            <div>
              <p className="text-sm text-gray-600">Cabaña</p>
              <p className="text-lg font-semibold text-gray-900">{booking.cabin.title}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Fechas</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDateRange(booking.start_date, booking.end_date)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Total a pagar</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatPrice(booking.amount_total)}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-semibold">Próximo paso: Integración con Flow</p>
            <p className="mt-1">
              En la próxima iteración se implementará el pago con Flow/Webpay. Por ahora, esta
              página es solo un placeholder.
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}
```

---

## **✅ VALIDACIÓN DE LA ITERACIÓN 4**

### **Checklist de Validación:**

```bash
# 1. Compilar sin errores
npm run build

# 2. Iniciar servidor
npm run dev

# 3. Probar crear hold
# Ir a una cabaña, completar wizard y enviar formulario
# Debe redirigir a /pago?booking=ID

# 4. Verificar en Supabase que se creó el registro
# Ir a Supabase → Table Editor → bookings
# Debe aparecer con status 'pending' y expires_at en 20 minutos

# 5. Probar job de expiración
curl -X POST http://localhost:3000/api/jobs/expire-holds \
  -H "x-cron-secret: tu-secret-del-env"

# Debe devolver JSON con cantidad de holds expirados

# 6. Verificar tipos
npx tsc --noEmit

# No debe haber errores
```

---

## **📝 CHECKLIST FINAL ITERACIÓN 4**

- [ ] Validaciones de Zod funcionan
- [ ] Formulario de reserva valida campos en tiempo real
- [ ] API `/api/bookings/hold` crea holds correctamente
- [ ] Holds tienen `expires_at` en 20 minutos
- [ ] Se detectan conflictos de disponibilidad
- [ ] BookingWizard muestra 3 pasos correctamente
- [ ] Selector de jacuzzi funciona
- [ ] BookingSummary muestra precio correcto
- [ ] Redirección a página de pago funciona
- [ ] Página de pago muestra tiempo restante
- [ ] Job de expiración funciona correctamente
- [ ] No hay errores de TypeScript
- [ ] No hay errores en consola del navegador

---

## **🎯 PRÓXIMOS PASOS**

Si TODOS los checks están ✅:

```bash
git add .
git commit -m "feat: iteration 4 - formulario de reserva y sistema de holds"
git push origin main
```

**SIGUIENTE:** 05-ITERATION-5.md (Integración con Flow para Pagos)

---

**ESTADO:** 🔴 Pendiente → 🟢 Completada  
**PRÓXIMO ARCHIVO:** AI-INSTRUCTIONS/05-ITERATION-5.md

---

**FIN DE LA ITERACIÓN 4**