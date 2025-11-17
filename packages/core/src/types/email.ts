/**
 * Tipos para el sistema de emails
 * 
 * Iteración 6: Sistema de notificaciones por email con SendGrid
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
  bookingReference: string; // Primeros 8 caracteres del UUID
  cabinName: string;
  cabinSlug: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  hasJacuzzi: boolean;
  jacuzziDays: string[]; // Array de fechas YYYY-MM-DD
  towelsCount?: number;
  towelsPrice?: number;
  totalPrice: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
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
  attempts?: number;
  mode?: 'mock' | 'live';
}
