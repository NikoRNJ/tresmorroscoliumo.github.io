import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { supabaseAdmin } from '@/lib/supabase/server';
import { flowClient } from '@/lib/flow/client';
import { FlowPaymentStatusCode } from '@/types/flow';
import { sendBookingConfirmationForBooking } from '@/lib/email/service';
import { isAfter, parseISO } from 'date-fns';
import type { Database } from '@/types/database';

type Booking = Database['public']['Tables']['bookings']['Row'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const rawPayload = Object.fromEntries(formData.entries()) as Record<string, string>;
    const { s: signature, ...payloadForSignature } = rawPayload;
    const token = payloadForSignature.token;

    if (!token || !signature) {
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'flow_webhook_missing_params',
        event_source: 'flow',
        payload: payloadForSignature,
        status: 'error',
        error_message: 'Missing token or signature',
      });
      return NextResponse.json({ success: false, code: 'MISSING_PARAMS', message: 'Faltan parámetros obligatorios' }, { status: 200 });
    }

    const isValidSignature = flowClient.validateWebhookSignature(payloadForSignature, signature);
    if (!isValidSignature) {
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'webhook_invalid_signature',
        event_source: 'flow',
        payload: payloadForSignature,
        status: 'error',
        error_message: 'Invalid signature',
      });
      return NextResponse.json({ success: false, code: 'INVALID_SIGNATURE', message: 'Firma inválida' }, { status: 200 });
    }

    let paymentStatus;
    try {
      paymentStatus = await flowClient.getPaymentStatus(token);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Flow getStatus error';
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'flow_get_status_error',
        event_source: 'flow',
        payload: { token, error: message },
        status: 'error',
        error_message: message,
      });
      return NextResponse.json({ success: false, code: 'GET_STATUS_ERROR', message: 'No se pudo consultar el estado en Flow' }, { status: 200 });
    }

    const bookingId = paymentStatus.commerceOrder;
    const { data: bookings, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .limit(1);

    const booking = bookings?.[0] as Booking | undefined;

    if (bookingError || !booking) {
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'webhook_booking_not_found',
        event_source: 'flow',
        payload: paymentStatus,
        status: 'error',
        error_message: 'Booking not found',
      });
      return NextResponse.json({ success: false, code: 'BOOKING_NOT_FOUND', message: 'Reserva no encontrada' }, { status: 200 });
    }

    const now = new Date();

    // Idempotencia: si ya está pagado con el mismo token/order
    if (booking.status === 'paid') {
      const stored = booking.flow_payment_data as any;
      const storedToken = typeof stored?.token === 'string' ? stored.token : null;
      const storedOrder =
        typeof stored?.flowOrder === 'number' ? String(stored.flowOrder) : booking.flow_order_id;
      if ((storedToken && storedToken === token) || (storedOrder && storedOrder === String(paymentStatus.flowOrder))) {
        return NextResponse.json({ success: true, status: 'paid', code: 'ALREADY_PAID', message: 'Pago ya confirmado anteriormente' }, { status: 200 });
      }
      return NextResponse.json({ success: false, code: 'ALREADY_PAID_MISMATCH', message: 'La reserva ya está pagada con otro token/orden' }, { status: 200 });
    }

    // No aceptar pagos de bookings canceladas/expiradas
    if (booking.status === 'canceled' || booking.status === 'expired') {
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'payment_rejected_invalid_state',
        event_source: 'flow',
        booking_id: bookingId,
        payload: { paymentStatus, bookingStatus: booking.status },
        status: 'error',
        error_message: 'Booking no vigente',
      });
      return NextResponse.json({ success: false, code: 'INVALID_BOOKING_STATE', message: 'La reserva ya no está vigente' }, { status: 200 });
    }

    if (booking.expires_at && !isAfter(parseISO(booking.expires_at), now)) {
      await (supabaseAdmin.from('bookings') as any)
        .update({ status: 'expired' })
        .eq('id', bookingId);

      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'payment_rejected_expired_hold',
        event_source: 'flow',
        booking_id: bookingId,
        payload: { paymentStatus, expiredAt: booking.expires_at },
        status: 'error',
        error_message: 'Hold expirado',
      });

      return NextResponse.json({ success: false, code: 'HOLD_EXPIRED', message: 'El tiempo para pagar expiró' }, { status: 200 });
    }

    // Procesar estado
    if (paymentStatus.status === FlowPaymentStatusCode.PAID) {
      const { error: updateError } = await (supabaseAdmin.from('bookings') as any)
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          flow_payment_data: paymentStatus,
        })
        .eq('id', bookingId);

      if (updateError) {
        return NextResponse.json({ success: false, code: 'DB_ERROR', message: 'No se pudo guardar el pago' }, { status: 200 });
      }

      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'payment_success',
        event_source: 'flow',
        booking_id: bookingId,
        payload: paymentStatus,
        status: 'success',
      });

      try {
        await sendBookingConfirmationForBooking(bookingId);
      } catch (err) {
        Sentry.captureException(err, { tags: { scope: 'email_confirmation' }, extra: { bookingId } });
      }

      return NextResponse.json({ success: true, status: 'paid', code: 'PAID', message: 'Pago confirmado' }, { status: 200 });
    }

    if (paymentStatus.status === FlowPaymentStatusCode.REJECTED) {
      await (supabaseAdmin.from('bookings') as any)
        .update({
          flow_payment_data: paymentStatus,
        })
        .eq('id', bookingId);

      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'payment_rejected',
        event_source: 'flow',
        booking_id: bookingId,
        payload: paymentStatus,
        status: 'error',
        error_message: 'Payment rejected by bank',
      });

      return NextResponse.json(
        { success: false, status: 'rejected', code: 'REJECTED', message: 'Pago rechazado por el emisor' },
        { status: 200 }
      );
    }

    if (paymentStatus.status === FlowPaymentStatusCode.CANCELLED) {
      await (supabaseAdmin.from('bookings') as any)
        .update({
          flow_payment_data: paymentStatus,
          flow_order_id: null,
        })
        .eq('id', bookingId);

      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'payment_cancelled',
        event_source: 'flow',
        booking_id: bookingId,
        payload: paymentStatus,
        status: 'success',
        error_message: 'Payment cancelled by user - order cleared',
      });

      return NextResponse.json(
        { success: false, status: 'cancelled', code: 'CANCELLED', message: 'Pago cancelado. Puedes intentar nuevamente.' },
        { status: 200 }
      );
    }

    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: 'payment_pending',
      event_source: 'flow',
      booking_id: bookingId,
      payload: paymentStatus,
      status: 'success',
    });

    return NextResponse.json(
      { success: false, status: 'pending', code: 'PENDING', message: 'Pago en proceso, intenta en unos segundos' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Flow confirmation webhook error:', error);
    Sentry.captureException(error, { tags: { scope: 'flow_webhook_error' } });
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Error interno' }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
