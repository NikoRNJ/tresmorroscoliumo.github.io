import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { emailClient } from '@/lib/email/client'
import { supabaseAdmin } from '@/lib/supabase/server'

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(8).max(20),
  eventType: z.string().min(3).max(200),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const from = emailClient.getDefaultFrom()
    const mail = await emailClient.send({
      to: from.email,
      from: { email: from.email, name: from.name },
      subject: `Evento especial solicitado: ${data.eventType}`,
      text: `Nombre: ${data.name}\nEmail: ${data.email}\nTeléfono: ${data.phone}\nEvento: ${data.eventType}`,
      html: `<html><body style="background:#0a0a0a;color:#e5e7eb;padding:20px"><div style="max-width:640px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:8px;padding:20px"><h2 style="margin:0 0 12px;color:#34d399">Evento especial</h2><p><strong>Nombre:</strong> ${data.name}</p><p><strong>Email:</strong> ${data.email}</p><p><strong>Teléfono:</strong> ${data.phone}</p><p><strong>Tipo de evento:</strong> ${data.eventType}</p></div></body></html>`,
    })

    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: mail.success ? 'special_event_requested' : 'special_event_error',
      event_source: 'system',
      payload: data,
      status: mail.success ? 'success' : 'error',
      error_message: mail.success ? null : mail.error,
    })

    if (!mail.success) {
      return NextResponse.json({ success: false, error: 'No se pudo enviar el correo' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Datos inválidos', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}