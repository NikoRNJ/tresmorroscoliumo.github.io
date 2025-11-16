import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { flowClient } from '@/lib/flow/client'
import { FlowPaymentStatusCode } from '@/types/flow'

export async function POST(request: NextRequest) {
  try {
    const { token, bookingId } = await request.json()
    if (!token) return NextResponse.json({ error: 'token requerido' }, { status: 400 })

    const status = await flowClient.getPaymentStatus(token)
    const id = bookingId || status.commerceOrder
    if (!id) return NextResponse.json({ error: 'bookingId no encontrado' }, { status: 400 })

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
    return NextResponse.json({ success: false, status: FlowPaymentStatusCode.PENDING }, { status: 202 })
  }
}