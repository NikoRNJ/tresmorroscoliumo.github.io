# 📧 ITERACIÓN 6: Sistema de Emails con SendGrid

**OBJETIVO:** Implementar el sistema completo de notificaciones por email para confirmaciones de reserva, recordatorios y comunicaciones con los clientes.

**DURACIÓN ESTIMADA:** 3-4 horas

**ESTADO:** 🔴 Pendiente

**DEPENDENCIAS:** Iteración 5 completada ✅

---

## **📋 PRE-REQUISITOS**

Antes de comenzar, verifica que:

- [ ] Iteración 5 está 100% completada
- [ ] Sistema de pagos Flow funciona correctamente
- [ ] Tienes cuenta de SendGrid creada
- [ ] Tienes API Key de SendGrid
- [ ] `SENDGRID_API_KEY` está en `.env.local`
- [ ] Email verificado en SendGrid

---

## **🎯 OBJETIVOS DE ESTA ITERACIÓN**

Al finalizar, deberás tener:

1. ✅ Cliente de SendGrid configurado
2. ✅ Templates de email en HTML responsive
3. ✅ Email de confirmación de reserva pagada
4. ✅ Email de recordatorio 3 días antes del check-in
5. ✅ Email de contacto/consultas
6. ✅ Email de cancelación (si aplica)
7. ✅ Sistema de logs de emails enviados
8. ✅ Manejo de errores de envío

---

## **PASO 1: Crear Tipos para Emails**

### **Archivo: `types/email.ts`**

```typescript
/**
 * Tipos para el sistema de emails
 */

export interface EmailRecipient {
  email: string;
  name: string;
}

export interface EmailAttachment {
  content: string; // Base64 encoded
  filename: string;
  type: string; // MIME type
  disposition: 'attachment' | 'inline';
}

export interface BaseEmailData {
  to: EmailRecipient;
  from?: EmailRecipient;
  subject: string;
  replyTo?: EmailRecipient;
}

/**
 * Datos para email de confirmación de reserva
 */
export interface BookingConfirmationEmailData extends BaseEmailData {
  bookingId: string;
  cabinName: string;
  cabinSlug: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guests: number;
  jacuzziDays: number;
  totalAmount: number;
  customerName: string;
  bookingReference: string; // Primeros 8 caracteres del UUID
}

/**
 * Datos para email de recordatorio
 */
export interface BookingReminderEmailData extends BaseEmailData {
  customerName: string;
  cabinName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guests: number;
  bookingReference: string;
  importantInfo: string[];
}

/**
 * Datos para email de contacto
 */
export interface ContactEmailData extends BaseEmailData {
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  message: string;
  cabinOfInterest?: string;
}

/**
 * Resultado del envío de email
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
```

---

## **PASO 2: Crear Cliente de SendGrid**

### **Archivo: `lib/email/client.ts`**

```typescript
import sgMail from '@sendgrid/mail';
import type { MailDataRequired } from '@sendgrid/mail';
import type { EmailSendResult } from '@/types/email';

/**
 * Cliente de SendGrid para envío de emails
 */
class EmailClient {
  private isConfigured: boolean;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    const fromName = process.env.SENDGRID_FROM_NAME;

    if (!apiKey) {
      console.warn('SENDGRID_API_KEY not configured. Emails will not be sent.');
      this.isConfigured = false;
      this.fromEmail = 'noreply@example.com';
      this.fromName = 'Tres Morros de Coliumo';
      return;
    }

    if (!fromEmail || !fromName) {
      throw new Error('SENDGRID_FROM_EMAIL and SENDGRID_FROM_NAME must be configured');
    }

    sgMail.setApiKey(apiKey);
    this.isConfigured = true;
    this.fromEmail = fromEmail;
    this.fromName = fromName;
  }

  /**
   * Enviar un email
   * 
   * @param mailData - Datos del email según SendGrid
   * @returns Resultado del envío
   */
  async send(mailData: MailDataRequired): Promise<EmailSendResult> {
    if (!this.isConfigured) {
      console.warn('SendGrid not configured. Email would have been sent:', mailData);
      return {
        success: false,
        error: 'SendGrid not configured',
      };
    }

    try {
      const [response] = await sgMail.send(mailData);

      console.log(`✅ Email sent successfully to ${mailData.to}`);
      
      return {
        success: true,
        messageId: response.headers['x-message-id'],
      };
    } catch (error) {
      console.error('❌ Error sending email:', error);

      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'Unknown error sending email',
      };
    }
  }

  /**
   * Obtener configuración del remitente por defecto
   */
  getDefaultFrom() {
    return {
      email: this.fromEmail,
      name: this.fromName,
    };
  }
}

// Exportar instancia única
export const emailClient = new EmailClient();
```

