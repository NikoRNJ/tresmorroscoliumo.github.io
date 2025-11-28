import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createBookingHoldSchema, validateJacuzziDays } from '@/lib/validations/booking';
import { calculatePrice } from '@/lib/utils/pricing';
import { BOOKING_BASE_GUESTS, resolveMaxGuests } from '@/lib/config/booking';
import { addMinutes } from 'date-fns';
import type { CreateHoldResponse, BookingError } from '@/types/booking';
import type { Database } from '@/types/database';

type Cabin = Database['public']['Tables']['cabins']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];

export async function POST(request: NextRequest) {
  try {
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

    // Verificar cabaña activa
    const { data: cabins, error: cabinError } = await supabaseAdmin
      .from('cabins')
      .select('*')
      .eq('id', cabinId)
      .eq('active', true)
      .limit(1);

    const cabin = cabins?.[0] as Cabin | undefined;

    if (cabinError || !cabin) {
      return NextResponse.json(
        { success: false, error: 'Cabaña no encontrada o no disponible', code: 'INVALID_DATA' },
        { status: 404 }
      );
    }

    const maxGuests = resolveMaxGuests(cabin.capacity_max);
    const minGuests = Math.min(BOOKING_BASE_GUESTS, maxGuests);

    if (partySize < minGuests || partySize > maxGuests) {
      return NextResponse.json(
        {
          success: false,
          error: `La cabaña permite entre ${minGuests} y ${maxGuests} personas (base de ${BOOKING_BASE_GUESTS} y hasta ${Math.max(
            0,
            maxGuests - BOOKING_BASE_GUESTS
          )} adicionales)`,
          code: 'INVALID_DATA',
        },
        { status: 400 }
      );
    }

    if (jacuzziDays.length > 0) {
      const isValid = validateJacuzziDays(startDate, endDate, jacuzziDays);
      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Los días de jacuzzi deben estar dentro del rango de la reserva',
            code: 'INVALID_DATA',
          },
          { status: 400 }
        );
      }
    }

    const priceBreakdown = calculatePrice(cabin, startDate, endDate, partySize, jacuzziDays, towelsCount ?? 0);
    const expiresAt = addMinutes(new Date(), 45);

    // RPC atómico en Postgres
    let booking: Booking | null = null;
    let bookingError: unknown = null;

    // Intentar RPC atómico; si no existe la función (p. ej. migración no aplicada),
    // hacer fallback a inserción directa con constraint de solape.
    const rpcResult = await (supabaseAdmin.rpc as any)(
      'create_booking_hold_atomic',
      {
        p_cabin_id: cabinId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_arrival_time: arrivalTime,
        p_departure_time: departureTime,
        p_party_size: partySize,
        p_jacuzzi_days: jacuzziDays,
        p_towels_count: towelsCount ?? 0,
        p_customer_name: customerName,
        p_customer_email: customerEmail,
        p_customer_phone: customerPhone,
        p_customer_notes: customerNotes || null,
        p_expires_at: expiresAt.toISOString(),
        p_amount_base: priceBreakdown.basePrice,
        p_amount_jacuzzi: priceBreakdown.jacuzziPrice,
        p_amount_extra_people: priceBreakdown.extraPeoplePrice,
        p_amount_towels: priceBreakdown.towelsPrice,
        p_amount_total: priceBreakdown.total,
      }
    ).single();

    if (rpcResult.error && rpcResult.error.message?.includes('create_booking_hold_atomic')) {
      // Fallback: la función RPC no existe, usar inserción directa
      
      // CRÍTICO: Expirar holds vencidos ANTES de insertar para evitar
      // conflictos con el constraint bookings_no_overlap
      await (supabaseAdmin.from('bookings') as any)
        .update({ status: 'expired' })
        .eq('cabin_id', cabinId)
        .eq('status', 'pending')
        .lt('expires_at', new Date().toISOString())
        .lt('start_date', endDate)
        .gt('end_date', startDate);

      const legacyInsert = await supabaseAdmin
        .from('bookings')
        .insert({
          cabin_id: cabinId,
          start_date: startDate,
          end_date: endDate,
          arrival_time: arrivalTime,
          departure_time: departureTime,
          party_size: partySize,
          jacuzzi_days: jacuzziDays,
          status: 'pending',
          amount_base: priceBreakdown.basePrice,
          amount_jacuzzi: priceBreakdown.jacuzziPrice,
          amount_extra_people: priceBreakdown.extraPeoplePrice,
          amount_towels: priceBreakdown.towelsPrice,
          amount_total: priceBreakdown.total,
          towels_count: towelsCount ?? 0,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          customer_notes: customerNotes || null,
          expires_at: expiresAt.toISOString(),
        } as any)
        .select()
        .single();

      booking = legacyInsert.data as Booking | null;
      bookingError = legacyInsert.error;
    } else {
      booking = rpcResult.data as unknown as Booking | null;
      bookingError = rpcResult.error;
    }

    if (bookingError || !booking) {
      const errorMsg = bookingError instanceof Error ? bookingError.message : String(bookingError);
      const dbErrorCode = (bookingError as any)?.code;

      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'booking_hold_error',
        event_source: 'system',
        payload: {
          dbErrorCode,
          bookingError,
          cabinId,
          startDate,
          endDate,
        },
        status: 'error',
        error_message: errorMsg,
      });

      if (errorMsg.includes('DATES_UNAVAILABLE') || dbErrorCode === '23505' || dbErrorCode === '23P01') {
        const errorResponse: BookingError = {
          success: false,
          error:
            'Las fechas elegidas acaban de ser tomadas por otra reserva. Intenta con otro rango o espera a que venza el hold anterior (máx. 45 min).',
          code: 'DATES_UNAVAILABLE',
        };
        return NextResponse.json(errorResponse, { status: 409 });
      }

      return NextResponse.json(
        { success: false, error: 'Error al crear la reserva. Por favor intenta nuevamente.', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }

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

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tresmorroscoliumo.cl').replace(/\/$/, '');
    const paymentPath = `/pago?booking=${booking.id}`;
    const response: CreateHoldResponse = {
      success: true,
      booking: booking as Booking,
      expiresAt: expiresAt.toISOString(),
      redirectUrl: paymentPath,
      redirectAbsoluteUrl: `${siteUrl}${paymentPath}`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error in booking hold endpoint:', error);

    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: 'booking_hold_exception',
      event_source: 'system',
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos en el formulario', code: 'INVALID_DATA', details: JSON.parse(error.message) },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
