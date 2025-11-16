import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { flowClient } from '@/lib/flow/client';
import { z } from 'zod';
import { isAfter, parseISO } from 'date-fns';
import type { Database } from '@/types/database';

type Booking = Database['public']['Tables']['bookings']['Row'];
type Cabin = Database['public']['Tables']['cabins']['Row'];

// Schema de validación
const createPaymentSchema = z.object({
  bookingId: z.string().uuid('ID de reserva inválido'),
});

/**
 * POST /api/payments/flow/create
 * 
 * Crea una orden de pago en Flow para una reserva existente
 * 
 * Body:
 * {
 *   bookingId: string
 * }
 * 
 * Retorna:
 * {
 *   success: true,
 *   paymentUrl: string,  // URL para redirigir al usuario
 *   token: string,       // Token de Flow
 *   flowOrder: number    // ID de orden en Flow
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar body
    const body = await request.json();
    const { bookingId } = createPaymentSchema.parse(body);

    // 2. Obtener la reserva con join a cabin
    const { data: bookings, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*, cabin:cabins(*)')
      .eq('id', bookingId)
      .limit(1);

    const booking = bookings?.[0] as (Booking & { cabin: Cabin }) | undefined;

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // 3. Validar que la reserva está en estado pending
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: `La reserva ya está en estado: ${booking.status}` },
        { status: 400 }
      );
    }

    // 4. Validar que el hold no ha expirado
    if (booking.expires_at) {
      const expiresAt = parseISO(booking.expires_at);
      const now = new Date();
      
      if (!isAfter(expiresAt, now)) {
        // Marcar como expirado
        await (supabaseAdmin.from('bookings') as any)
          .update({ status: 'expired' })
          .eq('id', bookingId);

        return NextResponse.json(
          { error: 'El tiempo para pagar ha expirado. Por favor crea una nueva reserva.' },
          { status: 410 } // 410 Gone
        );
      }
    }

    const isMockFlow = !flowClient.isConfigured();

    // 5. Verificar si ya existe una orden de Flow para esta reserva
    if (booking.flow_order_id) {
      return NextResponse.json(
        { 
          error: 'Ya existe una orden de pago para esta reserva',
          existingOrder: booking.flow_order_id 
        },
        { status: 409 }
      );
    }

    // 6. Crear la orden en Flow
    const externalUrl = process.env.PUBLIC_EXTERNAL_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    const flowPayment = await flowClient.createPayment({
      commerceOrder: bookingId, // Usamos el booking ID como commerce order
      subject: `Reserva ${booking.cabin.title} - Tres Morros de Coliumo`,
      currency: 'CLP',
      amount: booking.amount_total,
      email: booking.customer_email,
      urlConfirmation: `${externalUrl}/api/payments/flow/webhook`,
      urlReturn: `${externalUrl}/pago/confirmacion?booking=${bookingId}`,
      optional: JSON.stringify({
        bookingId,
        cabinId: booking.cabin_id,
        customerName: booking.customer_name,
      }),
    });

    // 7. Guardar el flow_order_id en la reserva
    const bookingUpdate: Record<string, unknown> = {
      flow_order_id: String(flowPayment.flowOrder),
      flow_payment_data: {
        token: flowPayment.token,
        url: flowPayment.url,
        createdAt: new Date().toISOString(),
        mode: isMockFlow ? 'mock' : 'live',
      },
    };

    if (isMockFlow) {
      bookingUpdate.status = 'paid';
      bookingUpdate.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await (supabaseAdmin.from('bookings') as any)
      .update(bookingUpdate)
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking with flow order:', updateError);
      // No retornamos error porque la orden ya se creó en Flow
    }

    // 8. Log del evento
    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: 'flow_payment_created',
      event_source: 'flow',
      booking_id: bookingId,
      payload: {
        flowOrder: flowPayment.flowOrder,
        token: flowPayment.token,
        amount: booking.amount_total,
        mode: isMockFlow ? 'mock' : 'live',
      },
      status: 'success',
    });

    if (isMockFlow) {
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'flow_payment_mock_paid',
        event_source: 'system',
        booking_id: bookingId,
        payload: {
          flowOrder: flowPayment.flowOrder,
          token: flowPayment.token,
          amount: booking.amount_total,
        },
        status: 'success',
      });
    }

    // 9. Retornar la URL de pago
    return NextResponse.json({
      success: true,
      paymentUrl: flowPayment.url,
      token: flowPayment.token,
      flowOrder: flowPayment.flowOrder,
    });
  } catch (error) {
    console.error('Error creating Flow payment:', error);

    if (error instanceof z.ZodError) {
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'flow_payment_invalid_data',
        event_source: 'system',
        payload: { issues: error.issues },
        status: 'error',
        error_message: 'Invalid data',
      });

      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: 'flow_payment_error',
      event_source: 'flow',
      payload: { error: error instanceof Error ? error.message : 'Unknown error' },
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    const message = error instanceof Error ? error.message : 'Error al crear la orden de pago'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
