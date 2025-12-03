import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { emailClient } from '@/lib/email/client'
import { supabaseAdmin } from '@/lib/supabase/server'

const contactSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  phone: z.string().min(6, 'El teléfono debe tener al menos 6 caracteres').max(30),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').max(2000),
})

export async function POST(request: NextRequest) {
  console.log('[Contact API] Received request')
  
  try {
    const body = await request.json()
    console.log('[Contact API] Body received:', { name: body.name, email: body.email, phone: body.phone, messageLength: body.message?.length })
    
    const data = contactSchema.parse(body)
    console.log('[Contact API] Validation passed')

    const from = emailClient.getDefaultFrom()
    console.log('[Contact API] From email:', from.email)
    console.log('[Contact API] EmailJS ready:', emailClient.isReady())
    
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
    
    console.log('[Contact API] Mail result:', mailResult)

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
      console.log('[Contact API] Mail failed:', mailResult.error)
      return NextResponse.json({ success: false, error: mailResult.error || 'EMAIL_SEND_FAILED' }, { status: 502 })
    }

    console.log('[Contact API] Success!')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Contact API] Error:', error)
    if (error instanceof z.ZodError) {
      console.log('[Contact API] Validation error:', error.issues)
      return NextResponse.json({ success: false, error: 'Datos inválidos', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}