---

## **PASO 3: Crear Templates de Email**

### **Archivo: `lib/email/templates/booking-confirmation.ts`**

```typescript
import type { BookingConfirmationEmailData } from '@/types/email';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Generar HTML del email de confirmación de reserva
 */
export function generateBookingConfirmationHTML(data: BookingConfirmationEmailData): string {
  const checkIn = parseISO(data.checkInDate);
  const checkOut = parseISO(data.checkOutDate);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tresmorroscoliumo.cl';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Reserva</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      padding: 40px 20px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .content {
      padding: 40px 20px;
    }
    .success-badge {
      background-color: #dcfce7;
      color: #166534;
      padding: 12px 20px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 30px;
      font-weight: 600;
    }
    .booking-details {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #6b7280;
      font-size: 14px;
    }
    .detail-value {
      color: #111827;
      font-weight: 600;
      text-align: right;
    }
    .total-row {
      background-color: #f0fdf4;
      padding: 16px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .total-row .detail-value {
      color: #16a34a;
      font-size: 24px;
    }
    .info-box {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 0;
      color: #1e40af;
      font-size: 14px;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      background-color: #16a34a;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px 20px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .footer a {
      color: #16a34a;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .detail-row {
        flex-direction: column;
        gap: 8px;
      }
      .detail-value {
        text-align: left;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🏖️ Tres Morros de Coliumo</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="success-badge">
        ✅ ¡Tu reserva ha sido confirmada!
      </div>

      <p style="font-size: 16px; color: #111827; line-height: 1.6;">
        Hola <strong>${data.customerName}</strong>,
      </p>

      <p style="font-size: 16px; color: #111827; line-height: 1.6;">
        ¡Gracias por elegir Tres Morros de Coliumo! Tu pago ha sido procesado exitosamente y tu reserva está confirmada.
      </p>

      <!-- Booking Reference -->
      <div style="background-color: #f9fafb; border: 2px dashed #d1d5db; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Número de reserva:</p>
        <p style="margin: 8px 0 0 0; color: #111827; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
          ${data.bookingReference}
        </p>
      </div>

      <!-- Booking Details -->
      <div class="booking-details">
        <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px;">Detalles de tu Reserva</h2>
        
        <div class="detail-row">
          <span class="detail-label">Cabaña:</span>
          <span class="detail-value">${data.cabinName}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Check-in:</span>
          <span class="detail-value">${format(checkIn, "EEEE d 'de' MMMM yyyy", { locale: es })}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Check-out:</span>
          <span class="detail-value">${format(checkOut, "EEEE d 'de' MMMM yyyy", { locale: es })}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Noches:</span>
          <span class="detail-value">${data.nights}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Huéspedes:</span>
          <span class="detail-value">${data.guests} persona${data.guests !== 1 ? 's' : ''}</span>
        </div>

        ${data.jacuzziDays > 0 ? `
        <div class="detail-row">
          <span class="detail-label">Jacuzzi:</span>
          <span class="detail-value">${data.jacuzziDays} día${data.jacuzziDays !== 1 ? 's' : ''}</span>
        </div>
        ` : ''}

        <div class="total-row">
          <div class="detail-row" style="border: none; padding: 0;">
            <span class="detail-label" style="font-size: 16px; font-weight: 600; color: #111827;">Total Pagado:</span>
            <span class="detail-value">$${data.totalAmount.toLocaleString('es-CL')}</span>
          </div>
        </div>
      </div>

      <!-- Important Information -->
      <div class="info-box">
        <p><strong>📋 Información importante:</strong></p>
        <p style="margin-top: 8px;">
          • Horario de check-in: A partir de las 15:00 hrs<br>
          • Horario de check-out: Hasta las 12:00 hrs<br>
          • Te enviaremos las instrucciones de llegada 24 horas antes de tu check-in
        </p>
      </div>

      <div style="text-align: center;">
        <a href="${siteUrl}/cabanas/${data.cabinSlug}" class="button">
          Ver detalles de la cabaña
        </a>
      </div>

      <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-top: 30px;">
        Si tienes alguna pregunta o necesitas hacer algún cambio, no dudes en contactarnos respondiendo a este email.
      </p>

      <p style="font-size: 16px; color: #111827; margin-top: 30px;">
        ¡Te esperamos en Coliumo! 🌊
      </p>

      <p style="font-size: 14px; color: #6b7280;">
        Equipo Tres Morros de Coliumo
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 10px 0;">
        <strong>Tres Morros de Coliumo</strong>
      </p>
      <p style="margin: 0 0 10px 0;">
        Coliumo, Región del Bío-Bío, Chile
      </p>
      <p style="margin: 0 0 10px 0;">
        <a href="mailto:contacto@tresmorroscoliumo.cl">contacto@tresmorroscoliumo.cl</a> | 
        <a href="tel:+56912345678">+56 9 1234 5678</a>
      </p>
      <p style="margin: 20px 0 0 0; font-size: 12px; color: #9ca3af;">
        © ${new Date().getFullYear()} Tres Morros de Coliumo. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generar versión plain text del email
 */
export function generateBookingConfirmationText(data: BookingConfirmationEmailData): string {
  const checkIn = parseISO(data.checkInDate);
  const checkOut = parseISO(data.checkOutDate);

  return `
