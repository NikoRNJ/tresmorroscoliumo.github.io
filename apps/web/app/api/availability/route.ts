import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { availabilityQuerySchema, getDatesBetween } from '@/lib/validations/booking';
import { endOfMonth, eachDayOfInterval, format } from 'date-fns';

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

    // Obtener todas las reservas que afectan este mes
    // (reservas que empiezan antes del fin del mes Y terminan después del inicio del mes)
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('start_date, end_date, status, expires_at, customer_notes')
      .eq('cabin_id', cabinId)
      .in('status', ['pending', 'paid'])
      .lte('start_date', endDateStr)
      .gt('end_date', startDateStr)
      .returns<Array<{ start_date: string; end_date: string; status: string; expires_at: string | null; customer_notes: string | null }>>();

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
      const bookingDays = getDatesBetween(booking.start_date, booking.end_date);

      bookingDays.forEach((dayStr) => {
        
        // Solo agregar si está dentro del mes consultado
        if (allDaysStr.includes(dayStr)) {
          if (booking.status === 'paid') {
            bookedDates.add(dayStr);
          } else if (booking.status === 'pending') {
            const exp = booking.expires_at ? new Date(booking.expires_at) : null;
            if (!exp || exp > now) {
              pendingDates.add(dayStr);
            }
          }
        }
      });
    });

    // Procesar bloqueos administrativos
    const arrivals: Array<{ date: string; time: string; status: string }> = [];
    const departures: Array<{ date: string; time: string; status: string }> = [];

    const extractTimeFromNotes = (notes: string | null, label: 'Entrada' | 'Salida', fallback: string) => {
      if (!notes) return fallback;
      const regex = new RegExp(`${label}:\\s*([0-9]{1,2}:[0-9]{2}\\s?(?:AM|PM)?)`, 'i');
      const match = notes.match(regex);
      if (!match) return fallback;
      const value = match[1].trim().toUpperCase();
      return value.includes('AM') || value.includes('PM') ? value : `${value} ${label === 'Entrada' ? 'PM' : 'AM'}`;
    };

    const defaultCheckIn = '03:00 PM';
    const defaultCheckOut = '11:00 AM';

    blocks?.forEach((block) => {
      const blockDays = getDatesBetween(block.start_date, block.end_date);

      blockDays.forEach((dayStr) => {
        if (allDaysStr.includes(dayStr)) {
          blockedDates.add(dayStr);
        }
      });
    });

    bookings?.forEach((booking) => {
      arrivals.push({
        date: booking.start_date,
        time: extractTimeFromNotes(booking.customer_notes, 'Entrada', defaultCheckIn),
        status: booking.status,
      });
      departures.push({
        date: booking.end_date,
        time: extractTimeFromNotes(booking.customer_notes, 'Salida', defaultCheckOut),
        status: booking.status,
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
      arrivals,
      departures,
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
