import { differenceInDays, parseISO } from 'date-fns';
import type { Cabin } from '../../types/database';

const DEFAULT_INCLUDED_GUESTS =
  Number(process.env.NEXT_PUBLIC_DEFAULT_INCLUDED_GUESTS || 2) || 2;

export const TOWEL_PRICE_CLP = 2000;

/**
 * Desglose de precio de una reserva
 */
export interface PriceBreakdown {
  nights: number;
  basePrice: number;
  extraPeople: number;
  extraPeoplePrice: number;
  jacuzziDays: number;
  jacuzziPrice: number;
  towelsCount: number;
  towelsPrice: number;
  subtotal: number;
  total: number;
  includedGuests: number;
}

/**
 * Calcular el desglose de precio de una reserva
 *
 * @param cabin - Información de la cabaña
 * @param startDate - Fecha de inicio (YYYY-MM-DD)
 * @param endDate - Fecha de fin (YYYY-MM-DD)
 * @param partySize - Cantidad de personas
 * @param jacuzziDays - Array de fechas con jacuzzi (YYYY-MM-DD)
 * @returns Desglose completo del precio
 */
export function calculatePrice(
  cabin: Pick<
    Cabin,
    'base_price' | 'jacuzzi_price' | 'capacity_base' | 'capacity_max' | 'price_per_extra_person'
  >,
  startDate: string,
  endDate: string,
  partySize: number,
  jacuzziDays: string[] = [],
  towelsCount: number = 0
): PriceBreakdown {
  // Calcular noches
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const nights = differenceInDays(end, start);

  // Validar que haya al menos 1 noche (fechas consecutivas son válidas)
  // Ejemplo válido: Check-in 15 nov, Check-out 16 nov = 1 noche
  if (nights < 1) {
    throw new Error(`La reserva debe ser de al menos 1 noche. Check-out debe ser al menos 1 día después del Check-in.`);
  }

  // Resolución dinámica de huéspedes incluidos en el precio base
  const includedGuests = getIncludedGuests(cabin);

  // Precio base (precio por noche * cantidad de noches)
  const basePrice = cabin.base_price * nights;

  // Calcular personas extras (sobre capacity_base)
  const extraPeople = Math.max(0, partySize - includedGuests);
  const extraPerPerson = Number((cabin as any).price_per_extra_person ?? 0)
  const extraPeoplePrice = extraPeople * extraPerPerson * nights

  // Precio de jacuzzi (precio por día * cantidad de días con jacuzzi)
  const jacuzziDaysCount = jacuzziDays.length;
  const jacuzziPrice = cabin.jacuzzi_price * jacuzziDaysCount;

  const towelsPrice = Math.max(0, towelsCount) * TOWEL_PRICE_CLP;

  // Subtotal y total
  const subtotal = basePrice + extraPeoplePrice + jacuzziPrice + towelsPrice;
  const total = subtotal;

  return {
    nights,
    basePrice,
    extraPeople,
    extraPeoplePrice,
    jacuzziDays: jacuzziDaysCount,
    jacuzziPrice,
    towelsCount,
    towelsPrice,
    subtotal,
    total,
    includedGuests,
  };
}

/**
 * Determina cuántos huéspedes están incluidos en el precio base.
 * Si la data de la DB aún no refleja los valores finales (ej: capacity_base = capacity_max),
 * se utiliza un fallback configurable para evitar bloquear el flujo de reserva.
 */
export function getIncludedGuests(
  cabin: Pick<Cabin, 'capacity_base' | 'capacity_max'>
): number {
  const maxGuests = Math.max(1, cabin.capacity_max || DEFAULT_INCLUDED_GUESTS);
  const configuredBase = Math.max(1, cabin.capacity_base || DEFAULT_INCLUDED_GUESTS);

  // Si capacity_base quedó igual a capacity_max (datos antiguos), usar fallback por defecto
  if (configuredBase >= maxGuests && maxGuests > DEFAULT_INCLUDED_GUESTS) {
    return Math.min(DEFAULT_INCLUDED_GUESTS, maxGuests);
  }

  return Math.min(configuredBase, maxGuests);
}

/**
 * Formatear el desglose de precio para mostrar al usuario
 */
export function formatPriceBreakdown(breakdown: PriceBreakdown): string {
  const lines: string[] = [];

  lines.push(`${breakdown.nights} noche${breakdown.nights > 1 ? 's' : ''}: $${breakdown.basePrice.toLocaleString('es-CL')}`);

  if (breakdown.jacuzziDays > 0) {
    lines.push(`Jacuzzi (${breakdown.jacuzziDays} día${breakdown.jacuzziDays > 1 ? 's' : ''}): $${breakdown.jacuzziPrice.toLocaleString('es-CL')}`);
  }

  if (breakdown.towelsCount > 0) {
    lines.push(`Toallas (${breakdown.towelsCount}): $${breakdown.towelsPrice.toLocaleString('es-CL')}`);
  }

  lines.push(`Total: $${breakdown.total.toLocaleString('es-CL')}`);

  return lines.join('\n');
}
