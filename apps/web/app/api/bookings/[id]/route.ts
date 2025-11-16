import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type Booking = Database['public']['Tables']['bookings']['Row'];
type Cabin = Database['public']['Tables']['cabins']['Row'];

interface BookingWithCabin extends Booking {
  cabin: Cabin;
}

/**
 * GET /api/bookings/[id]
 * 
 * Obtiene los detalles completos de una reserva, incluyendo datos de la cabaña
 * Usado en: página de pago y confirmación
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Consultar la reserva con join a la cabaña
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        cabin:cabin_id (*)
      `)
      .eq('id', bookingId)
      .limit(1);

    if (error) {
      console.error('Error fetching booking:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const booking = bookings?.[0] as BookingWithCabin | undefined;

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verificar si la reserva ha expirado
    const now = new Date();
    const expiresAt = booking.expires_at ? new Date(booking.expires_at) : now;
    const isExpired = booking.status === 'pending' && booking.expires_at && now > expiresAt;

    // Calcular tiempo restante para el hold (en segundos)
    const timeRemaining = isExpired ? 0 : Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    // Retornar datos enriquecidos
    return NextResponse.json({
      booking: {
        ...booking,
        isExpired,
        timeRemaining,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/bookings/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
