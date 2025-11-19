import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { supabaseAdmin } from '@/lib/supabase/server';
import { flowClient } from '@/lib/flow/client';
import { sendBookingConfirmationForBooking } from '@/lib/email/service';
import { z } from 'zod';
import { isAfter, parseISO } from 'date-fns';
import type { Database } from '@/types/database';

type Booking = Database['public']['Tables']['bookings']['Row'];
type Cabin = Database['public']['Tables']['cabins']['Row'];

const DEFAULT_FLOW_ORDER_TTL_MINUTES = 30;

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
  let bookingId: string | undefined;
  try {
    // 1. Validar body
    const body = await request.json();
    ({ bookingId } = createPaymentSchema.parse(body));

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
    const runtimeEnv = (process.env.NEXT_PUBLIC_SITE_ENV || process.env.NODE_ENV || '').toLowerCase();
    const isProdRuntime = runtimeEnv === 'production';
    const allowMockInProd = (process.env.FLOW_ALLOW_MOCK_IN_PROD || '').toLowerCase() === 'true';

    if (isProdRuntime && isMockFlow && !allowMockInProd) {
      const errorMessage = 'Flow está en modo mock en un entorno marcado como producción.';
      const extra = {
        bookingId,
        runtimeEnv,
      };

      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'flow_payment_error',
        event_source: 'flow',
        booking_id: bookingId,
        payload: extra,
        status: 'error',
        error_message: errorMessage,
      });

      Sentry.captureMessage(errorMessage, { level: 'error', extra });

      return NextResponse.json(
        {
          error:
            'El servicio de pagos no está disponible en este momento. Intenta nuevamente en unos minutos.',
        },
        { status: 503 }
      );
    }

    // 5. Verificar si ya existe una orden de Flow para esta reserva
    if (booking.flow_order_id) {
      const previousPaymentData = (booking.flow_payment_data ?? null) as Record<string, any> | null;
      const previousPaymentUrl =
        typeof previousPaymentData?.url === 'string' ? previousPaymentData.url : null;
      const previousToken =
        typeof previousPaymentData?.token === 'string' ? previousPaymentData.token : null;
      const previousFlowOrder = booking.flow_order_id;
      const createdAtIso =
        typeof previousPaymentData?.createdAt === 'string' ? previousPaymentData.createdAt : null;
      const ttlMinutesEnv = Number(process.env.FLOW_ORDER_TTL_MINUTES ?? DEFAULT_FLOW_ORDER_TTL_MINUTES);
      const ttlMs =
        (Number.isFinite(ttlMinutesEnv) && ttlMinutesEnv > 0
          ? ttlMinutesEnv
          : DEFAULT_FLOW_ORDER_TTL_MINUTES) *
        60 *
        1000;
      const createdAt = createdAtIso ? new Date(createdAtIso).getTime() : null;
      const nowMs = Date.now();
      const orderIsStale = !createdAt || nowMs - createdAt > ttlMs;
      const missingData = !previousPaymentUrl || !previousToken;

      if (!orderIsStale && !missingData) {
        return NextResponse.json(
          {
            error: 'Ya existe una orden de pago para esta reserva',
            existingOrder: previousFlowOrder,
            flowOrder: previousFlowOrder,
            paymentUrl: previousPaymentUrl,
            token: previousToken,
            mode:
              typeof previousPaymentData?.mode === 'string'
                ? previousPaymentData.mode
                : isMockFlow
                  ? 'mock'
                  : 'live',
            status: booking.status,
          },
          { status: 409 }
        );
      }

      const { error: resetError } = await (supabaseAdmin.from('bookings') as any)
        .update({
          flow_order_id: null,
          flow_payment_data: null,
        })
        .eq('id', bookingId);

      if (resetError) {
        console.error('Error resetting Flow order info:', resetError);
        return NextResponse.json({ error: 'No se pudo regenerar la orden de pago' }, { status: 500 });
      }

      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'flow_payment_regenerated',
        event_source: 'flow',
        booking_id: bookingId,
        payload: {
          previousFlowOrder,
          previousCreatedAt: createdAtIso,
          reason: missingData ? 'missing_data' : 'expired',
        },
        status: 'success',
      });

      booking.flow_order_id = null;
      booking.flow_payment_data = null;
    }

    // 6. Crear la orden en Flow
    let externalUrl = process.env.PUBLIC_EXTERNAL_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    externalUrl = externalUrl.replace(/\/$/, ''); // Remove trailing slash

    if (isProdRuntime && externalUrl.includes('localhost')) {
      console.warn('⚠️ Flow payment created with localhost URL in production environment. Webhooks will fail.');
    }

    const flowPayment = await flowClient.createPayment({
      commerceOrder: bookingId, // Usamos el booking ID como commerce order
      subject: `Reserva ${booking.cabin.title} - Tres Morros de Coliumo`,
      currency: 'CLP',
      amount: booking.amount_total,
      email: booking.customer_email || 'no-email@example.com',
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
    } else if (isMockFlow) {
      // Simular confirmación automática en modo mock para probar emails end-to-end
      try {
        await sendBookingConfirmationForBooking(bookingId!);
      } catch (emailError) {
        console.error('Error sending mock confirmation email:', emailError);
      }
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

    const errorPayload = { error: error instanceof Error ? error.message : 'Unknown error' };

    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: 'flow_payment_error',
      event_source: 'flow',
      payload: errorPayload,
      status: 'error',
      error_message: errorPayload.error,
    });

    Sentry.captureException(error, {
      tags: { scope: 'flow_payment_error' },
      extra: { bookingId },
    });

    const rawMessage = errorPayload.error;
    const isFlowAuthError =
      typeof rawMessage === 'string' &&
      /401/.test(rawMessage) &&
      /apiKey not found|Api Key/i.test(rawMessage);

    if (isFlowAuthError) {
      const hint =
        'Flow rechazó las credenciales configuradas (apiKey/secret). Revisa las claves en DigitalOcean o habilita el modo mock temporalmente.';
      return NextResponse.json(
        {
          error: hint,
          code: 'FLOW_AUTH_ERROR',
        },
        { status: 502 }
      );
    }

    const message = error instanceof Error ? error.message : 'Error al crear la orden de pago';
    return NextResponse.json({ error: message, code: 'FLOW_PAYMENT_ERROR' }, { status: 500 });
  }
}
