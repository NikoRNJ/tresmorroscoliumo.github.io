'use client';

import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Users } from 'lucide-react';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { JacuzziSelector } from './JacuzziSelector';
import { BookingSummary } from './BookingSummary';
import { Button } from '../ui/Button';
import { formatPrice } from '@core/lib/utils/format';
import { calculatePrice, getIncludedGuests } from '@core/lib/utils/pricing';
import { BOOKING_BASE_GUESTS, BOOKING_MAX_EXTRA_GUESTS, resolveMaxGuests } from '@core/lib/config/booking';
import type { Cabin } from '@core/types/database';

interface BookingSidebarProps {
  cabin: Cabin;
}

/**
 * Sidebar de reserva con calendario y opciones
 * Componente cliente para manejar el estado de la reserva
 */
export function BookingSidebar({ cabin }: BookingSidebarProps) {
  const maxGuests = resolveMaxGuests(cabin.capacity_max);
  const minGuests = Math.min(BOOKING_BASE_GUESTS, maxGuests);
  const includedGuests = Math.min(
    Math.max(getIncludedGuests(cabin), BOOKING_BASE_GUESTS),
    maxGuests
  );
  const allowedExtraGuests = Math.max(
    0,
    Math.min(BOOKING_MAX_EXTRA_GUESTS, maxGuests - BOOKING_BASE_GUESTS)
  );

  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [partySize, setPartySize] = useState(
    Math.min(Math.max(includedGuests, minGuests), maxGuests)
  );
  const [jacuzziDays, setJacuzziDays] = useState<string[]>([]);

  // Calcular precio si hay fechas seleccionadas
  const priceBreakdown = selectedRange?.from && selectedRange?.to
    ? calculatePrice(
        cabin,
        format(selectedRange.from, 'yyyy-MM-dd'),
        format(selectedRange.to, 'yyyy-MM-dd'),
        partySize,
        jacuzziDays
      )
    : null;

  const handleToggleJacuzziDay = (day: string) => {
    setJacuzziDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleReservation = () => {
    // TODO: Implementar lógica de reserva en Iteración 4
    console.log('Reserva:', { cabin: cabin.id, selectedRange, partySize, jacuzziDays });
    alert('La funcionalidad de reserva se implementará en la siguiente iteración');
  };

  return (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="rounded-lg border border-dark-800 bg-dark-900 p-6 shadow-lg">
        <h3 className="mb-4 text-xl font-bold text-white">Información de Reserva</h3>

        {/* Capacidad */}
        <div className="mb-4 flex items-center gap-2 text-gray-300">
          <Users className="h-5 w-5 text-primary-500" />
          <span>
            Capacidad: {minGuests} - {maxGuests} personas
          </span>
        </div>

        {/* Selector de huéspedes */}
        <div className="mb-4">
          <label htmlFor="partySize" className="mb-2 block text-sm font-medium text-gray-300">
            Número de huéspedes
          </label>
          <select
            id="partySize"
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            className="w-full rounded-md border border-dark-800 bg-dark-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {Array.from({ length: maxGuests - minGuests + 1 }, (_, i) => minGuests + i).map((size) => (
              <option key={size} value={size}>
                {size} persona{size !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">
            El precio base cubre {BOOKING_BASE_GUESTS} persona{BOOKING_BASE_GUESTS !== 1 ? 's' : ''}. Puedes agregar hasta{' '}
            {allowedExtraGuests} adicional{allowedExtraGuests === 1 ? '' : 'es'} (máx. {maxGuests}).
            {cabin.price_per_extra_person > 0 &&
              ` Cada adicional: ${formatPrice(cabin.price_per_extra_person)}/noche.`}
          </p>
        </div>

        {/* Precios */}
        <div className="space-y-2 border-t border-dark-800 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Precio base</span>
            <span className="font-semibold text-white">
              {formatPrice(cabin.base_price)}/noche
            </span>
          </div>
          {cabin.jacuzzi_price > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Jacuzzi (opcional)</span>
              <span className="font-semibold text-white">
                {formatPrice(cabin.jacuzzi_price)}/día
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Calendario de disponibilidad */}
      <AvailabilityCalendar
        cabinId={cabin.id}
        onRangeSelect={setSelectedRange}
        selectedRange={selectedRange}
      />

      {/* Selector de jacuzzi (solo si hay fechas seleccionadas) */}
      {selectedRange?.from && selectedRange?.to && (
        <div className="rounded-lg border border-dark-800 bg-dark-900 p-6">
          <JacuzziSelector
            startDate={selectedRange.from}
            endDate={selectedRange.to}
            selectedDays={jacuzziDays}
            onToggleDay={handleToggleJacuzziDay}
            pricePerDay={cabin.jacuzzi_price}
          />
        </div>
      )}

      {/* Resumen de reserva */}
      {priceBreakdown && selectedRange?.from && selectedRange?.to && (
        <>
          <BookingSummary
            cabinName={cabin.title}
            startDate={selectedRange.from}
            endDate={selectedRange.to}
            partySize={partySize}
            priceBreakdown={priceBreakdown}
          />

          {/* Botón de reserva */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleReservation}
          >
            Continuar con la Reserva
          </Button>
        </>
      )}

      {/* Mensaje si no hay fechas seleccionadas */}
      {!selectedRange?.from && (
        <div className="rounded-lg border border-dark-800 bg-dark-900 p-4 text-center text-sm text-gray-400">
          Selecciona las fechas de tu estadía en el calendario para ver el precio total
        </div>
      )}
    </div>
  );
}
