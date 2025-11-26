import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendBookingConfirmationForBooking } from '@/lib/email/service';
import { z } from 'zod';
import type { Database } from '@/types/database';

type Booking = Database['public']['Tables']['bookings']['Row'];

const mockConfirmSchema = z.object({
  bookingId: z.string().uuid('ID de reserva inválido'),
  token: z.string().min(1, 'Token requerido'),
  action: z.enum(['pay', 'cancel']),
});

/**
 * POST /api/payments/flow/mock-confirm
 * 
 * Endpoint para confirmar/cancelar un pago en modo mock.
 * Este endpoint SOLO funciona cuando Flow está en modo mock.
 * 
 * Simula lo que haría el webhook de Flow en modo real:
 * - action: 'pay' → marca la reserva como 'paid' y envía email de confirmación
 * - action: 'cancel' → marca la reserva como 'canceled'
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar que estamos en modo mock
    const flowApiKey = (process.env.FLOW_API_KEY || '').trim();
    const flowSecretKey = (process.env.FLOW_SECRET_KEY || '').trim();
    const flowBaseUrl = (process.env.FLOW_BASE_URL || '').trim();
    const forceMock = String(process.env.FLOW_FORCE_MOCK || '').toLowerCase() === 'true';
    const isMockFlow = !flowApiKey || !flowSecretKey || !flowBaseUrl || forceMock;

    if (!isMockFlow) {
      return NextResponse.json(
        { error: 'Este endpoint solo está disponible en modo mock' },
        { status: 403 }
      );
    }

    // 2. Validar body
    const body = await request.json();
    const { bookingId, token, action } = mockConfirmSchema.parse(body);

    // 3. Verificar que el token corresponde a la reserva
    if (!token.includes(bookingId)) {
      return NextResponse.json(
        { error: 'Token inválido para esta reserva' },
        { status: 400 }
      );
    }

    // 4. Obtener la reserva
    const { data: bookings, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .limit(1);

    const booking = bookings?.[0] as Booking | undefined;

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // 5. Verificar que la reserva está en estado pending
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: `La reserva ya está en estado: ${booking.status}` },
        { status: 400 }
      );
    }

    // 6. Procesar según la acción
    if (action === 'pay') {
      // Marcar como pagado
      const { error: updateError } = await (supabaseAdmin.from('bookings') as any)
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('Error updating booking to paid:', updateError);
        return NextResponse.json(
          { error: 'Error al procesar el pago' },
          { status: 500 }
        );
      }

      // Log del evento
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'flow_mock_payment_confirmed',
        event_source: 'mock',
        booking_id: bookingId,
        payload: {
          token,
          action: 'pay',
          paid_at: new Date().toISOString(),
        },
        status: 'success',
      });

      // Enviar email de confirmación
      try {
        await sendBookingConfirmationForBooking(bookingId);
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // No fallamos la operación por error de email
      }

      return NextResponse.json({
        success: true,
        message: 'Pago mock confirmado exitosamente',
        status: 'paid',
      });

    } else if (action === 'cancel') {
      // Marcar como cancelado
      const { error: updateError } = await (supabaseAdmin.from('bookings') as any)
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('Error updating booking to canceled:', updateError);
        return NextResponse.json(
          { error: 'Error al cancelar' },
          { status: 500 }
        );
      }

      // Log del evento
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'flow_mock_payment_cancelled',
        event_source: 'mock',
        booking_id: bookingId,
        payload: {
          token,
          action: 'cancel',
          canceled_at: new Date().toISOString(),
        },
        status: 'success',
      });

      return NextResponse.json({
        success: true,
        message: 'Pago mock cancelado',
        status: 'canceled',
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

  } catch (error) {
    console.error('Error in mock-confirm:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