¡Tu reserva ha sido confirmada!

Hola ${data.customerName},

¡Gracias por elegir Tres Morros de Coliumo! Tu pago ha sido procesado exitosamente.

NÚMERO DE RESERVA: ${data.bookingReference}

DETALLES DE TU RESERVA:
-----------------------
Cabaña: ${data.cabinName}
Check-in: ${format(checkIn, "EEEE d 'de' MMMM yyyy", { locale: es })}
Check-out: ${format(checkOut, "EEEE d 'de' MMMM yyyy", { locale: es })}
Noches: ${data.nights}
Huéspedes: ${data.guests} persona${data.guests !== 1 ? 's' : ''}
${data.jacuzziDays > 0 ? `Jacuzzi: ${data.jacuzziDays} día${data.jacuzziDays !== 1 ? 's' : ''}\n` : ''}
TOTAL PAGADO: $${data.totalAmount.toLocaleString('es-CL')}

INFORMACIÓN IMPORTANTE:
• Horario de check-in: A partir de las 15:00 hrs
• Horario de check-out: Hasta las 12:00 hrs
• Te enviaremos las instrucciones de llegada 24 horas antes de tu check-in

Si tienes alguna pregunta, no dudes en contactarnos.

¡Te esperamos en Coliumo! 🌊

Equipo Tres Morros de Coliumo
Coliumo, Región del Bío-Bío, Chile
contacto@tresmorroscoliumo.cl | +56 9 1234 5678
  `.trim();
}
```

---

## **PASO 4: Crear Template de Recordatorio**

### **Archivo: `lib/email/templates/booking-reminder.ts`**

