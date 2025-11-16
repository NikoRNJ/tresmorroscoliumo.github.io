import type { BookingConfirmationEmailData } from '../../../types/email';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Generar HTML del email de confirmación de reserva
 */
export function generateBookingConfirmationHTML(data: BookingConfirmationEmailData): string {
  const checkIn = parseISO(data.checkInDate);
  const checkOut = parseISO(data.checkOutDate);
  const nights = differenceInDays(checkOut, checkIn);
  const siteUrl = process.env.PUBLIC_EXTERNAL_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://tresmorroscoliumo.cl';

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
          <span class="detail-value">${nights}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Huéspedes:</span>
          <span class="detail-value">${data.numberOfGuests} persona${data.numberOfGuests !== 1 ? 's' : ''}</span>
        </div>

        ${data.hasJacuzzi ? `
        <div class="detail-row">
          <span class="detail-label">Jacuzzi:</span>
          <span class="detail-value">${data.jacuzziDays.length} día${data.jacuzziDays.length !== 1 ? 's' : ''}</span>
        </div>
        ` : ''}

        ${data.towelsCount && data.towelsCount > 0 ? `
        <div class="detail-row">
          <span class="detail-label">Toallas:</span>
          <span class="detail-value">${data.towelsCount} ( $${(data.towelsPrice || (data.towelsCount * 2000)).toLocaleString('es-CL')} )</span>
        </div>
        ` : ''}

        <div class="total-row">
          <div class="detail-row" style="border: none; padding: 0;">
            <span class="detail-label" style="font-size: 16px; font-weight: 600; color: #111827;">Total Pagado:</span>
            <span class="detail-value">$${data.totalPrice.toLocaleString('es-CL')}</span>
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
  const nights = differenceInDays(checkOut, checkIn);

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
Noches: ${nights}
Huéspedes: ${data.numberOfGuests} persona${data.numberOfGuests !== 1 ? 's' : ''}
${data.hasJacuzzi ? `Jacuzzi: ${data.jacuzziDays.length} día${data.jacuzziDays.length !== 1 ? 's' : ''}\n` : ''}
${data.towelsCount && data.towelsCount > 0 ? `Toallas: ${data.towelsCount} ( $${(data.towelsPrice || (data.towelsCount * 2000)).toLocaleString('es-CL')} )\n` : ''}
TOTAL PAGADO: $${data.totalPrice.toLocaleString('es-CL')}

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
