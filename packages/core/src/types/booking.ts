/**
 * Types relacionados con el proceso de reserva
 */

import type { Database } from './database';

type Booking = Database['public']['Tables']['bookings']['Row'];

/**
 * Estado del formulario de reserva
 */
export interface BookingFormData {
  // Fechas
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  
  // Huéspedes
  partySize: number;
  
  // Jacuzzi
  jacuzziDays: string[]; // Array de YYYY-MM-DD
  
  // Cliente
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
}

/**
 * Respuesta de creación de hold
 */
export interface CreateHoldResponse {
  success: true;
  booking: Booking;
  expiresAt: string; // ISO timestamp
  redirectUrl: string; // URL para ir a pagar
}

/**
 * Error de reserva
 */
export interface BookingError {
  success: false;
  error: string;
  code?: 'DATES_UNAVAILABLE' | 'EXPIRED_HOLD' | 'INVALID_DATA' | 'SERVER_ERROR';
  details?: Record<string, string[]>;
}

/**
 * Hold temporal de reserva
 */
export interface BookingHold {
  id: string;
  cabinId: string;
  startDate: string;
  endDate: string;
  expiresAt: string;
  amountTotal: number;
}