```typescript
import type { BookingReminderEmailData } from '@/types/email';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Generar HTML del email de recordatorio
 */
export function generateBookingReminderHTML(data: BookingReminderEmailData): string {
  const checkIn = parseISO(data.checkInDate);
  const checkOut = parseISO(data.checkOutDate);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de Reserva</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      padding: 40px 20px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .content {
      padding: 40px 20px;
    }
    .reminder-badge {
      background-color: #fef3c7;
      color: #92400e;
      padding: 12px 20px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 30px;
      font-weight: 600;
      font-size: 18px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 30px 0;
    }
    .info-card {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .info-card-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    .info-card-label {
      color: #6b7280;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .info-card-value {
      color: #111827;
      font-weight: 600;
      font-size: 16px;
    }
    .checklist {
      background-color: #f0fdf4;
      border-left: 4px solid #16a34a;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .checklist h3 {
      margin: 0 0 16px 0;
      color: #166534;
      font-size: 18px;
    }
    .checklist ul {
      margin: 0;
      padding-left: 20px;
    }
    .checklist li {
      color: #166534;
      margin: 8px 0;
      line-height: 1.6;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px 20px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    @media only screen and (max-width: 600px) {
      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏖️ Tres Morros de Coliumo</h1>
    </div>

    <div class="content">
      <div class="reminder-badge">
        ⏰ ¡Tu estadía comienza pronto!
      </div>

      <p style="font-size: 16px; color: #111827; line-height: 1.6;">
        Hola <strong>${data.customerName}</strong>,
      </p>

      <p style="font-size: 16px; color: #111827; line-height: 1.6;">
        ¡Estamos emocionados de recibirte! Tu reserva en <strong>${data.cabinName}</strong> comienza en 3 días.
      </p>

      <div class="info-grid">
        <div class="info-card">
          <div class="info-card-icon">📅</div>
          <div class="info-card-label">CHECK-IN</div>
          <div class="info-card-value">${format(checkIn, "d 'de' MMMM", { locale: es })}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Desde las 15:00 hrs</div>
        </div>

        <div class="info-card">
          <div class="info-card-icon">📅</div>
          <div class="info-card-label">CHECK-OUT</div>
          <div class="info-card-value">${format(checkOut, "d 'de' MMMM", { locale: es })}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Hasta las 12:00 hrs</div>
        </div>

        <div class="info-card">
          <div class="info-card-icon">🌙</div>
          <div class="info-card-label">NOCHES</div>
          <div class="info-card-value">${data.nights}</div>
        </div>

        <div class="info-card">
          <div class="info-card-icon">👥</div>
          <div class="info-card-label">HUÉSPEDES</div>
          <div class="info-card-value">${data.guests}</div>
        </div>
      </div>

      <div class="checklist">
        <h3>✅ Preparativos para tu llegada:</h3>
        <ul>
          ${data.importantInfo.map(info => `<li>${info}</li>`).join('\n          ')}
        </ul>
      </div>

      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
          <strong>📍 Cómo llegar:</strong><br>
          La cabaña está ubicada en Coliumo, Región del Bío-Bío. Te enviaremos las coordenadas exactas y detalles de acceso por WhatsApp el día de tu llegada.
        </p>
      </div>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
          <strong>💬 ¿Tienes preguntas?</strong><br>
          Estamos disponibles para ayudarte. Responde a este email o llámanos al +56 9 1234 5678.
        </p>
      </div>

      <p style="font-size: 16px; color: #111827; margin-top: 30px;">
        ¡Nos vemos pronto en Coliumo! 🌊
      </p>

      <p style="font-size: 14px; color: #6b7280;">
        Equipo Tres Morros de Coliumo
      </p>

      <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
        Número de reserva: <strong>${data.bookingReference}</strong>
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 10px 0;">
        <strong>Tres Morros de Coliumo</strong>
      </p>
      <p style="margin: 0 0 10px 0;">
        Coliumo, Región del Bío-Bío, Chile
      </p>
      <p style="margin: 0;">
        <a href="mailto:contacto@tresmorroscoliumo.cl" style="color: #16a34a; text-decoration: none;">contacto@tresmorroscoliumo.cl</a> | 
        <a href="tel:+56912345678" style="color: #16a34a; text-decoration: none;">+56 9 1234 5678</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generar versión plain text
 */
export function generateBookingReminderText(data: BookingReminderEmailData): string {
  const checkIn = parseISO(data.checkInDate);
  const checkOut = parseISO(data.checkOutDate);

  return `
¡Tu estadía comienza pronto!

Hola ${data.customerName},

¡Estamos emocionados de recibirte! Tu reserva en ${data.cabinName} comienza en 3 días.

DETALLES:
---------
Check-in: ${format(checkIn, "EEEE d 'de' MMMM yyyy", { locale: es })} - Desde las 15:00 hrs
Check-out: ${format(checkOut, "EEEE d 'de' MMMM yyyy", { locale: es })} - Hasta las 12:00 hrs
Noches: ${data.nights}
Huéspedes: ${data.guests}

PREPARATIVOS PARA TU LLEGADA:
${data.importantInfo.map((info, i) => `${i + 1}. ${info}`).join('\n')}

CÓMO LLEGAR:
La cabaña está ubicada en Coliumo, Región del Bío-Bío. Te enviaremos las coordenadas exactas y detalles de acceso por WhatsApp el día de tu llegada.

¿TIENES PREGUNTAS?
Estamos disponibles para ayudarte. Responde a este email o llámanos al +56 9 1234 5678.

¡Nos vemos pronto en Coliumo! 🌊

Equipo Tres Morros de Coliumo
Número de reserva: ${data.bookingReference}
  `.trim();
}
```

