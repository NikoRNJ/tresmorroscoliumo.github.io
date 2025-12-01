import { NextRequest, NextResponse } from 'next/server';
import { flowClient } from '@/lib/flow/client';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendBookingConfirmationForBooking } from '@/lib/email/service';
import type { FlowPaymentStatus } from '@/types/flow';
import { FlowPaymentStatusCode } from '@/types/flow';

function extractBookingId(optionalRaw: string | null | undefined): string | null {
  if (!optionalRaw) return null;

  if (/^[0-9a-fA-F-]{36}$/.test(optionalRaw)) return optionalRaw;

  try {
    const parsed = JSON.parse(optionalRaw);
    if (parsed && typeof parsed.bookingId === 'string') {
      return parsed.bookingId;
    }
  } catch {}

  return null;
}

async function logEvent(entry: Record<string, any>) {
  try {
    await (supabaseAdmin.from('api_events') as any).insert(entry);
  } catch (err) {
    console.error('Failed to log Flow return event:', err);
  }
}

async function parseReturnRequest(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  let token: string | null = null;
  let bookingId: string | null = null;
  let optional: string | null = null;

  try {
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({} as any));
      token = typeof body?.token === 'string' ? body.token : null;
      optional = typeof body?.optional === 'string' ? body.optional : null;
      bookingId = extractBookingId(optional);
    } else if (req.method === 'POST') {
      const form = await req.formData();
      token = form.get('token')?.toString() || form.get('TBK_TOKEN')?.toString() || null;
      optional = form.get('optional')?.toString() || null;
      bookingId = extractBookingId(optional);
    } else {
      const searchParams = req.nextUrl.searchParams;
      token = searchParams.get('token') || searchParams.get('TBK_TOKEN');
      optional = searchParams.get('optional');
      bookingId = extractBookingId(optional) || searchParams.get('booking');
    }
  } catch (err) {
    console.error('Error parsing Flow return body:', err);
  }

  return { token, bookingId, optional };
}

function buildRedirect(siteUrl: string, path: string, params: URLSearchParams) {
  const search = params.toString();
  const redirectPath = search ? `${path}?${search}` : path;
  return NextResponse.redirect(new URL(redirectPath, siteUrl), { status: 303 });
}

async function updateBookingFromStatus(bookingId: string, status: FlowPaymentStatus | null): Promise<boolean> {
  if (!status) return false;

  const bookings = supabaseAdmin.from('bookings') as any;
  let wasPaid = false;

  if (status.status === FlowPaymentStatusCode.PAID) {
    // Verificar si ya estaba pagado para no enviar email duplicado
    const { data: existingBookings } = await (supabaseAdmin
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .limit(1) as any);
    
    const existingBooking = existingBookings?.[0] as { status: string } | undefined;
    const alreadyPaid = existingBooking?.status === 'paid';

    await bookings
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        flow_payment_data: status,
      })
      .eq('id', bookingId);
    
    // Solo marcamos como recién pagado si no estaba pagado antes
    wasPaid = !alreadyPaid;
    
    console.log(`[Flow Return] 💰 Booking ${bookingId} actualizado a status='paid' (nuevo: ${wasPaid})`);
    return wasPaid;
  }

  if (status.status === FlowPaymentStatusCode.REJECTED) {
    await bookings
      .update({ flow_payment_data: status })
      .eq('id', bookingId);
    console.log(`[Flow Return] ❌ Booking ${bookingId} - pago rechazado`);
    return false;
  }

  if (status.status === FlowPaymentStatusCode.CANCELLED) {
    await bookings
      .update({ flow_payment_data: status, flow_order_id: null })
      .eq('id', bookingId);
    console.log(`[Flow Return] 🚫 Booking ${bookingId} - pago cancelado`);
    return false;
  }

  await bookings
    .update({ flow_payment_data: status })
    .eq('id', bookingId);
  return false;
}

