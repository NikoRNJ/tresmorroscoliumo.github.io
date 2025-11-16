import { z } from 'zod';
import { addDays, isAfter, isBefore, parseISO, format } from 'date-fns';

/**
 * Schema de validación para disponibilidad
 */
export const availabilityQuerySchema = z.object({
  cabinId: z.string().uuid('ID de cabaña inválido'),
  year: z.coerce.number().int().min(2024).max(2030),
  month: z.coerce.number().int().min(1).max(12),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

/**
 * Schema de validación para crear hold de reserva
 */
export const createBookingHoldSchema = z
  .object({
    cabinId: z.string().uuid('ID de cabaña inválido'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
    partySize: z.number().int().min(1, 'Mínimo 1 persona').max(10, 'Máximo 10 personas'),
    jacuzziDays: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().default([]),
    towelsCount: z.number().int().min(0).max(7).optional().default(0),
    customerName: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
    customerEmail: z.string().email('Email inválido'),
    customerPhone: z.string().min(8, 'Teléfono muy corto').max(20, 'Teléfono muy largo'),
    customerNotes: z.string().max(500, 'Notas muy largas').optional(),
    arrivalTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida (HH:MM)')
      .optional()
      .default('15:00'),
    departureTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida (HH:MM)')
      .optional()
      .default('12:00'),
  })
  .refine(
    (data) => {
      const start = parseISO(data.startDate);
      const end = parseISO(data.endDate);
      return isAfter(end, start);
    },
    {
      message: 'La fecha de fin debe ser posterior a la fecha de inicio',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      const start = parseISO(data.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return isAfter(start, today) || start.getTime() === today.getTime();
    },
    {
      message: 'La fecha de inicio no puede ser en el pasado',
      path: ['startDate'],
    }
  )
  .refine(
    (data) => {
      const start = parseISO(data.startDate);
      const end = parseISO(data.endDate);
      const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return nights >= 1 && nights <= 30;
    },
    {
      message: 'La estancia debe ser de mínimo 1 noche y máximo 30 noches',
      path: ['endDate'],
    }
  );

export type CreateBookingHold = z.infer<typeof createBookingHoldSchema>;

/**
 * Validar que las fechas de jacuzzi están dentro del rango de la reserva
 */
export function validateJacuzziDays(
  startDate: string,
  endDate: string,
  jacuzziDays: string[]
): boolean {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  return jacuzziDays.every((day) => {
    const jacuzziDate = parseISO(day);
    return (
      (isAfter(jacuzziDate, start) || jacuzziDate.getTime() === start.getTime()) &&
      isBefore(jacuzziDate, end)
    );
  });
}

/**
 * Generar array de fechas entre dos fechas
 */
export function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let currentDate = parseISO(startDate);
  const end = parseISO(endDate);

  while (isBefore(currentDate, end)) {
    dates.push(format(currentDate, 'yyyy-MM-dd'));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}