---

## **PASO 5: Crear Servicio de Emails**

### **Archivo: `lib/email/service.ts`**

```typescript
import { emailClient } from './client';
import { generateBookingConfirmationHTML, generateBookingConfirmationText } from './templates/booking-confirmation';
import { generateBookingReminderHTML, generateBookingReminderText } from './templates/booking-reminder';
import type { BookingConfirmationEmailData, BookingReminderEmailData, EmailSendResult } from '@/types/email';

/**
 * Servicio de emails - funciones de alto nivel
 */
export const emailService = {
  /**
   * Enviar email de confirmación de reserva
   */
  async sendBookingConfirmation(data: BookingConfirmationEmailData): Promise<EmailSendResult> {
    const defaultFrom = emailClient.getDefaultFrom();

    const mailData = {
      to: {
        email: data.to.email,
        name: data.to.name,
      },
      from: data.from || defaultFrom,
      subject: data.subject || `✅ Reserva Confirmada - ${data.cabinName}`,
      text: generateBookingConfirmationText(data),
      html: generateBookingConfirmationHTML(data),
      replyTo: data.replyTo,
    };

    return emailClient.send(mailData);
  },

  /**
   * Enviar email de recordatorio de reserva
   */
  async sendBookingReminder(data: BookingReminderEmailData): Promise<EmailSendResult> {
    const defaultFrom = emailClient.getDefaultFrom();

    const mailData = {
      to: {
        email: data.to.email,
        name: data.to.name,
      },
      from: data.from || defaultFrom,
      subject: data.subject || `⏰ Tu estadía en ${data.cabinName} comienza pronto`,
      text: generateBookingReminderText(data),
      html: generateBookingReminderHTML(data),
      replyTo: data.replyTo,
    };

    return emailClient.send(mailData);
  },

  /**
   * Enviar email de contacto al admin
   */
  async sendContactEmail(params: {
    senderName: string;
    senderEmail: string;
    senderPhone?: string;
    message: string;
    cabinOfInterest?: string;
  }): Promise<EmailSendResult> {
    const defaultFrom = emailClient.getDefaultFrom();
    const adminEmail = process.env.ADMIN_EMAIL || 'contacto@tresmorroscoliumo.cl';

    const mailData = {
      to: adminEmail,
      from: defaultFrom,
      replyTo: {
        email: params.senderEmail,
        name: params.senderName,
      },
      subject: `📬 Nuevo mensaje de contacto - ${params.senderName}`,
      text: `
Nuevo mensaje de contacto:

Nombre: ${params.senderName}
Email: ${params.senderEmail}
Teléfono: ${params.senderPhone || 'No proporcionado'}
${params.cabinOfInterest ? `Cabaña de interés: ${params.cabinOfInterest}` : ''}

Mensaje:
${params.message}

