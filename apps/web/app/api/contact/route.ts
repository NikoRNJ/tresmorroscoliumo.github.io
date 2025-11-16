import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { emailClient } from '@/lib/email/client'
import { supabaseAdmin } from '@/lib/supabase/server'

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(8).max(20).regex(/^[+]?[\d\s()-]+$/),
  message: z.string().min(10).max(1000),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = contactSchema.parse(body)

    const from = emailClient.getDefaultFrom()
    const mailResult = await emailClient.send({
      to: from.email,
      from: {
        email: from.email,
        name: from.name,
      },
      subject: `Nuevo contacto: ${data.name}`,
      text: `Nombre: ${data.name}\nEmail: ${data.email}\nTeléfono: ${data.phone}\n\nMensaje:\n${data.message}`,
      html: `<!doctype html><html><body style="font-family:Arial,sans-serif;background-color:#0a0a0a;color:#e5e7eb;padding:20px"><div style="max-width:640px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:8px;padding:20px"><h2 style="margin:0 0 12px;color:#f59e0b">Nuevo contacto</h2><p style="margin:0 0 8px"><strong>Nombre:</strong> ${data.name}</p><p style="margin:0 0 8px"><strong>Email:</strong> ${data.email}</p><p style="margin:0 0 16px"><strong>Teléfono:</strong> ${data.phone}</p><div style="border-top:1px solid #374151;padding-top:12px"><p style="margin:0 0 8px;color:#9ca3af">Mensaje</p><p style="white-space:pre-wrap;margin:0;color:#e5e7eb">${data.message}</p></div></div></body></html>`,
    })

    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: mailResult.success ? 'contact_form_submitted' : 'contact_form_error',
      event_source: 'system',
      payload: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
      status: mailResult.success ? 'success' : 'error',
      error_message: mailResult.success ? null : mailResult.error,
    })

    if (!mailResult.success) {
      return NextResponse.json({ success: false, error: 'No se pudo enviar el mensaje' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Datos inválidos', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}