export async function handleFlowReturn(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const { token, bookingId: hintedBookingId, optional } = await parseReturnRequest(req);

  console.log('[Flow Return] 📨 Request recibido:', {
    token: token ? `${token.substring(0, 15)}...` : 'MISSING',
    hintedBookingId,
    method: req.method
  });

  if (!token) {
    console.error('[Flow Return] ❌ Token faltante');
    await logEvent({
      event_type: 'flow_return_missing_token',
      event_source: 'flow',
      payload: { optional, method: req.method },
      status: 'error',
      error_message: 'Missing token on return',
    });

    return buildRedirect(siteUrl, '/pago/rechazo', new URLSearchParams({ error: 'token_missing' }));
  }

  let paymentStatus: FlowPaymentStatus | null = null;

  try {
    console.log('[Flow Return] 🔍 Consultando estado en Flow...');
    paymentStatus = await flowClient.getPaymentStatus(token);
    console.log('[Flow Return] 📊 Estado obtenido:', {
      status: paymentStatus.status,
      commerceOrder: paymentStatus.commerceOrder,
      amount: paymentStatus.amount
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Flow getStatus error';
    console.error('[Flow Return] ❌ Error consultando Flow:', message);
    await logEvent({
      event_type: 'flow_return_status_error',
      event_source: 'flow',
      payload: { token, hintedBookingId, optional, error: message },
      status: 'error',
      error_message: message,
    });

    const params = new URLSearchParams();
    params.set('token', token);
    if (hintedBookingId) params.set('booking', hintedBookingId);

    return buildRedirect(siteUrl, '/pago/confirmacion', params);
  }

  const bookingId = paymentStatus?.commerceOrder || hintedBookingId || null;
  let justPaid = false;

  if (bookingId) {
    try {
      justPaid = await updateBookingFromStatus(bookingId, paymentStatus);
      
      // Si el pago acaba de confirmarse, enviar email
      if (justPaid && paymentStatus?.status === FlowPaymentStatusCode.PAID) {
        try {
          console.log('[Flow Return] 📧 Enviando email de confirmación...');
          await sendBookingConfirmationForBooking(bookingId);
          console.log('[Flow Return] ✅ Email enviado');
        } catch (emailError) {
          console.error('[Flow Return] ⚠️ Error enviando email (no crítico):', emailError);
          // No bloqueamos la redirección por un error de email
        }
      }
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'DB update error';
      console.error('[Flow Return] ❌ Error actualizando booking:', dbError);
      await logEvent({
        event_type: 'flow_return_db_error',
        event_source: 'flow',
        booking_id: bookingId,
        payload: { token, status: paymentStatus },
        status: 'error',
        error_message: errorMessage,
      });
    }
  } else {
    console.error('[Flow Return] ⚠️ No se pudo determinar el bookingId');
    await logEvent({
      event_type: 'flow_return_missing_booking',
      event_source: 'flow',
      payload: { token, hintedBookingId, status: paymentStatus },
      status: 'error',
      error_message: 'Booking ID missing on return',
    });
  }

  const params = new URLSearchParams();
  params.set('token', token);
  if (bookingId) params.set('booking', bookingId);

  let redirectPath = '/pago/confirmacion';
  let eventType = 'flow_return_pending';
  let statusLabel: 'success' | 'error' = 'success';

  if (paymentStatus?.status === FlowPaymentStatusCode.PAID) {
    eventType = 'flow_return_paid';
    console.log('[Flow Return] ✅ Redirigiendo a confirmación exitosa');
  } else if (paymentStatus?.status === FlowPaymentStatusCode.REJECTED) {
    eventType = 'flow_return_rejected';
    params.set('reason', 'rejected');
    redirectPath = '/pago/rechazo';
    statusLabel = 'error';
    console.log('[Flow Return] ❌ Redirigiendo a página de rechazo');
  } else if (paymentStatus?.status === FlowPaymentStatusCode.CANCELLED) {
    eventType = 'flow_return_cancelled';
    params.set('reason', 'cancelled');
    redirectPath = '/pago/rechazo';
    console.log('[Flow Return] 🚫 Redirigiendo a página de cancelación');
  }

  await logEvent({
    event_type: eventType,
    event_source: 'flow',
    booking_id: bookingId,
    payload: { token, optional, status: paymentStatus },
    status: statusLabel,
  });

  return buildRedirect(siteUrl, redirectPath, params);
}