---
Este email fue enviado desde el formulario de contacto de Tres Morros de Coliumo.
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 20px; margin: 20px 0; }
    .field { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .message { background-color: white; padding: 15px; border-left: 4px solid #16a34a; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📬 Nuevo Mensaje de Contacto</h2>
    </div>
    <div class="content">
      <div class="field">
        <span class="label">Nombre:</span> ${params.senderName}
      </div>
      <div class="field">
        <span class="label">Email:</span> <a href="mailto:${params.senderEmail}">${params.senderEmail}</a>
      </div>
      ${params.senderPhone ? `
      <div class="field">
        <span class="label">Teléfono:</span> ${params.senderPhone}
      </div>
      ` : ''}
      ${params.cabinOfInterest ? `
      <div class="field">
        <span class="label">Cabaña de interés:</span> ${params.cabinOfInterest}
      </div>
      ` : ''}
      <div class="message">
        <div class="label">Mensaje:</div>
        <p>${params.message.replace(/\n/g, '<br>')}</p>
      </div>
    </div>
    <p style="text-align: center; color: #666; font-size: 12px;">
      Este email fue enviado desde el formulario de contacto de Tres Morros de Coliumo
    </p>
  </div>
</body>
</html>
      `,
    };

    return emailClient.send(mailData);
  },
};
```

---

## **PASO 6: Integrar Email de Confirmación en Webhook de Flow**

### **Archivo: `app/api/payments/flow/webhook/route.ts` (actualizar)**

Agregar el envío de email después de confirmar el pago:

```typescript
// ... imports existentes ...
import { emailService } from '@/lib/email/service';
import { differenceInDays } from 'date-fns';

// Dentro de la sección donde el pago es exitoso (status === PAID):

if (paymentStatus.status === FlowPaymentStatusCode.PAID) {
  // ... código existente de actualización de DB ...

  // NUEVO: Enviar email de confirmación
  try {
    const nights = differenceInDays(
      new Date(booking.end_date),
      new Date(booking.start_date)
    );

    const jacuzziDays = Array.isArray(booking.jacuzzi_days) 
      ? booking.jacuzzi_days.length 
      : 0;

    await emailService.sendBookingConfirmation({
      to: {
        email: booking.customer_email,
        name: booking.customer_name,
      },
      subject: `✅ Reserva Confirmada - ${booking.cabin.title}`,
      bookingId: booking.id,
      cabinName: booking.cabin.title,
      cabinSlug: booking.cabin.slug,
      checkInDate: booking.start_date,
      checkOutDate: booking.end_date,
      nights,
      guests: booking.party_size,
      jacuzziDays,
      totalAmount: booking.amount_total,
      customerName: booking.customer_name,
      bookingReference: booking.id.substring(0, 8).toUpperCase(),
    });

    console.log('✅ Confirmation email sent to', booking.customer_email);

    // Log del email enviado
    await supabaseAdmin.from('api_events').insert({
      event_type: 'email_sent_confirmation',
      event_source: 'sendgrid',
      booking_id: bookingId,
      payload: {
        to: booking.customer_email,
        subject: `✅ Reserva Confirmada - ${booking.cabin.title}`,
      },
      status: 'success',
    });
  } catch (emailError) {
    console.error('❌ Error sending confirmation email:', emailError);
    
    // Log del error (pero no fallar la transacción)
    await supabaseAdmin.from('api_events').insert({
      event_type: 'email_error_confirmation',
      event_source: 'sendgrid',
      booking_id: bookingId,
      payload: {
        error: emailError instanceof Error ? emailError.message : 'Unknown error',
      },
      status: 'error',
      error_message: emailError instanceof Error ? emailError.message : 'Unknown error',
    });
  }

  return NextResponse.json({ success: true, status: 'paid' });
}
```

---

## **PASO 7: Crear API de Contacto**

### **Archivo: `app/api/contact/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { emailService } from '@/lib/email/service';
import { supabaseAdmin } from '@/lib/supabase/server';

// Schema de validación
const contactSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(100),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  cabin: z.string().optional(),
  message: z.string().min(10, 'Mensaje muy corto').max(1000, 'Mensaje muy largo'),
});

