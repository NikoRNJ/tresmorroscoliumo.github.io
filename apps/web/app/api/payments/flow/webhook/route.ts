import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { supabaseAdmin } from '@/lib/supabase/server';
import { flowClient } from '@/lib/flow/client';
import { sendBookingConfirmationForBooking } from '@/lib/email/service';
import { FlowPaymentStatusCode } from '@/types/flow';
import { isAfter, parseISO } from 'date-fns';
import type { Database } from '@/types/database';

type Booking = Database['public']['Tables']['bookings']['Row'];

/**
 * POST /api/payments/flow/webhook
 * 
 * Webhook principal de Flow para confirmación de pagos.
 * Flow llama a esta URL automáticamente cuando el estado del pago cambia.
 * 
 * ⚠️ IMPORTANTE: Esta es la URL que debe configurarse en el dashboard de Flow:
 * https://www.tresmorroscoliumo.cl/api/payments/flow/webhook
 * 
 * Flujo:
 * 1. Recibe token y firma desde Flow (form-urlencoded)
 * 2. Valida la firma HMAC
 * 3. Consulta el estado real del pago en Flow API
 * 4. Actualiza el booking en la base de datos
 * 5. Envía email de confirmación si el pago fue exitoso
 */
export async function POST(request: NextRequest) {
    let params: Record<string, any> = {};
    let bookingId: string | undefined;

    try {
        // Flow envía los datos como form-urlencoded
        const formData = await request.formData();
        params = Object.fromEntries(formData.entries());

        const token = params.token as string;
        const signature = params.s as string;

        console.log('[Flow Webhook] 📨 Webhook recibido:', { 
            token: token ? `${token.substring(0, 10)}...` : 'MISSING',
            hasSignature: !!signature 
        });

        if (!token) {
            console.error('[Flow Webhook] ❌ Token faltante');
            await logWebhookEvent('flow_webhook_missing_token', null, params, 'error', 'Missing token');
            return NextResponse.json({ success: false, code: 'MISSING_TOKEN', message: 'Token requerido' }, { status: 200 });
        }

        if (!signature) {
            console.error('[Flow Webhook] ❌ Firma faltante');
            await logWebhookEvent('flow_webhook_missing_signature', null, params, 'error', 'Missing signature');
            return NextResponse.json({ success: false, code: 'MISSING_SIGNATURE', message: 'Firma requerida' }, { status: 200 });
        }

        // 1. Validar firma si Flow está configurado (en producción)
        if (flowClient.isConfigured()) {
            const { s, ...paramsWithoutSignature } = params;
            const isValid = flowClient.validateWebhookSignature(paramsWithoutSignature, signature);
            
            if (!isValid) {
                console.error('[Flow Webhook] ❌ Firma inválida');
                await logWebhookEvent('flow_webhook_invalid_signature', null, params, 'error', 'Invalid signature');
                return NextResponse.json({ success: false, code: 'INVALID_SIGNATURE', message: 'Firma inválida' }, { status: 200 });
            }
            console.log('[Flow Webhook] ✅ Firma validada correctamente');
        }

        // 2. Obtener estado del pago desde Flow (más seguro que confiar solo en los params)
        let status;
        try {
            status = await flowClient.getPaymentStatus(token);
            console.log('[Flow Webhook] 📊 Estado obtenido de Flow:', { 
                flowOrder: status.flowOrder,
                commerceOrder: status.commerceOrder,
                status: status.status,
                amount: status.amount 
            });
        } catch (flowError) {
            const message = flowError instanceof Error ? flowError.message : 'Flow getStatus error';
            console.error('[Flow Webhook] ❌ Error consultando estado en Flow:', message);
            await logWebhookEvent('flow_webhook_status_error', null, { token, error: message }, 'error', message);
            return NextResponse.json({ success: false, code: 'GET_STATUS_ERROR', message: 'Error consultando estado' }, { status: 200 });
        }

        bookingId = status.commerceOrder;

        // 3. Buscar la reserva
        const { data: bookings, error: fetchError } = await supabaseAdmin
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .limit(1)
            .returns<Booking[]>();

        const booking = bookings?.[0];

        if (fetchError || !booking) {
            console.error(`[Flow Webhook] ❌ Reserva no encontrada: ${bookingId}`);
            await logWebhookEvent('flow_webhook_booking_not_found', bookingId, status, 'error', 'Booking not found');
            return NextResponse.json({ success: false, code: 'BOOKING_NOT_FOUND', message: 'Reserva no encontrada' }, { status: 200 });
        }

        const now = new Date();

        // 4. Idempotencia: si ya está pagado con el mismo token/order, no procesar de nuevo
        if (booking.status === 'paid') {
            const stored = booking.flow_payment_data as any;
            const storedToken = typeof stored?.token === 'string' ? stored.token : null;
            const storedOrder = typeof stored?.flowOrder === 'number' ? String(stored.flowOrder) : booking.flow_order_id;
            
            if ((storedToken && storedToken === token) || (storedOrder && storedOrder === String(status.flowOrder))) {
                console.log('[Flow Webhook] ⏭️ Pago ya procesado anteriormente (idempotencia)');
                return NextResponse.json({ success: true, status: 'paid', code: 'ALREADY_PAID', message: 'Pago ya confirmado' }, { status: 200 });
            }
            console.warn('[Flow Webhook] ⚠️ Reserva ya pagada con otro token/orden');
            return NextResponse.json({ success: false, code: 'ALREADY_PAID_MISMATCH', message: 'Reserva pagada con otro token' }, { status: 200 });
        }

        // 5. No aceptar pagos de bookings canceladas/expiradas
        if (booking.status === 'canceled' || booking.status === 'expired') {
            console.error(`[Flow Webhook] ❌ Reserva en estado inválido: ${booking.status}`);
            await logWebhookEvent('flow_webhook_invalid_booking_state', bookingId, { status, bookingStatus: booking.status }, 'error', 'Invalid booking state');
            return NextResponse.json({ success: false, code: 'INVALID_BOOKING_STATE', message: 'La reserva ya no está vigente' }, { status: 200 });
        }

        // 6. Verificar si el hold expiró
        if (booking.expires_at && !isAfter(parseISO(booking.expires_at), now)) {
            console.error(`[Flow Webhook] ❌ Hold expirado: ${booking.expires_at}`);
            await (supabaseAdmin.from('bookings') as any).update({ status: 'expired' }).eq('id', bookingId);
            await logWebhookEvent('flow_webhook_hold_expired', bookingId, { status, expiredAt: booking.expires_at }, 'error', 'Hold expired');
            return NextResponse.json({ success: false, code: 'HOLD_EXPIRED', message: 'El tiempo para pagar expiró' }, { status: 200 });
        }

        // 7. Procesar según estado del pago
        if (status.status === FlowPaymentStatusCode.PAID) {
            console.log(`[Flow Webhook] 💰 Pago EXITOSO para booking ${bookingId}`);
            
            const { error: updateError } = await (supabaseAdmin.from('bookings') as any)
                .update({
                    status: 'paid',
                    paid_at: new Date().toISOString(),
                    flow_payment_data: status,
                })
                .eq('id', bookingId);

            if (updateError) {
                console.error('[Flow Webhook] ❌ Error actualizando booking:', updateError);
                throw updateError;
            }

            console.log(`[Flow Webhook] ✅ Booking ${bookingId} actualizado a status='paid'`);

            await logWebhookEvent('payment_success', bookingId, status, 'success', null);

            // 8. Enviar email de confirmación (no bloquea la respuesta a Flow)
            try {
                console.log(`[Flow Webhook] 📧 Enviando email de confirmación...`);
                await sendBookingConfirmationForBooking(bookingId);
                console.log(`[Flow Webhook] ✅ Email enviado correctamente`);
            } catch (emailError) {
                console.error('[Flow Webhook] ⚠️ Error enviando email (no crítico):', emailError);
                Sentry.captureException(emailError, { 
                    tags: { scope: 'email_confirmation' }, 
                    extra: { bookingId } 
                });
                // No lanzamos error - el pago ya fue procesado
            }

            return NextResponse.json({ success: true, status: 'paid', code: 'PAID', message: 'Pago confirmado' }, { status: 200 });
        }

        if (status.status === FlowPaymentStatusCode.REJECTED) {
            console.log(`[Flow Webhook] ❌ Pago RECHAZADO para booking ${bookingId}`);
            
            await (supabaseAdmin.from('bookings') as any)
                .update({ flow_payment_data: status })
                .eq('id', bookingId);

            await logWebhookEvent('payment_rejected', bookingId, status, 'error', 'Payment rejected by bank');

            return NextResponse.json({ success: false, status: 'rejected', code: 'REJECTED', message: 'Pago rechazado' }, { status: 200 });
        }

        if (status.status === FlowPaymentStatusCode.CANCELLED) {
            console.log(`[Flow Webhook] 🚫 Pago CANCELADO para booking ${bookingId}`);
            
            // Limpiamos flow_order_id para permitir reintentar
            await (supabaseAdmin.from('bookings') as any)
                .update({
                    flow_payment_data: status,
                    flow_order_id: null
                })
                .eq('id', bookingId);

            await logWebhookEvent('payment_cancelled', bookingId, status, 'success', 'Payment cancelled - order cleared');

            return NextResponse.json({ success: false, status: 'cancelled', code: 'CANCELLED', message: 'Pago cancelado' }, { status: 200 });
        }

        // Estado pendiente o desconocido
        console.log(`[Flow Webhook] ⏳ Pago en estado: ${status.status} para booking ${bookingId}`);
        await logWebhookEvent('payment_pending', bookingId, status, 'success', null);

        return NextResponse.json({ success: false, status: 'pending', code: 'PENDING', message: 'Pago en proceso' }, { status: 200 });

    } catch (error) {
        console.error('[Flow Webhook] 💥 Error procesando webhook:', error);

        Sentry.captureException(error, {
            tags: { scope: 'flow_webhook' },
            extra: { params, bookingId },
        });

        await logWebhookEvent('flow_webhook_error', bookingId || null, { params, error: error instanceof Error ? error.message : 'Unknown' }, 'error', 'Internal error');

        return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Error interno' }, { status: 200 });
    }
}

/**
 * GET /api/payments/flow/webhook
 * Health check para verificar que el endpoint está disponible
 */
export async function GET() {
    return NextResponse.json({ 
        status: 'ok', 
        endpoint: '/api/payments/flow/webhook',
        configured: flowClient.isConfigured(),
        timestamp: new Date().toISOString()
    });
}

/**
 * Helper para registrar eventos de webhook en api_events
 */
async function logWebhookEvent(
    eventType: string, 
    bookingId: string | null, 
    payload: any, 
    status: 'success' | 'error', 
    errorMessage: string | null
) {
    try {
        await (supabaseAdmin.from('api_events') as any).insert({
            event_type: eventType,
            event_source: 'flow',
            booking_id: bookingId,
            payload,
            status,
            error_message: errorMessage,
        });
    } catch (err) {
        console.error('[Flow Webhook] Error logging event:', err);
    }
}
