import { NextRequest, NextResponse } from 'next/server';
import { getBookingWithMeta } from '@/lib/data/bookings';

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

    const { booking, error } = await getBookingWithMeta(bookingId);

    if (!booking) {
      if (error) {
        console.error('Error fetching booking:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({
      booking: {
        ...booking,
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
