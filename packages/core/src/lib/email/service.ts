import { emailClient } from './client';
import { generateBookingConfirmationHTML, generateBookingConfirmationText } from './templates/booking-confirmation';
import { supabaseAdmin } from '../supabase/server';
import type { BookingConfirmationEmailData, EmailSendResult } from '../../types/email';
import type { Database } from '../../types/database';

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

type BookingRow = Database['public']['Tables']['bookings']['Row'];
type CabinRow = Database['public']['Tables']['cabins']['Row'];

/**
 * Helper de alto nivel para obtener una reserva completa y disparar
 * el email de confirmación usando los datos almacenados en Supabase.
 */
export async function sendBookingConfirmationForBooking(bookingId: string): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*, cabin:cabins(*)')
      .eq('id', bookingId)
      .limit(1);

    const booking = data?.[0] as (BookingRow & { cabin: CabinRow }) | undefined;

    if (error || !booking || !booking.cabin) {
      console.warn('[Email] No se pudo cargar la reserva para enviar confirmación:', bookingId, error);
      return;
    }

    let towelsCount = 0;
    try {
      const { data: events } = await supabaseAdmin
        .from('api_events')
        .select('payload')
        .eq('booking_id', bookingId)
        .eq('event_type', 'booking_hold_created')
        .limit(1);

      const payload = (events?.[0] as any)?.payload;
      if (payload && typeof payload.towels_count === 'number') {
        towelsCount = Math.max(0, Math.min(7, payload.towels_count));
      }
    } catch (payloadError) {
      console.warn('[Email] No se pudo determinar towels_count para la reserva:', bookingId, payloadError);
    }

    const normalizedJacuzziDays = Array.isArray(booking.jacuzzi_days)
      ? (booking.jacuzzi_days as unknown as string[])
      : [];
    const bookingReference = bookingId.substring(0, 8).toUpperCase();

    const emailResult = await sendBookingConfirmation({
      to: {
        email: booking.customer_email,
        name: booking.customer_name,
      },
      subject: `✅ Reserva confirmada - ${booking.cabin.title} - Ref: ${bookingReference}`,
      bookingId,
      bookingReference,
      cabinName: booking.cabin.title,
      cabinSlug: booking.cabin.slug,
      checkInDate: booking.start_date,
      checkOutDate: booking.end_date,
      numberOfGuests: booking.party_size,
      hasJacuzzi: normalizedJacuzziDays.length > 0,
      jacuzziDays: normalizedJacuzziDays,
      towelsCount,
      towelsPrice: towelsCount * 2000,
      totalPrice: booking.amount_total,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      customerPhone: booking.customer_phone,
    });

    if (emailResult.success) {
      await (supabaseAdmin.from('bookings') as any)
        .update({ confirmation_sent_at: new Date().toISOString() })
        .eq('id', bookingId);
    }
  } catch (error) {
    console.error('[Email] Error enviando confirmación para la reserva', bookingId, error);
  }
}
