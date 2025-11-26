import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { supabaseAdmin } from '@/lib/supabase/server';
import { flowClient } from '@/lib/flow/client';
import { FlowPaymentStatusCode } from '@/types/flow';
import { sendBookingConfirmationForBooking } from '@/lib/email/service';
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
    const runtimeEnv = (process.env.NEXT_PUBLIC_SITE_ENV || process.env.NODE_ENV || '').toLowerCase();
    const isProdRuntime = runtimeEnv === 'production';
    const isMockFlow = !flowClient.isConfigured();
    const allowMockInProd = (process.env.FLOW_ALLOW_MOCK_IN_PROD || '').toLowerCase() === 'true';

    if (isProdRuntime && isMockFlow && !allowMockInProd) {
      const errorMessage = 'Flow webhook recibió una llamada pero Flow está deshabilitado/mode mock en producción.';
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'flow_payment_error',
        event_source: 'flow',
        payload: { reason: 'webhook_on_mock', runtimeEnv },
        status: 'error',
        error_message: errorMessage,
      });
      Sentry.captureMessage(errorMessage, { level: 'error', extra: { runtimeEnv } });
      return NextResponse.json({ error: 'Flow no está configurado' }, { status: 503 });
    }

    // 1. Parsear el body (Flow envía form-urlencoded)
    const formData = await request.formData();
    const rawPayload = Object.fromEntries(formData.entries()) as Record<string, string>;
    const { s: signature, ...payloadForSignature } = rawPayload;
    const token = payloadForSignature.token;

    if (!token || !signature) {
      console.error('Missing token or signature in webhook');
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
    }

    // 2. Validar la firma del webhook
    const isValidSignature = flowClient.validateWebhookSignature(
      payloadForSignature,
      signature
    );

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      Sentry.captureMessage('Invalid Flow webhook signature', {
        level: 'warning',
        extra: { payload: payloadForSignature },
      });
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'webhook_invalid_signature',
        event_source: 'flow',
        payload: payloadForSignature,
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
      Sentry.captureMessage('Flow webhook booking not found', {
        level: 'warning',
        extra: { paymentStatus },
      });
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
      
      // IDEMPOTENCIA: Verificar si la reserva ya está pagada para evitar procesamiento duplicado
      if (booking.status === 'paid') {
        console.log(`ℹ️ Webhook received for already paid booking ${bookingId} - ignoring duplicate`);
        
        // Log del evento duplicado para auditoría
        await (supabaseAdmin.from('api_events') as any).insert({
          event_type: 'payment_webhook_duplicate',
          event_source: 'flow',
          booking_id: bookingId,
          payload: paymentStatus,
          status: 'success',
        });
        
        return NextResponse.json({ success: true, status: 'already_paid' });
      }

      // Actualizar la reserva a 'paid' con condición de idempotencia
      // Solo actualiza si el estado actual es 'pending' (optimistic locking)
      const { data: updatedBookings, error: updateError } = await (supabaseAdmin.from('bookings') as any)
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          flow_payment_data: paymentStatus,
        })
        .eq('id', bookingId)
        .eq('status', 'pending') // Solo actualiza si aún está pending
        .select('id')
        .limit(1);

      if (updateError) {
        console.error('Error updating booking to paid:', updateError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      // Si no se actualizó ninguna fila, puede que haya sido procesada por otro webhook concurrente
      if (!updatedBookings || updatedBookings.length === 0) {
        console.log(`⚠️ Booking ${bookingId} was not updated - possibly already processed by concurrent webhook`);
        
        await (supabaseAdmin.from('api_events') as any).insert({
          event_type: 'payment_webhook_concurrent',
          event_source: 'flow',
          booking_id: bookingId,
          payload: paymentStatus,
          status: 'success',
        });
        
        return NextResponse.json({ success: true, status: 'concurrent_update' });
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

      // Enviar email de confirmación (manejado internamente)
      await sendBookingConfirmationForBooking(bookingId);

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
    Sentry.captureException(error, { tags: { scope: 'flow_payment_error', action: 'webhook' } });

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
