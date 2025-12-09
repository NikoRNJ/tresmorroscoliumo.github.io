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

      console.log(`[Payment Debug] Checking expiration. Booking=${bookingId}, Expires=${booking.expires_at}, Now=${now.toISOString()}`);

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
    // Permite usar sandbox incluso si NEXT_PUBLIC_SITE_ENV marca producción. Se puede forzar bloqueo con FLOW_ALLOW_SANDBOX_IN_PROD=false.
    const allowSandboxInProd = (process.env.FLOW_ALLOW_SANDBOX_IN_PROD || 'true').toLowerCase() === 'true';
    const flowBaseUrl = (process.env.FLOW_BASE_URL || '').toLowerCase();
    const baseLooksSandbox = flowBaseUrl.includes('sandbox.flow.cl');

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

    if (isProdRuntime && baseLooksSandbox && !allowSandboxInProd) {
      const warningMessage =
        'Flow apunta a sandbox en un entorno marcado como produccion. Se permite continuar para pruebas (FLOW_ALLOW_SANDBOX_IN_PROD).';
      const extra = {
        bookingId,
        runtimeEnv,
        flowBaseUrl: process.env.FLOW_BASE_URL,
      };

      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'flow_payment_sandbox_in_prod',
        event_source: 'flow',
        booking_id: bookingId,
        payload: extra,
        status: 'warning',
        error_message: warningMessage,
      });

      Sentry.captureMessage(warningMessage, { level: 'warning', extra });
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

    // 6. Resolver URL externa a partir de NEXT_PUBLIC_SITE_URL (ngrok en dev, dominio en prod)
    const siteBase = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteBase) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SITE_URL no configurada' },
        { status: 500 }
      );
    }
    let externalUrl = siteBase;
    try {
      const parsed = new URL(siteBase);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Protocol must be http/https');
      }
      externalUrl = parsed.toString().replace(/\/$/, '');
    } catch (err) {
      console.error('Invalid NEXT_PUBLIC_SITE_URL:', err);
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SITE_URL inválida, revisa el .env' },
        { status: 500 }
      );
    }

    const flowPayment = await flowClient.createPayment({
      commerceOrder: bookingId, // Usamos el booking ID como commerce order
      subject: `Reserva ${booking.cabin.title} - Tres Morros de Coliumo`,
      currency: 'CLP',
      amount: booking.amount_total,
      email: booking.customer_email || 'no-email@example.com',
      urlConfirmation: `${externalUrl}/api/payments/flow/webhook`,
      // Endpoint dedicado que redirige a /pago/confirmacion con token para evitar POST directo a la página
      urlReturn: `${externalUrl}/api/payments/flow/return`,
      optional: JSON.stringify({ bookingId }),
    });

    // 7. Guardar el flow_order_id en la reserva
    // IMPORTANTE: NO marcamos como 'paid' aquí. El estado solo cambia cuando:
    // - Flow real: el webhook /api/payments/flow/webhook confirma el pago
    // - Mock: el usuario confirma en /pago/mock-gateway
    const bookingUpdate: Record<string, unknown> = {
      flow_order_id: String(flowPayment.flowOrder),
      flow_payment_data: {
        token: flowPayment.token,
        url: flowPayment.url,
        createdAt: new Date().toISOString(),
        mode: isMockFlow ? 'mock' : 'live',
      },
    };

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

    // 9. Retornar la URL de pago
    return NextResponse.json({
      success: true,
      paymentUrl: flowPayment.url,
      token: flowPayment.token,
      flowOrder: flowPayment.flowOrder,
    });
  } catch (error) {
    console.error('Error creating Flow payment:', error);

    // Log detailed error info
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }

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
      (/401/.test(rawMessage) ||
        /apiKey not found|Api Key/i.test(rawMessage) ||
        /Not Authorized/i.test(rawMessage));

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