/**
 * POST /api/contact
 * 
 * Enviar mensaje de contacto
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    // Enviar email
    const result = await emailService.sendContactEmail({
      senderName: data.name,
      senderEmail: data.email,
      senderPhone: data.phone,
      message: data.message,
      cabinOfInterest: data.cabin,
    });

    if (!result.success) {
      throw new Error(result.error || 'Error al enviar email');
    }

    // Log del evento
    await supabaseAdmin.from('api_events').insert({
      event_type: 'contact_form_submitted',
      event_source: 'system',
      payload: {
        name: data.name,
        email: data.email,
        cabin: data.cabin,
      },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Tu mensaje ha sido enviado correctamente',
    });
  } catch (error) {
    console.error('Error in contact endpoint:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al enviar el mensaje',
      },
      { status: 500 }
    );
  }
}
```

---

## **PASO 8: Crear Job de Recordatorios**

### **Archivo: `app/api/jobs/send-reminders/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { emailService } from '@/lib/email/service';
import { addDays, format, differenceInDays } from 'date-fns';

/**
 * POST /api/jobs/send-reminders
 * 
 * Job ejecutado diariamente para enviar recordatorios de check-in
 * Envía email 3 días antes del check-in
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar secret del cron
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fecha de dentro de 3 días
    const targetDate = addDays(new Date(), 3);
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');

    // Buscar reservas pagadas que empiezan en 3 días
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*, cabin:cabins(*)')
      .eq('status', 'paid')
      .eq('start_date', targetDateStr);

    if (error) {
      console.error('Error fetching bookings for reminders:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        message: 'No bookings found for reminders',
        sent: 0,
      });
    }

    const results = [];

    // Enviar email a cada reserva
    for (const booking of bookings) {
      try {
        const nights = differenceInDays(
          new Date(booking.end_date),
          new Date(booking.start_date)
        );

        await emailService.sendBookingReminder({
          to: {
            email: booking.customer_email,
            name: booking.customer_name,
          },
          subject: `⏰ Tu estadía en ${booking.cabin.title} comienza pronto`,
          customerName: booking.customer_name,
          cabinName: booking.cabin.title,
          checkInDate: booking.start_date,
          checkOutDate: booking.end_date,
          nights,
          guests: booking.party_size,
          bookingReference: booking.id.substring(0, 8).toUpperCase(),
          importantInfo: [
            'Horario de check-in: 15:00 hrs',
            'Horario de check-out: 12:00 hrs',
            'Trae tu documento de identidad',
            'Recuerda respetar el aforo máximo de la cabaña',
            'No se permiten mascotas (salvo acuerdo previo)',
          ],
        });

        // Log del evento
        await supabaseAdmin.from('api_events').insert({
          event_type: 'email_sent_reminder',
          event_source: 'sendgrid',
          booking_id: booking.id,
          payload: {
            to: booking.customer_email,
            check_in_date: booking.start_date,
          },
          status: 'success',
        });

        results.push({
          bookingId: booking.id,
          email: booking.customer_email,
          success: true,
        });

        console.log(`✅ Reminder sent for booking ${booking.id}`);
      } catch (emailError) {
        console.error(`❌ Error sending reminder for booking ${booking.id}:`, emailError);

        await supabaseAdmin.from('api_events').insert({
          event_type: 'email_error_reminder',
          event_source: 'sendgrid',
          booking_id: booking.id,
          payload: {
            error: emailError instanceof Error ? emailError.message : 'Unknown error',
          },
          status: 'error',
          error_message: emailError instanceof Error ? emailError.message : 'Unknown error',
        });

        results.push({
          bookingId: booking.id,
          email: booking.customer_email,
          success: false,
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${bookings.length} bookings`,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error('Error in send-reminders job:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## **✅ VALIDACIÓN DE LA ITERACIÓN 6**

### **Checklist de Validación:**

```bash
# 1. Compilar sin errores
npm run build

# 2. Verificar variables de entorno
# Asegurarse de que existen:
# SENDGRID_API_KEY
# SENDGRID_FROM_EMAIL
# SENDGRID_FROM_NAME

# 3. Probar envío de email de confirmación
# Hacer una reserva completa y verificar que llega el email

# 4. Verificar el email en la bandeja de entrada
# - El formato HTML debe verse bien
# - Todos los datos deben ser correctos
# - Los links deben funcionar

# 5. Probar job de recordatorios (manualmente)
curl -X POST http://localhost:3000/api/jobs/send-reminders \
  -H "x-cron-secret: tu-secret-del-env"

# 6. Verificar logs en Supabase
# Tabla api_events debe tener eventos:
# - email_sent_confirmation
# - email_sent_reminder
# - email_error_* (si hay errores)

# 7. Verificar tipos
npx tsc --noEmit
```

---

## **📝 CHECKLIST FINAL ITERACIÓN 6**

- [ ] Cliente de SendGrid configurado
- [ ] Templates HTML de emails creados
- [ ] Email de confirmación se envía después del pago
- [ ] Email de confirmación llega correctamente
- [ ] Template es responsive en móvil
- [ ] Email de recordatorio funciona
- [ ] Job de recordatorios ejecuta correctamente
- [ ] API de contacto funciona
- [ ] Emails de contacto llegan al admin
- [ ] Logs de emails se guardan en api_events
- [ ] Manejo de errores de email funciona
- [ ] No hay errores de TypeScript
- [ ] No hay errores en consola

---

## **🎯 PRÓXIMOS PASOS**

Si TODOS los checks están ✅:

```bash
git add .
git commit -m "feat: iteration 6 - sistema de emails con SendGrid"
git push origin main
```

**SIGUIENTE:** 07-ITERATION-7.md (Panel de Administración)

---

**ESTADO:** 🔴 Pendiente → 🟢 Completada  
**PRÓXIMO ARCHIVO:** AI-INSTRUCTIONS/07-ITERATION-7.md

---

**FIN DE LA ITERACIÓN 6**