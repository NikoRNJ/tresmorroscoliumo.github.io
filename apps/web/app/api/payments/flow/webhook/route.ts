import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { flowClient } from '@/lib/flow/client';
import { FlowPaymentStatusCode } from '@/types/flow';
import { sendBookingConfirmation } from '@/lib/email/service';
import type { Database } from '@/types/database';

type Booking = Database['public']['Tables']['bookings']['Row'];

/**
 * POST /api/payments/flow/webhook
 * 
 * Webhook llamado por Flow cuando se completa un pago
 * Flow envía: { token: string, s: string (signature) }
 * 
 * IMPORTANTE: Este endpoint debe ser público y accesible desde internet
 * Flow lo llamará automáticamente después de cada pago
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parsear el body (Flow envía form-urlencoded)
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const signature = formData.get('s') as string;

    if (!token || !signature) {
      console.error('Missing token or signature in webhook');
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
    }

    // 2. Validar la firma del webhook
    const isValidSignature = flowClient.validateWebhookSignature(
      { token },
      signature
    );

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'webhook_invalid_signature',
        event_source: 'flow',
        payload: { token },
        status: 'error',
        error_message: 'Invalid signature',
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Consultar el estado del pago en Flow
    const paymentStatus = await flowClient.getPaymentStatus(token);

    console.log('Flow payment status:', paymentStatus);

    // 4. Buscar la reserva por commerceOrder (nuestro bookingId)
    const bookingId = paymentStatus.commerceOrder;

    const { data: bookings, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .limit(1);

    const booking = bookings?.[0] as Booking | undefined;

    if (bookingError || !booking) {
      console.error('Booking not found for Flow order:', paymentStatus.flowOrder);
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'webhook_booking_not_found',
        event_source: 'flow',
        payload: paymentStatus,
        status: 'error',
        error_message: 'Booking not found',
      });
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 5. Procesar según el estado del pago
    if (paymentStatus.status === FlowPaymentStatusCode.PAID) {
      // PAGO EXITOSO
      
      // Actualizar la reserva a 'paid'
      const { error: updateError } = await (supabaseAdmin.from('bookings') as any)
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          flow_payment_data: paymentStatus,
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('Error updating booking to paid:', updateError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      // Log del evento exitoso
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'payment_success',
        event_source: 'flow',
        booking_id: bookingId,
        payload: paymentStatus,
        status: 'success',
      });

      console.log(`✅ Payment successful for booking ${bookingId}`);

      // ✅ NUEVO: Enviar email de confirmación
      try {
        // Obtener datos completos de la reserva con la información de la cabaña
        const { data: fullBookings } = await supabaseAdmin
          .from('bookings')
          .select('*, cabins(*)')
          .eq('id', bookingId)
          .limit(1);

        // Type assertion para el booking con relación a cabins
        type BookingWithCabin = Booking & {
          cabins: Database['public']['Tables']['cabins']['Row'];
        };
        const fullBooking = fullBookings?.[0] as BookingWithCabin | undefined;

        if (fullBooking && fullBooking.cabins) {
          const bookingReference = bookingId.substring(0, 8).toUpperCase();
          let towelsCount = 0
          try {
            const { data: events } = await supabaseAdmin
              .from('api_events')
              .select('payload')
              .eq('booking_id', bookingId)
              .eq('event_type', 'booking_hold_created')
              .limit(1)
            const payload = (events?.[0] as any)?.payload
            if (payload && typeof payload.towels_count === 'number') {
              towelsCount = Math.max(0, Math.min(7, payload.towels_count))
            }
          } catch {}
          
          await sendBookingConfirmation({
            to: {
              email: fullBooking.customer_email,
              name: fullBooking.customer_name,
            },
            subject: `✅ Reserva confirmada - ${fullBooking.cabins.title} - Ref: ${bookingReference}`,
            bookingId: bookingId,
            bookingReference,
            cabinName: fullBooking.cabins.title,
            cabinSlug: fullBooking.cabins.slug,
            checkInDate: fullBooking.start_date,
            checkOutDate: fullBooking.end_date,
            numberOfGuests: fullBooking.party_size,
            hasJacuzzi: (fullBooking.jacuzzi_days as string[])?.length > 0,
            jacuzziDays: (fullBooking.jacuzzi_days as string[]) || [],
            towelsCount,
            towelsPrice: towelsCount * 2000,
            totalPrice: fullBooking.amount_total,
            customerName: fullBooking.customer_name,
            customerEmail: fullBooking.customer_email,
            customerPhone: fullBooking.customer_phone,
          });

          // Actualizar timestamp de confirmación enviada
          await (supabaseAdmin.from('bookings') as any)
            .update({ confirmation_sent_at: new Date().toISOString() })
            .eq('id', bookingId);
        }
      } catch (emailError) {
        // No fallar el webhook si el email falla
        console.error('Error sending confirmation email:', emailError);
      }

      return NextResponse.json({ success: true, status: 'paid' });
    } else if (paymentStatus.status === FlowPaymentStatusCode.REJECTED) {
      // PAGO RECHAZADO
      
      // Actualizar estado (pero mantener el hold por si quiere reintentar)
      await (supabaseAdmin.from('bookings') as any)
        .update({
          flow_payment_data: paymentStatus,
        })
        .eq('id', bookingId);

      // Log del evento
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'payment_rejected',
        event_source: 'flow',
        booking_id: bookingId,
        payload: paymentStatus,
        status: 'error',
        error_message: 'Payment rejected by bank',
      });

      console.log(`❌ Payment rejected for booking ${bookingId}`);

      return NextResponse.json({ success: true, status: 'rejected' });
    } else if (paymentStatus.status === FlowPaymentStatusCode.CANCELLED) {
      // PAGO CANCELADO POR EL USUARIO
      
      await (supabaseAdmin.from('bookings') as any)
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          flow_payment_data: paymentStatus,
        })
        .eq('id', bookingId);

      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'payment_cancelled',
        event_source: 'flow',
        booking_id: bookingId,
        payload: paymentStatus,
        status: 'success',
      });

      console.log(`🚫 Payment cancelled for booking ${bookingId}`);

      return NextResponse.json({ success: true, status: 'cancelled' });
    } else {
      // PENDIENTE u otro estado
      
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'payment_pending',
        event_source: 'flow',
        booking_id: bookingId,
        payload: paymentStatus,
        status: 'success',
      });

      return NextResponse.json({ success: true, status: 'pending' });
    }
  } catch (error) {
    console.error('Error processing Flow webhook:', error);

    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: 'webhook_error',
      event_source: 'flow',
      payload: { error: error instanceof Error ? error.message : 'Unknown error' },
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * GET /api/payments/flow/webhook
 * 
 * Flow puede hacer un GET para verificar que el webhook está activo
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Flow webhook endpoint',
    timestamp: new Date().toISOString(),
  });
}
