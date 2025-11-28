import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { availabilityQuerySchema, getDatesBetween } from '@/lib/validations/booking';
import { endOfMonth, eachDayOfInterval, format, isAfter, parseISO } from 'date-fns';

// Needs to stay dynamic because we depend on query params for cabin/month filtering.
export const dynamic = 'force-dynamic';

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
    console.log(`[Availability] Checking for cabin ${cabinId}, ${year}-${month}`);

    // Verificar que la cabaña existe
    const { data: cabins, error: cabinError } = await supabaseAdmin
      .from('cabins')
      .select('id')
      .eq('id', cabinId)
      .limit(1);

    const cabin = cabins?.[0];

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

    // IMPORTANTE: Expirar holds vencidos ANTES de consultar disponibilidad
    // Esto mantiene la base de datos limpia y evita inconsistencias
    // entre lo que muestra el calendario y lo que permite reservar
    try {
      const { data: expiredCount } = await (supabaseAdmin.rpc as any)(
        'expire_stale_holds_for_cabin',
        { p_cabin_id: cabinId }
      );
      
      if (expiredCount && expiredCount > 0) {
        console.log(`[Availability] Expired ${expiredCount} stale holds for cabin ${cabinId}`);
      }
    } catch (rpcError) {
      // Fallback si la función RPC no existe: expirar manualmente
      // Usamos (as any) para evitar error de tipo 'never' en build
      const { count } = await (supabaseAdmin.from('bookings') as any)
        .update({ status: 'expired' })
        .eq('cabin_id', cabinId)
        .eq('status', 'pending')
        .lt('expires_at', new Date().toISOString());
      
      if (count && count > 0) {
        console.log(`[Availability] Expired ${count} stale holds via fallback for cabin ${cabinId}`);
      }
    }

    // Obtener todas las reservas que afectan este mes
    // (reservas que empiezan antes del fin del mes Y terminan después del inicio del mes)
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, start_date, end_date, status, expires_at, arrival_time, departure_time')
      .eq('cabin_id', cabinId)
      .in('status', ['pending', 'paid'])
      .lte('start_date', endDateStr)
      .gt('end_date', startDateStr)
      .returns<
        Array<{
          id: string;
          start_date: string;
          end_date: string;
          status: string;
          expires_at: string | null;
          arrival_time: string | null;
          departure_time: string | null;
        }>
      >();

    if (bookingsError) {
      console.error('[Availability] Error fetching bookings:', bookingsError);
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
      .lte('start_date', endDateStr)
      .gt('end_date', startDateStr)
      .returns<Array<{ start_date: string; end_date: string }>>();

    if (blocksError) {
      console.error('Error fetching blocks:', blocksError);
      // No fallar si no hay bloqueos, continuar
    }

    // Generar todos los días del mes
    const allDaysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
    const allDaysStr = allDaysInMonth.map((day) => format(day, 'yyyy-MM-dd'));

    // Sets para categorizar fechas
    const bookedDates = new Set<string>();
    const pendingDates = new Set<string>();
    const blockedDates = new Set<string>();

    // Procesar reservas
    const now = new Date();
    bookings?.forEach((booking) => {
      try {
        const bookingDays = getDatesBetween(booking.start_date, booking.end_date);
        bookingDays.forEach((dayStr) => {
          // Solo agregar si está dentro del mes consultado
          if (allDaysStr.includes(dayStr)) {
            if (booking.status === 'paid') {
              bookedDates.add(dayStr);
              console.log(`[Availability] Booking ${booking.id} is PAID. Marking as booked.`);
            } else if (booking.status === 'pending') {
              // Si expires_at es null, asumimos que está expirado (o inválido), igual que en hold/route.ts
              if (booking.expires_at) {
                const expiresAt = parseISO(booking.expires_at);
                const isExpired = !isAfter(expiresAt, now);

                // LOGGING FOR DEBUGGING
                console.log(`[Availability Debug] Booking ${booking.id}: Status=${booking.status}, Expires=${booking.expires_at}, Now=${now.toISOString()}, IsExpired=${isExpired}`);

                if (!isExpired) {
                  pendingDates.add(dayStr);
                  console.log(`[Availability] Pending booking ${booking.id} is ACTIVE. Expires: ${booking.expires_at}, Now: ${now.toISOString()}`);
                } else {
                  console.log(`[Availability] Pending booking ${booking.id} EXPIRED at ${booking.expires_at} (Now: ${now.toISOString()})`);
                }
              } else {
                console.log(`[Availability Warning] Booking ${booking.id} is pending but has NO expires_at. Treating as PENDING (Yellow) to be safe.`);
                pendingDates.add(dayStr);
              }
            }
          }
        });
      } catch (err) {
        console.error(`[Availability] Error processing booking ${booking.id}:`, err);
      }
    });

    // Procesar bloqueos administrativos
    const arrivals: Array<{ bookingId: string; date: string; time: string; status: string }> = [];
    const departures: Array<{ bookingId: string; date: string; time: string; status: string }> = [];
    const occupancy: Array<{
      bookingId: string;
      status: string;
      startDate: string;
      endDate: string;
      arrivalTime: string;
      departureTime: string;
    }> = [];

    const DEFAULT_CHECK_IN = '15:00';
    const DEFAULT_CHECK_OUT = '12:00';

    const formatTimeLabel = (time: string | null | undefined, fallback: string) => {
      const source = time || fallback;
      const [hoursStr, minutesStr] = source.split(':');
      const hours = Number(hoursStr);
      const minutes = Number(minutesStr);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = ((hours + 11) % 12) + 1;
      return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    blocks?.forEach((block) => {
      const blockDays = getDatesBetween(block.start_date, block.end_date);

      blockDays.forEach((dayStr) => {
        if (allDaysStr.includes(dayStr)) {
          blockedDates.add(dayStr);
        }
      });
    });

    bookings?.forEach((booking) => {
      const isExpiredPending =
        booking.status === 'pending' &&
        booking.expires_at !== null &&
        !isAfter(parseISO(booking.expires_at), now);

      if (isExpiredPending) {
        return;
      }

      const arrivalTime = formatTimeLabel(booking.arrival_time, DEFAULT_CHECK_IN);
      const departureTime = formatTimeLabel(booking.departure_time, DEFAULT_CHECK_OUT);

      arrivals.push({
        bookingId: booking.id,
        date: booking.start_date,
        time: arrivalTime,
        status: booking.status,
      });
      departures.push({
        bookingId: booking.id,
        date: booking.end_date,
        time: departureTime,
        status: booking.status,
      });

      occupancy.push({
        bookingId: booking.id,
        status: booking.status,
        startDate: booking.start_date,
        endDate: booking.end_date,
        arrivalTime,
        departureTime,
      });
    });

    arrivals.sort((a, b) => a.date.localeCompare(b.date));
    departures.sort((a, b) => a.date.localeCompare(b.date));
    occupancy.sort((a, b) => a.startDate.localeCompare(b.startDate));

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
      arrivals,
      departures,
      occupancy,
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
