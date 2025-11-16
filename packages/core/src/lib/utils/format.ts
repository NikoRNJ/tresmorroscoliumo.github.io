/**
 * Utilidades de formateo (números, fechas, etc)
 */

/**
 * Formatear precio en pesos chilenos
 * @example formatPrice(55000) => "$55.000"
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatear fecha en formato chileno
 * @example formatDate(new Date()) => "11 de noviembre de 2025"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Formatear rango de fechas
 * @example formatDateRange(start, end) => "25 - 28 de diciembre de 2025"
 */
export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  
  if (sameMonth && sameYear) {
    return `${start.getDate()} - ${end.getDate()} de ${start.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}`;
  }
  
  return `${formatDate(start)} - ${formatDate(end)}`;
}

/**
 * Formatear número de noches
 * @example formatNights(1) => "1 noche"
 * @example formatNights(3) => "3 noches"
 */
export function formatNights(nights: number): string {
  return nights === 1 ? '1 noche' : `${nights} noches`;
}

/**
 * Formatear número de personas
 * @example formatGuests(1) => "1 persona"
 * @example formatGuests(4) => "4 personas"
 */
export function formatGuests(guests: number): string {
  return guests === 1 ? '1 persona' : `${guests} personas`;
}
