/**
 * API Route para envÃ­o de emails de contacto
 * Incluye validaciÃ³n, rate limiting y manejo de errores
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { contactFormSchema } from '@/lib/utils/validation';
import { emailConfig, rateLimitConfig } from '@/lib/config/site';
import type { ApiResponse } from '@/types';

// Simple in-memory rate limiting (en producciÃ³n usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + rateLimitConfig.windowMs,
    });
    return true;
  }

  if (record.count >= rateLimitConfig.maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (real) {
    return real;
  }
  
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Demasiadas solicitudes. Por favor, intenta mÃ¡s tarde.',
          error: { code: 'RATE_LIMIT_EXCEEDED' },
        },
        { status: 429 }
      );
    }

    // Parse y validar datos del formulario
    const body = await request.json();
    const validatedData = contactFormSchema.parse(body);

    // Configurar transporter de nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verificar configuraciÃ³n
    await transporter.verify();

    // Preparar contenido del email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #fff; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nuevo Mensaje de Contacto - Cabañas Francisco</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Nombre:</div>
                <div class="value">${validatedData.name}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value">${validatedData.email}</div>
              </div>
              <div class="field">
                <div class="label">TelÃ©fono:</div>
                <div class="value">${validatedData.phone}</div>
              </div>
              ${validatedData.preferredModel ? `
              <div class="field">
                <div class="label">Modelo de InterÃ©s:</div>
                <div class="value">${validatedData.preferredModel}</div>
              </div>
              ` : ''}
              <div class="field">
                <div class="label">Mensaje:</div>
                <div class="value">${validatedData.message.replace(/\n/g, '<br>')}</div>
              </div>
            </div>
            <div class="footer">
              <p>Este mensaje fue enviado desde el formulario de reservas de Cabañas Francisco</p>
              <p>IP del cliente: ${clientIp}</p>
              <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar email
    await transporter.sendMail({
      from: emailConfig.from,
      to: emailConfig.to,
      subject: `${emailConfig.subject} - ${validatedData.name}`,
      html: emailHtml,
      replyTo: validatedData.email,
    });

    // Respuesta exitosa
    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Mensaje enviado exitosamente. Te contactaremos pronto.',
      },
      { status: 200 }
    );

  } catch (error) {
    // Manejo de errores de validaciÃ³n
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Datos del formulario invÃ¡lidos',
          error: {
            code: 'VALIDATION_ERROR',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    // Log del error (en producciÃ³n usar un servicio de logging)
    console.error('Error sending email:', error);

    // Respuesta de error genÃ©rica
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Error al enviar el mensaje. Por favor, intenta nuevamente.',
        error: {
          code: 'INTERNAL_ERROR',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        },
      },
      { status: 500 }
    );
  }
}

// MÃ©todo OPTIONS para CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

