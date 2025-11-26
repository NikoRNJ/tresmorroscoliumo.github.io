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

    if (!effectiveToken) return NextResponse.json({ error: 'token requerido' }, { status: 400 })

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
      return NextResponse.json({ error: 'Servicio de pagos no disponible' }, { status: 503 })
    }

    const status = await flowClient.getPaymentStatus(effectiveToken)
    const id = bookingId || status.commerceOrder
    if (!id) return NextResponse.json({ error: 'bookingId no encontrado' }, { status: 400 })

    const { data: bookings, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .limit(1)

    const booking = bookings?.[0] as { status: string; expires_at: string | null; flow_payment_data?: any } | undefined

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking no encontrada' }, { status: 404 })
    }

    // Idempotencia: si ya está pagada y coincide token/order, responder success
    if (booking.status === 'paid') {
      const storedToken = typeof booking.flow_payment_data?.token === 'string' ? booking.flow_payment_data.token : null
      const storedOrder = typeof booking.flow_payment_data?.flowOrder === 'number' ? booking.flow_payment_data.flowOrder : null
      if ((storedToken && storedToken === effectiveToken) || (storedOrder && storedOrder === status?.flowOrder)) {
        return NextResponse.json({ success: true, status: 'paid' })
      }
      return NextResponse.json({ error: 'Booking ya pagada' }, { status: 409 })
    }

    // No permitir confirmar pagos de bookings canceladas/expiradas
    if (booking.status === 'canceled' || booking.status === 'expired') {
      return NextResponse.json({ error: 'Booking no vigente' }, { status: 410 })
    }

    if (booking.expires_at && !isAfter(parseISO(booking.expires_at), new Date())) {
      await (supabaseAdmin.from('bookings') as any)
        .update({ status: 'expired' })
        .eq('id', id)

      return NextResponse.json(
        { error: 'Hold expirado, genera una nueva reserva' },
        { status: 410 }
      )
    }

    const code = status?.status
    if (typeof code === 'number' && code !== FlowPaymentStatusCode.PAID) {
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'payment_confirm_pending',
        event_source: 'flow',
        booking_id: id,
        payload: status,
        status: 'pending',
      })
      return NextResponse.json({ success: false, status: code }, { status: 202 })
    }

    const { error } = await (supabaseAdmin.from('bookings') as any)
      .update({ status: 'paid', paid_at: new Date().toISOString(), flow_payment_data: status })
      .eq('id', id)

    if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })

    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: 'payment_confirm_manual',
      event_source: 'flow',
      booking_id: id,
      payload: status,
      status: 'success',
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    Sentry.captureException(e, { tags: { scope: 'flow_payment_error', action: 'manual_confirm' } })
    return NextResponse.json({ success: false, status: FlowPaymentStatusCode.PENDING }, { status: 202 })
  }
}
