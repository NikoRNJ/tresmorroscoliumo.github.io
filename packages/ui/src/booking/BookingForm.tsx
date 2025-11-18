'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { JacuzziSelector } from './JacuzziSelector';
import { BookingSummary } from './BookingSummary';
import { calculatePrice } from '@core/lib/utils/pricing';
import { format } from 'date-fns';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Cabin } from '@core/types/database';
import type { CreateHoldResponse, BookingError } from '@core/types/booking';

const PERIOD_OPTIONS = ['AM', 'PM'] as const;
type Meridiem = typeof PERIOD_OPTIONS[number];

const to24Hour = (time: string, period: Meridiem) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map((val) => Number(val));
  let converted = hours % 12;
  if (period === 'PM') {
    converted += 12;
  }
  return `${converted.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const enumerateDates = (start: Date, end: Date) => {
  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    dates.push(format(cursor, 'yyyy-MM-dd'));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const getMonthKeys = (dates: string[]) =>
  Array.from(new Set(dates.map((date) => date.slice(0, 7))));

// Schema de validación del formulario
const bookingFormSchema = z.object({
  customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  customerEmail: z.string().email('Email inválido'),
  customerPhone: z
    .string()
    .min(8, 'El teléfono debe tener al menos 8 dígitos')
    .max(20)
    .regex(/^[+]?[\d\s()-]+$/, 'Formato de teléfono inválido'),
  customerNotes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  cabin: Cabin;
  startDate: Date;
  endDate: Date;
  partySize: number;
  onBack: () => void;
  onDatesUnavailable?: () => void;
}

/**
 * Formulario completo de reserva
 * Incluye datos del cliente, selección de jacuzzi y resumen
 */
export function BookingForm({ cabin, startDate, endDate, partySize, onBack, onDatesUnavailable }: BookingFormProps) {
  const router = useRouter();
  const [jacuzziDays, setJacuzziDays] = useState<string[]>([]);
  const [towelsCount, setTowelsCount] = useState<number>(0);
  const [arrivalTime, setArrivalTime] = useState<string>('03:00');
  const [arrivalPeriod, setArrivalPeriod] = useState<Meridiem>('PM');
  const [departureTime, setDepartureTime] = useState<string>('11:00');
  const [departurePeriod, setDeparturePeriod] = useState<Meridiem>('AM');
  const [specialEvent, setSpecialEvent] = useState<boolean>(false);
  const [specialEventType, setSpecialEventType] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const stayDates = useMemo(() => enumerateDates(startDate, endDate), [startDate, endDate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerNotes: '',
      acceptTerms: false,
    },
  });

  // Calcular precio total
  const priceBreakdown = calculatePrice(
    cabin,
    format(startDate, 'yyyy-MM-dd'),
    format(endDate, 'yyyy-MM-dd'),
    partySize,
    jacuzziDays,
    towelsCount
  );

  // Toggle día de jacuzzi
  const handleToggleJacuzziDay = (day: string) => {
    setJacuzziDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const ensureDatesStillAvailable = async () => {
    const monthKeys = getMonthKeys(stayDates);
    const targetSet = new Set(stayDates);

    for (const key of monthKeys) {
      const [year, month] = key.split('-');
      const response = await fetch(
        `/api/availability?cabinId=${cabin.id}&year=${year}&month=${Number(month)}&ts=${Date.now()}`,
        { cache: 'no-store' }
      );
      if (!response.ok) {
        continue;
      }
      const data = await response.json();
      const unavailable = new Set<string>([
        ...(data.booked || []),
        ...(data.pending || []),
        ...(data.blocked || []),
      ]);
      const conflict = Array.from(targetSet).some((date) => unavailable.has(date));
      if (conflict) {
        return false;
      }
    }

    return true;
  };

  // Submit del formulario
  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      if (!arrivalTime || !departureTime) {
        setApiError('Debes indicar hora de entrada y hora de salida');
        setIsSubmitting(false);
        return;
      }

      const arrivalTimeValue = to24Hour(arrivalTime, arrivalPeriod);
      const departureTimeValue = to24Hour(departureTime, departurePeriod);

      if (!arrivalTimeValue || !departureTimeValue) {
        setApiError('Formato de hora inválido. Usa HH:MM y selecciona AM o PM.');
        setIsSubmitting(false);
        return;
      }

      const datesStillAvailable = await ensureDatesStillAvailable();
      if (!datesStillAvailable) {
        setApiError('Las fechas acaban de ocuparse. Vuelve a seleccionar otro rango disponible.');
        onDatesUnavailable?.();
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/bookings/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cabinId: cabin.id,
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
            partySize,
            jacuzziDays,
            towelsCount,
            arrivalTime: arrivalTimeValue,
            departureTime: departureTimeValue,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            customerNotes: data.customerNotes,
          }),
      });

      const result: CreateHoldResponse | BookingError = await response.json();

      if (!response.ok || !result.success) {
        const error = result as BookingError;
        if (error.code === 'DATES_UNAVAILABLE') {
          setApiError(
            'Otro huésped reservó esas fechas segundos antes que tú. Actualizamos el calendario para que elijas un nuevo rango disponible.'
          );
          onDatesUnavailable?.();
        } else {
          setApiError(error.error);
        }
        return;
      }

      if (specialEvent && specialEventType.trim().length > 0) {
        try {
          await fetch('/api/events/special', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.customerName,
              email: data.customerEmail,
              phone: data.customerPhone,
              eventType: specialEventType,
            }),
          });
        } catch {}
      }

      const successResponse = result as CreateHoldResponse;
      const fallbackPath = `/pago?booking=${successResponse.booking.id}`;
      router.push(successResponse.redirectUrl || fallbackPath);
    } catch (error) {
      console.error('Error submitting booking:', error);
      setApiError('Error al procesar la reserva. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Error de API */}
      {apiError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500 bg-red-950 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <h4 className="font-semibold text-red-400">Error al crear la reserva</h4>
            <p className="text-sm text-red-300">{apiError}</p>
          </div>
        </div>
      )}

      {/* Resumen de la reserva */}
      <BookingSummary
        cabinName={cabin.title}
        startDate={startDate}
        endDate={endDate}
        partySize={partySize}
        priceBreakdown={priceBreakdown}
      />

      {/* Selector de Jacuzzi */}
      {cabin.jacuzzi_price > 0 && (
        <JacuzziSelector
          startDate={startDate}
          endDate={endDate}
          selectedDays={jacuzziDays}
          onToggleDay={handleToggleJacuzziDay}
          pricePerDay={cabin.jacuzzi_price}
        />
      )}

      <div className="space-y-4 rounded-lg border border-dark-800 bg-dark-900 p-6">
        <h3 className="text-lg font-bold text-white">Toallas (opcional)</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">Máximo 7 unidades</p>
            <p className="text-xs text-gray-500">$2.000 c/u</p>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setTowelsCount(Math.max(0, towelsCount - 1))} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dark-700 text-lg font-bold text-gray-300 hover:border-primary-500 hover:text-primary-500 disabled:opacity-50" disabled={towelsCount <= 0}>−</button>
            <span className="w-12 text-center text-2xl font-bold text-white">{towelsCount}</span>
            <button type="button" onClick={() => setTowelsCount(Math.min(7, towelsCount + 1))} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dark-700 text-lg font-bold text-gray-300 hover:border-primary-500 hover:text-primary-500 disabled:opacity-50" disabled={towelsCount >= 7}>+</button>
          </div>
        </div>
      </div>

      {/* Datos del cliente */}
      <div className="space-y-6 rounded-lg border border-dark-800 bg-dark-900 p-6">
        <h3 className="text-lg font-bold text-white">Tus datos</h3>

        {/* Nombre */}
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-300">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            {...register('customerName')}
            type="text"
            id="customerName"
            className="mt-1 block w-full rounded-md border border-dark-700 bg-dark-800 px-3 py-2 text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Juan Pérez"
          />
          {errors.customerName && (
            <p className="mt-1 text-sm text-red-400">{errors.customerName.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-300">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            {...register('customerEmail')}
            type="email"
            id="customerEmail"
            className="mt-1 block w-full rounded-md border border-dark-700 bg-dark-800 px-3 py-2 text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="juan@ejemplo.com"
          />
          {errors.customerEmail && (
            <p className="mt-1 text-sm text-red-400">{errors.customerEmail.message}</p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-300">
            Teléfono <span className="text-red-500">*</span>
          </label>
          <input
            {...register('customerPhone')}
            type="tel"
            id="customerPhone"
            className="mt-1 block w-full rounded-md border border-dark-700 bg-dark-800 px-3 py-2 text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="+56 9 1234 5678"
          />
          {errors.customerPhone && (
            <p className="mt-1 text-sm text-red-400">{errors.customerPhone.message}</p>
          )}
        </div>

        {/* Notas opcionales */}
        <div>
          <label htmlFor="customerNotes" className="block text-sm font-medium text-gray-300">
            Comentarios adicionales (opcional)
          </label>
          <textarea
            {...register('customerNotes')}
            id="customerNotes"
            rows={3}
            className="mt-1 block w-full rounded-md border border-dark-700 bg-dark-800 px-3 py-2 text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Solicitudes especiales, hora estimada de llegada, etc."
          />
          {errors.customerNotes && (
            <p className="mt-1 text-sm text-red-400">{errors.customerNotes.message}</p>
          )}
        </div>

        {/* Términos y condiciones */}
        <div className="flex items-start gap-3">
          <input
            {...register('acceptTerms')}
            type="checkbox"
            id="acceptTerms"
            className="mt-1 h-4 w-4 rounded border-dark-700 bg-dark-800 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-300">
            Acepto los términos y condiciones de la reserva. Entiendo que tendré{' '}
            <strong className="text-white">45 minutos</strong> para completar el pago una vez creada la reserva.{' '}
            <span className="text-red-500">*</span>
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-red-400">{errors.acceptTerms.message}</p>
        )}

      <div className="mt-6 space-y-3">
          <div>
            <label htmlFor="arrivalTime" className="block text-sm font-medium text-gray-300">Hora de entrada (primer día)</label>
            <div className="mt-1 flex items-center gap-3">
              <input
                id="arrivalTime"
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="flex-1 rounded-md border border-dark-700 bg-dark-800 px-3 py-2 text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <select
                aria-label="Periodo hora entrada"
                value={arrivalPeriod}
                onChange={(e) => setArrivalPeriod(e.target.value as Meridiem)}
                className="rounded-md border border-dark-700 bg-dark-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {PERIOD_OPTIONS.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">Especifica hora y selecciona si corresponde a AM o PM.</p>
          </div>
          <div>
            <label htmlFor="departureTime" className="block text-sm font-medium text-gray-300">Hora de salida (último día)</label>
            <div className="mt-1 flex items-center gap-3">
              <input
                id="departureTime"
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="flex-1 rounded-md border border-dark-700 bg-dark-800 px-3 py-2 text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <select
                aria-label="Periodo hora salida"
                value={departurePeriod}
                onChange={(e) => setDeparturePeriod(e.target.value as Meridiem)}
                className="rounded-md border border-dark-700 bg-dark-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {PERIOD_OPTIONS.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">Indica claramente si la salida será AM o PM.</p>
          </div>
          <div className="flex items-start gap-3">
            <input type="checkbox" id="specialEvent" checked={specialEvent} onChange={(e) => setSpecialEvent(e.target.checked)} className="mt-1 h-4 w-4 rounded border-dark-700 bg-dark-800 text-primary-600 focus:ring-primary-500" />
            <label htmlFor="specialEvent" className="text-sm text-gray-300">Necesito evento especial (opcional)</label>
          </div>
          {specialEvent && (
            <div>
              <label htmlFor="specialEventType" className="block text-sm font-medium text-gray-300">Tipo de evento</label>
              <input id="specialEventType" type="text" value={specialEventType} onChange={(e) => setSpecialEventType(e.target.value)} className="mt-1 block w-full rounded-md border border-dark-700 bg-dark-800 px-3 py-2 text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="Cumpleaños, aniversario, propuesta, etc." />
            </div>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting} className="w-full sm:w-auto">
          Volver
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando reserva...
            </>
          ) : (
            `Continuar al pago ($${priceBreakdown.total.toLocaleString('es-CL')})`
          )}
        </Button>
      </div>

      {/* Aviso de seguridad */}
      <div className="rounded-md bg-blue-950 border border-blue-800 p-4 text-sm text-blue-300">
        <p className="font-semibold text-blue-200">Tu reserva estará protegida por 45 minutos</p>
        <p className="mt-1">
          Una vez hagas click en &quot;Continuar al pago&quot;, las fechas quedarán reservadas temporalmente
          para ti. Tendrás 45 minutos para completar el pago de forma segura.
        </p>
      </div>
    </form>
  );
}
