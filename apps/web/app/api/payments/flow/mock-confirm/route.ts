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
 * Solo accesible cuando Flow está en mock y con header secreto.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar modo mock y entorno
    const flowApiKey = (process.env.FLOW_API_KEY || '').trim();
    const flowSecretKey = (process.env.FLOW_SECRET_KEY || '').trim();
    const flowBaseUrl = (process.env.FLOW_BASE_URL || '').trim();
    const forceMock = String(process.env.FLOW_FORCE_MOCK || '').toLowerCase() === 'true';
    const allowMockInProd = String(process.env.FLOW_ALLOW_MOCK_IN_PROD || '').toLowerCase() === 'true';
    const runtimeEnv = (process.env.NEXT_PUBLIC_SITE_ENV || process.env.NODE_ENV || '').toLowerCase();
    const mockSecret = (process.env.FLOW_MOCK_SECRET || '').trim();
    const isMockFlow = !flowApiKey || !flowSecretKey || !flowBaseUrl || forceMock;

    if (!isMockFlow) {
      return NextResponse.json(
        { error: 'Este endpoint solo está disponible en modo mock' },
        { status: 403 }
      );
    }

    if (runtimeEnv === 'production' && !allowMockInProd) {
      return NextResponse.json(
        { error: 'Mock de Flow deshabilitado en producción' },
        { status: 403 }
      );
    }

    if (!mockSecret) {
      return NextResponse.json(
        { error: 'FLOW_MOCK_SECRET no configurado' },
        { status: 500 }
      );
    }

    const providedSecret = request.headers.get('x-mock-secret');
    if (providedSecret !== mockSecret) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
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

      try {
        await sendBookingConfirmationForBooking(bookingId);
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: 'Pago mock confirmado exitosamente',
        status: 'paid',
      });
    } else if (action === 'cancel') {
      const { error: updateError } = await (supabaseAdmin.from('bookings') as any)
        .update({
          flow_order_id: null,
          flow_payment_data: { token, status: 4, cancelled_at: new Date().toISOString() },
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('Error updating booking to canceled:', updateError);
        return NextResponse.json(
          { error: 'Error al cancelar' },
          { status: 500 }
        );
      }

      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'flow_mock_payment_cancelled',
        event_source: 'mock',
        booking_id: bookingId,
        payload: {
          token,
          action: 'cancel',
          cancelled_at: new Date().toISOString(),
        },
        status: 'success',
      });

      return NextResponse.json({
        success: true,
        message: 'Pago mock cancelado. Puedes intentar nuevamente.',
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
