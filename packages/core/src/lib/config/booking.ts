const DEFAULT_BASE_GUESTS = Number(process.env.NEXT_PUBLIC_DEFAULT_INCLUDED_GUESTS ?? 2) || 2;
const DEFAULT_MAX_EXTRA_GUESTS = Number(process.env.NEXT_PUBLIC_MAX_EXTRA_GUESTS ?? 5) || 5;

// Para BOOKING_HOLD_MINUTES, usamos nullish coalescing para permitir valor 0 explícito
// aunque no es un caso de uso práctico (¿quién querría 0 minutos de hold?)
const holdMinutesEnv = process.env.BOOKING_HOLD_MINUTES;
const DEFAULT_HOLD_MINUTES = holdMinutesEnv !== undefined && holdMinutesEnv !== '' 
  ? (Number(holdMinutesEnv) > 0 ? Number(holdMinutesEnv) : 45) // Mínimo 1 minuto si se especifica
  : 45; // Default si no está definido

export const BOOKING_BASE_GUESTS = DEFAULT_BASE_GUESTS;
export const BOOKING_MAX_EXTRA_GUESTS = DEFAULT_MAX_EXTRA_GUESTS;
export const BOOKING_ABSOLUTE_MAX_GUESTS = BOOKING_BASE_GUESTS + BOOKING_MAX_EXTRA_GUESTS;

/**
 * Duración del hold temporal de una reserva en minutos.
 * Durante este tiempo, las fechas quedan bloqueadas mientras el cliente completa el pago.
 * Configurable via BOOKING_HOLD_MINUTES (default: 45 minutos, mínimo: 1 minuto).
 */
export const BOOKING_HOLD_DURATION_MINUTES = DEFAULT_HOLD_MINUTES;

/**
 * Determina el máximo real permitido considerando la capacidad declarada
 * de la cabaña y el tope de negocio (2 incluidos + 5 adicionales).
 */
export function resolveMaxGuests(capacityMax?: number | null): number {
  if (typeof capacityMax === 'number' && capacityMax > 0) {
    return Math.min(capacityMax, BOOKING_ABSOLUTE_MAX_GUESTS);
  }
  return BOOKING_ABSOLUTE_MAX_GUESTS;
}

