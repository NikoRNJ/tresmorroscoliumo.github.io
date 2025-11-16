import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createBookingHoldSchema, validateJacuzziDays } from '@/lib/validations/booking';
import { calculatePrice } from '@/lib/utils/pricing';
import { addMinutes, parseISO, isAfter } from 'date-fns';
import type { CreateHoldResponse, BookingError } from '@/types/booking';
import type { Database } from '@/types/database';

type Cabin = Database['public']['Tables']['cabins']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];

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
      towelsCount,
      arrivalTime,
      departureTime,
      customerName,
      customerEmail,
      customerPhone,
      customerNotes,
    } = validatedData;

    // 2. Verificar que la cabaña existe y está activa
    const { data: cabins, error: cabinError } = await supabaseAdmin
      .from('cabins')
      .select('*')
      .eq('id', cabinId)
      .eq('active', true)
      .limit(1);

    const cabin = cabins?.[0] as Cabin | undefined;

    if (cabinError || !cabin) {
      const errorResponse: BookingError = {
        success: false,
        error: 'Cabaña no encontrada o no disponible',
        code: 'INVALID_DATA',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const minGuests = 1;
    const maxGuests = cabin.capacity_max;

    // 3. Validar capacidad
    if (partySize < minGuests || partySize > maxGuests) {
      const errorResponse: BookingError = {
        success: false,
        error: `La cabaña permite entre ${minGuests} y ${maxGuests} personas`,
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
    // Buscar reservas que se superpongan (incluyendo holds no expirados)
    const now = new Date().toISOString();
    const { data: conflictingBookings, error: conflictError } = await supabaseAdmin
      .from('bookings')
      .select('id, start_date, end_date, status, expires_at')
      .eq('cabin_id', cabinId)
      .in('status', ['pending', 'paid'])
      .lt('start_date', endDate)
      .gt('end_date', startDate)
      .returns<Array<{ id: string; start_date: string; end_date: string; status: string; expires_at: string | null }>>();

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
      .lt('start_date', endDate)
      .gt('end_date', startDate);

    if (adminBlocks && adminBlocks.length > 0) {
      const errorResponse: BookingError = {
        success: false,
        error: 'Las fechas seleccionadas están bloqueadas por mantenimiento',
        code: 'DATES_UNAVAILABLE',
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // 7. Calcular el precio total
    const priceBreakdown = calculatePrice(cabin, startDate, endDate, partySize, jacuzziDays, towelsCount ?? 0);

    // 8. Crear el hold (expires_at = now + 45 minutos)
    const expiresAt = addMinutes(new Date(), 45);

    const formatTimeLabel = (time: string) => {
      const [hours, minutes] = time.split(':').map((val) => Number(val));
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = ((hours + 11) % 12) + 1;
      return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const arrivalTimeLabel = formatTimeLabel(arrivalTime);
    const departureTimeLabel = formatTimeLabel(departureTime);

    const { data: bookings, error: bookingError } = await supabaseAdmin
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
        customer_notes: `${customerNotes || ''}${customerNotes ? ' | ' : ''}Entrada: ${arrivalTimeLabel} | Salida: ${departureTimeLabel}`,
        expires_at: expiresAt.toISOString(),
      } as any)
      .select()
      .limit(1);

    const booking = bookings?.[0] as Booking | undefined;

    if (bookingError || !booking) {
      console.error('Error creating booking:', bookingError);

      if ((bookingError as any)?.code === '23505') {
        const errorResponse: BookingError = {
          success: false,
          error:
            'Las fechas elegidas acaban de ser tomadas por otra reserva. Intenta con otro rango o espera a que venza el hold anterior (máx. 45 min).',
          code: 'DATES_UNAVAILABLE',
        };
        return NextResponse.json(errorResponse, { status: 409 });
      }

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
        towels_count: towelsCount ?? 0,
        amount_total: priceBreakdown.total,
        expires_at: expiresAt.toISOString(),
      },
      status: 'success',
    } as any);

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
