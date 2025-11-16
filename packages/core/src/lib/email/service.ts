import { emailClient } from './client';
import { generateBookingConfirmationHTML, generateBookingConfirmationText } from './templates/booking-confirmation';
import { supabaseAdmin } from '../supabase/server';
import type { BookingConfirmationEmailData, EmailSendResult } from '../../types/email';

/**
 * Servicio de emails - funciones de alto nivel
 * 
 * VERSIÓN MÍNIMA para Iteración 6
 * Solo incluye envío de confirmación de reserva
 */

/**
 * Enviar email de confirmación de reserva
 * 
 * Se ejecuta automáticamente después de que Flow confirma el pago
 */
export async function sendBookingConfirmation(
  data: BookingConfirmationEmailData
): Promise<EmailSendResult> {
  const from = emailClient.getDefaultFrom();

  try {
    // Enviar email usando SendGrid
    const result = await emailClient.send({
      to: {
        email: data.to.email,
        name: data.to.name,
      },
      from: {
        email: from.email,
        name: from.name,
      },
      subject: data.subject,
      text: generateBookingConfirmationText(data),
      html: generateBookingConfirmationHTML(data),
    });

    // Si se envió exitosamente, loggear en api_events
    if (result.success) {
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'email_sent_confirmation',
        event_source: 'sendgrid',
        booking_id: data.bookingId,
        payload: {
          to: data.to.email,
          subject: data.subject,
          messageId: result.messageId,
        },
        status: 'success',
      });

      console.log(`✅ Confirmation email sent for booking ${data.bookingId}`);
    } else {
      // Si falló, loggear error
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'email_error_confirmation',
        event_source: 'sendgrid',
        booking_id: data.bookingId,
        payload: {
          to: data.to.email,
          error: result.error,
        },
        status: 'error',
        error_message: result.error,
      });

      console.error(`❌ Failed to send confirmation email for booking ${data.bookingId}:`, result.error);
    }

    return result;
  } catch (error) {
    console.error('Error in sendBookingConfirmation:', error);

    // Loggear error inesperado
    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: 'email_error_confirmation',
      event_source: 'sendgrid',
      booking_id: data.bookingId,
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
