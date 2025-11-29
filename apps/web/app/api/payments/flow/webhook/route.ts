import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { supabaseAdmin } from '@/lib/supabase/server';
import { flowClient } from '@/lib/flow/client';
import { FlowPaymentStatusCode } from '@/types/flow';
import type { Database } from '@/types/database';

export async function POST(request: NextRequest) {
    let params: Record<string, any> = {};

    try {
        // Flow envía los datos como form-urlencoded
        const formData = await request.formData();
        params = Object.fromEntries(formData.entries());

        const token = params.token as string;

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // 1. Validar firma si está configurado
        if (flowClient.isConfigured()) {
            // Flow envía la firma en el parámetro 's'
            const signature = params.s as string;
            if (!signature) {
                console.error('[Flow Webhook] Missing signature');
                return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
            }

            const isValid = flowClient.validateWebhookSignature(params, signature);
            if (!isValid) {
                console.error('[Flow Webhook] Invalid signature');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
            }
        }

        // 2. Obtener estado del pago desde Flow (más seguro que confiar solo en los params)
        const status = await flowClient.getPaymentStatus(token);
        const bookingId = status.commerceOrder;

        console.log(`[Flow Webhook] Processing payment for booking ${bookingId}, status: ${status.status}`);

        // 3. Buscar la reserva
        const { data: bookings, error: fetchError } = await supabaseAdmin
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .limit(1)
            .returns<Database['public']['Tables']['bookings']['Row'][]>();

        const booking = bookings?.[0];

        if (fetchError || !booking) {
            console.error(`[Flow Webhook] Booking not found: ${bookingId}`);
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // 4. Actualizar reserva según estado
        if (status.status === FlowPaymentStatusCode.PAID) {
            // Solo actualizar si no estaba pagada ya
            if (booking.status !== 'paid') {
                const { error: updateError } = await supabaseAdmin
                    .from('bookings')
                    .update({
                        status: 'paid',
                        paid_at: new Date().toISOString(),
                        flow_payment_data: status as any,
                    } as any)
                    .eq('id', bookingId);

                if (updateError) {
                    console.error('[Flow Webhook] Error updating booking:', updateError);
                    throw updateError;
                }

                // Registrar evento
                await supabaseAdmin.from('api_events').insert({
                    event_type: 'payment_confirm_webhook',
                    event_source: 'flow',
                    booking_id: bookingId,
                    payload: status,
                    status: 'success',
                });
            }
        } else if (status.status === FlowPaymentStatusCode.REJECTED) {
            await supabaseAdmin
                .from('bookings')
                .update({ flow_payment_data: status })
                .eq('id', bookingId);

            await supabaseAdmin.from('api_events').insert({
                event_type: 'payment_rejected_webhook',
                event_source: 'flow',
                booking_id: bookingId,
                payload: status,
                status: 'error',
                error_message: 'Payment rejected',
            });
        } else if (status.status === FlowPaymentStatusCode.CANCELLED) {
            // Si se cancela, limpiamos la orden para permitir reintentar
            await supabaseAdmin
                .from('bookings')
                .update({
                    flow_payment_data: status,
                    flow_order_id: null
                })
                .eq('id', bookingId);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[Flow Webhook] Error processing webhook:', error);

        Sentry.captureException(error, {
            tags: { scope: 'flow_webhook' },
            extra: { params },
        });

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
