import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { supabaseAdmin } from '@/lib/supabase/server'
import { flowClient } from '@/lib/flow/client'
import { FlowPaymentStatusCode } from '@/types/flow'
import { isAfter, parseISO } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const { token, bookingId } = await request.json()
    let effectiveToken = token

    if (!effectiveToken && bookingId) {
      const { data: bookings } = await supabaseAdmin
        .from('bookings')
        .select('flow_payment_data')
        .eq('id', bookingId)
        .limit(1)
        .returns<Array<{ flow_payment_data: any }>>()
      const paymentData = bookings?.[0]?.flow_payment_data as any
      const savedToken = typeof paymentData?.token === 'string' ? paymentData.token : null
      if (savedToken) effectiveToken = savedToken
    }

    if (!effectiveToken) return NextResponse.json({ success: false, code: 'TOKEN_REQUIRED', message: 'token requerido', bookingId: bookingId ?? null }, { status: 400 })

    const runtimeEnv = (process.env.NEXT_PUBLIC_SITE_ENV || process.env.NODE_ENV || '').toLowerCase()
    const isProdRuntime = runtimeEnv === 'production'
    const isMockFlow = !flowClient.isConfigured()
    const allowMockInProd = (process.env.FLOW_ALLOW_MOCK_IN_PROD || '').toLowerCase() === 'true'

    if (isProdRuntime && isMockFlow && !allowMockInProd) {
      const errorMessage = 'Confirmación manual no disponible: Flow está en modo mock en producción.'
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'flow_payment_error',
        event_source: 'flow',
        booking_id: bookingId ?? null,
        payload: { token, runtimeEnv },
        status: 'error',
        error_message: errorMessage,
      })
      Sentry.captureMessage(errorMessage, { level: 'error', extra: { token, bookingId } })
      return NextResponse.json({ success: false, code: 'FLOW_MOCK_IN_PROD', message: 'Servicio de pagos no disponible', bookingId: bookingId ?? null }, { status: 503 })
    }

    const status = await flowClient.getPaymentStatus(effectiveToken)
    const flowBookingId = status?.commerceOrder

    if (bookingId && flowBookingId && bookingId !== flowBookingId) {
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'flow_payment_error',
        event_source: 'flow',
        booking_id: bookingId,
        payload: { flowBookingId, token: effectiveToken },
        status: 'error',
        error_message: 'Token no corresponde al booking informado',
      })
      return NextResponse.json({ success: false, code: 'BOOKING_TOKEN_MISMATCH', message: 'El token no corresponde a la reserva', bookingId: flowBookingId }, { status: 409 })
    }

    const id = flowBookingId || bookingId
    if (!id) return NextResponse.json({ success: false, code: 'BOOKING_ID_MISSING', message: 'bookingId no encontrado', bookingId: null }, { status: 400 })

    const { data: bookings, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .limit(1)

    const booking = bookings?.[0] as { status: string; expires_at: string | null; flow_payment_data?: any } | undefined

    if (fetchError || !booking) {
      return NextResponse.json({ success: false, code: 'BOOKING_NOT_FOUND', message: 'Booking no encontrada', bookingId: id }, { status: 404 })
    }

    // Idempotencia: si ya está pagada y coincide token/order, responder success
    if (booking.status === 'paid') {
      const storedToken = typeof booking.flow_payment_data?.token === 'string' ? booking.flow_payment_data.token : null
      const storedOrder = typeof booking.flow_payment_data?.flowOrder === 'number' ? booking.flow_payment_data.flowOrder : null
      if ((storedToken && storedToken === effectiveToken) || (storedOrder && storedOrder === status?.flowOrder)) {
        return NextResponse.json({ success: true, status: 'paid', code: 'PAID', message: 'Pago confirmado', bookingId: id })
      }
      return NextResponse.json({ success: false, code: 'ALREADY_PAID_MISMATCH', message: 'La reserva ya está pagada con otro token/orden', bookingId: id }, { status: 409 })
    }

    // No permitir confirmar pagos de bookings canceladas/expiradas
    if (booking.status === 'canceled' || booking.status === 'expired') {
      return NextResponse.json({ success: false, code: 'INVALID_BOOKING_STATE', message: 'Booking no vigente', bookingId: id }, { status: 410 })
    }

    if (booking.expires_at && !isAfter(parseISO(booking.expires_at), new Date())) {
      await (supabaseAdmin.from('bookings') as any)
        .update({ status: 'expired' })
        .eq('id', id)

      return NextResponse.json(
        { success: false, code: 'HOLD_EXPIRED', message: 'Hold expirado, genera una nueva reserva', bookingId: id },
        { status: 410 }
      )
    }

    const code = status?.status
    if (code === FlowPaymentStatusCode.PAID) {
      const { error } = await (supabaseAdmin.from('bookings') as any)
        .update({ status: 'paid', paid_at: new Date().toISOString(), flow_payment_data: status })
        .eq('id', id)

      if (error) return NextResponse.json({ success: false, code: 'DB_ERROR', message: 'No se pudo guardar el pago', bookingId: id }, { status: 500 })

      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'payment_confirm_manual',
        event_source: 'flow',
        booking_id: id,
        payload: status,
        status: 'success',
      })

      return NextResponse.json({ success: true, status: 'paid', code: 'PAID', message: 'Pago confirmado', bookingId: id })
    }

    if (code === FlowPaymentStatusCode.REJECTED) {
      await (supabaseAdmin.from('bookings') as any)
        .update({ flow_payment_data: status })
        .eq('id', id)

      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'payment_rejected_manual',
        event_source: 'flow',
        booking_id: id,
        payload: status,
        status: 'error',
        error_message: 'Payment rejected by bank',
      })

      return NextResponse.json({ success: false, status: 'rejected', code: 'REJECTED', message: 'Pago rechazado por el emisor', bookingId: id }, { status: 200 })
    }

    if (code === FlowPaymentStatusCode.CANCELLED) {
      await (supabaseAdmin.from('bookings') as any)
        .update({ flow_payment_data: status, flow_order_id: null })
        .eq('id', id)

      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'payment_cancelled_manual',
        event_source: 'flow',
        booking_id: id,
        payload: status,
        status: 'success',
        error_message: 'Payment cancelled by user - order cleared',
      })

      return NextResponse.json({ success: false, status: 'cancelled', code: 'CANCELLED', message: 'Pago cancelado. Puedes intentar nuevamente.', bookingId: id }, { status: 200 })
    }

    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: 'payment_confirm_pending',
      event_source: 'flow',
      booking_id: id,
      payload: status,
      status: 'pending',
    })
    return NextResponse.json(
      { success: false, status: 'pending', code: 'PENDING', message: 'Pago en proceso, reintenta en unos segundos', bookingId: id },
      { status: 202 }
    )
  } catch (e) {
    Sentry.captureException(e, { tags: { scope: 'flow_payment_error', action: 'manual_confirm' } })
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Error al confirmar el pago', bookingId: null }, { status: 500 })
  }
}
