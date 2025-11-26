import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { supabaseAdmin } from '@/lib/supabase/server';
import { flowClient } from '@/lib/flow/client';
import { FlowPaymentStatusCode } from '@/types/flow';
import { sendBookingConfirmationForBooking } from '@/lib/email/service';
import type { Database } from '@/types/database';

type Booking = Database['public']['Tables']['bookings']['Row'];

/**
 * POST /api/jobs/reconcile-payments
 * 
 * Job de reconciliación de pagos con Flow.
 * Ejecutar cada 15 minutos para detectar pagos exitosos que no fueron
 * procesados por el webhook (timeout, error de red, etc.)
 * 
 * Headers requeridos:
 * - x-cron-secret: Secret para autenticar el cron
 * 
 * Este job es CRÍTICO para la integridad financiera del sistema.
 * Si un cliente paga pero el webhook falla, este job detecta el pago
 * y actualiza el estado de la reserva.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let reconciledCount = 0;
  let errorCount = 0;

  try {
    // 1. Verificar secret del cron
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verificar que Flow está configurado
    if (!flowClient.isConfigured()) {
      console.log('[Reconcile] Flow no está configurado - saltando reconciliación');
      return NextResponse.json({
        message: 'Flow not configured - skipping reconciliation',
        reconciled: 0,
      });
    }

    // 3. Buscar reservas pendientes que tienen flow_order_id (ya iniciaron pago)
    // pero siguen en estado 'pending' después de cierto tiempo (> 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: pendingBookings, error: selectError } = await supabaseAdmin
      .from('bookings')
      .select('id, flow_order_id, flow_payment_data, customer_email, created_at')
      .eq('status', 'pending')
      .not('flow_order_id', 'is', null)
      .lt('created_at', fiveMinutesAgo)
      .limit(50) // Procesar máximo 50 por ejecución
      .returns<Array<{
        id: string;
        flow_order_id: string;
        flow_payment_data: any;
        customer_email: string;
        created_at: string;
      }>>();

    if (selectError) {
      console.error('[Reconcile] Error fetching pending bookings:', selectError);
      throw selectError;
    }

    if (!pendingBookings || pendingBookings.length === 0) {
      return NextResponse.json({
        message: 'No pending bookings with flow_order_id found',
        reconciled: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    console.log(`[Reconcile] Found ${pendingBookings.length} pending bookings to check`);

    // 4. Verificar cada reserva con Flow
    for (const booking of pendingBookings) {
      try {
        // Obtener token de flow_payment_data
        const paymentData = booking.flow_payment_data as { token?: string } | null;
        const token = paymentData?.token;

        if (!token) {
          console.log(`[Reconcile] Booking ${booking.id} has no token - skipping`);
          continue;
        }

        // Consultar estado en Flow
        const flowStatus = await flowClient.getPaymentStatus(token);

        console.log(`[Reconcile] Booking ${booking.id} - Flow status: ${flowStatus.status}`);

        // Si Flow dice que está pagado, actualizar nuestra BD
        if (flowStatus.status === FlowPaymentStatusCode.PAID) {
          console.log(`[Reconcile] 🔧 Reconciling payment for booking ${booking.id}`);

          // Actualizar estado con idempotencia
          const { data: updatedBookings, error: updateError } = await (supabaseAdmin.from('bookings') as any)
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              flow_payment_data: flowStatus,
            })
            .eq('id', booking.id)
            .eq('status', 'pending')
            .select('id')
            .limit(1);

          if (updateError) {
            console.error(`[Reconcile] Error updating booking ${booking.id}:`, updateError);
            errorCount++;
            continue;
          }

          if (updatedBookings && updatedBookings.length > 0) {
            reconciledCount++;

            // Log del evento de reconciliación
            await (supabaseAdmin.from('api_events') as any).insert({
              event_type: 'payment_reconciled',
              event_source: 'system',
              booking_id: booking.id,
              payload: {
                flow_order_id: booking.flow_order_id,
                flow_status: flowStatus,
                reason: 'webhook_missed',
              },
              status: 'success',
            });

            // Enviar email de confirmación si aún no se envió
            try {
              await sendBookingConfirmationForBooking(booking.id);
            } catch (emailError) {
              console.error(`[Reconcile] Error sending email for ${booking.id}:`, emailError);
            }

            // Alertar a Sentry sobre la reconciliación
            Sentry.captureMessage(`Payment reconciled for booking ${booking.id}`, {
              level: 'warning',
              tags: { scope: 'payment_reconciliation' },
              extra: {
                bookingId: booking.id,
                flowOrderId: booking.flow_order_id,
              },
            });
          }
        } else if (flowStatus.status === FlowPaymentStatusCode.REJECTED) {
          // Si Flow rechazó el pago, registrar pero no cancelar (usuario puede reintentar)
          await (supabaseAdmin.from('api_events') as any).insert({
            event_type: 'payment_reconcile_rejected',
            event_source: 'system',
            booking_id: booking.id,
            payload: flowStatus,
            status: 'info',
          });
        }
        // PENDING status: no hacer nada, el usuario aún puede completar el pago
      } catch (flowError) {
        console.error(`[Reconcile] Error checking Flow for booking ${booking.id}:`, flowError);
        errorCount++;
        
        // No propagar el error - continuar con las demás reservas
        await (supabaseAdmin.from('api_events') as any).insert({
          event_type: 'payment_reconcile_error',
          event_source: 'system',
          booking_id: booking.id,
          payload: {
            error: flowError instanceof Error ? flowError.message : 'Unknown error',
          },
          status: 'error',
          error_message: flowError instanceof Error ? flowError.message : 'Unknown error',
        });
      }
    }

    const duration = Date.now() - startTime;

    // Log resumen
    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: 'reconcile_job_completed',
      event_source: 'system',
      payload: {
        checked: pendingBookings.length,
        reconciled: reconciledCount,
        errors: errorCount,
        duration_ms: duration,
      },
      status: 'success',
    });

    return NextResponse.json({
      message: `Reconciliation completed`,
      checked: pendingBookings.length,
      reconciled: reconciledCount,
      errors: errorCount,
      duration_ms: duration,
    });
  } catch (error) {
    console.error('[Reconcile] Fatal error:', error);
    Sentry.captureException(error, { tags: { scope: 'payment_reconciliation' } });

    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: 'reconcile_job_failed',
      event_source: 'system',
      payload: { error: error instanceof Error ? error.message : 'Unknown error' },
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * GET /api/jobs/reconcile-payments
 * 
 * Endpoint de health check para verificar que el job está disponible
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Payment reconciliation job',
    description: 'Reconciles pending bookings with Flow payment status',
    recommended_interval: '15 minutes',
    timestamp: new Date().toISOString(),
  });
}
