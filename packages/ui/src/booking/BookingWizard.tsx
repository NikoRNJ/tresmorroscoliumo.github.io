'use client';

import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker'
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { BookingForm } from './BookingForm';
import { Button } from '../ui/Button';
import { ArrowLeft, Calendar, Users, FileText } from 'lucide-react';
import type { Cabin } from '@core/types/database';
import { getIncludedGuests } from '@core/lib/utils/pricing';
import { formatPrice } from '@core/lib/utils/format';
import { addDays } from 'date-fns';
import { BOOKING_BASE_GUESTS, BOOKING_MAX_EXTRA_GUESTS, resolveMaxGuests } from '@core/lib/config/booking';

interface BookingWizardProps {
  cabin: Cabin;
}

type WizardStep = 'dates' | 'party-size' | 'details';

/**
 * Wizard de reserva en 3 pasos:
 * 1. Seleccionar fechas
 * 2. Seleccionar cantidad de personas
 * 3. Completar datos y confirmar
 */
export function BookingWizard({ cabin }: BookingWizardProps) {
  const allowedMaxGuests = resolveMaxGuests(cabin.capacity_max);
  const minGuests = Math.min(BOOKING_BASE_GUESTS, allowedMaxGuests);
  const maxGuests = allowedMaxGuests;
  const allowedExtraGuests = Math.max(
    0,
    Math.min(BOOKING_MAX_EXTRA_GUESTS, maxGuests - BOOKING_BASE_GUESTS)
  );
  const includedGuests = Math.min(
    Math.max(getIncludedGuests(cabin), BOOKING_BASE_GUESTS),
    allowedMaxGuests
  );
  const initialPartySize = Math.min(Math.max(includedGuests, minGuests), maxGuests);
  const [currentStep, setCurrentStep] = useState<WizardStep>('dates');
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [partySize, setPartySize] = useState<number>(initialPartySize);
  const [datesConflictMessage, setDatesConflictMessage] = useState<string | null>(null);
  const [availabilityRefreshToken, setAvailabilityRefreshToken] = useState(0);

  // Indicador de progreso
  const steps = [
    { id: 'dates' as const, name: 'Fechas', icon: Calendar },
    { id: 'party-size' as const, name: 'Personas', icon: Users },
    { id: 'details' as const, name: 'Confirmación', icon: FileText },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  // Validar que se pueden avanzar pasos
  const canProceedFromDates = Boolean(selectedRange?.from);
  const canProceedFromPartySize = partySize >= minGuests && partySize <= maxGuests;

  const handleRangeSelect = (range: DateRange | undefined) => {
    setDatesConflictMessage(null);
    setSelectedRange(range);
  };

  const handleDatesUnavailable = () => {
    setDatesConflictMessage('Las fechas que seleccionaste acaban de ser tomadas. Volvamos a elegir un nuevo rango disponible.');
    setSelectedRange(undefined);
    setCurrentStep('dates');
    setAvailabilityRefreshToken((token) => token + 1);
  };

  useEffect(() => {
    if (currentStep === 'dates') {
      setAvailabilityRefreshToken((token) => token + 1);
    }
  }, [currentStep]);

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    isActive
                      ? 'border-primary-500 bg-primary-500 text-white'
                      : isCompleted
                      ? 'border-primary-500 bg-primary-950 text-primary-500'
                      : 'border-dark-700 bg-dark-900 text-gray-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isActive || isCompleted ? 'text-primary-500' : 'text-gray-500'
                  }`}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 ${
                    isCompleted ? 'bg-primary-500' : 'bg-dark-700'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Seleccionar fechas */}
      {currentStep === 'dates' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Selecciona tus fechas</h2>
            <p className="mt-1 text-gray-400">
              Elige cuándo quieres alojarte en {cabin.title}
            </p>
          </div>

          {datesConflictMessage && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
              {datesConflictMessage}
            </div>
          )}

          <AvailabilityCalendar
            cabinId={cabin.id}
            onRangeSelect={handleRangeSelect}
            selectedRange={selectedRange}
            refreshToken={availabilityRefreshToken}
          />

          <div className="flex justify-end">
            <Button onClick={() => setCurrentStep('party-size')} disabled={!canProceedFromDates}>
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Seleccionar cantidad de personas */}
      {currentStep === 'party-size' && selectedRange?.from && (
        <div className="space-y-6">
          <button
            onClick={() => setCurrentStep('dates')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Cambiar fechas
          </button>

          <div>
            <h2 className="text-2xl font-bold text-white">¿Cuántas personas se alojarán?</h2>
            <p className="mt-1 text-gray-400">
              Incluye {BOOKING_BASE_GUESTS} persona{BOOKING_BASE_GUESTS !== 1 ? 's' : ''} en la tarifa base.
              Puedes agregar hasta {allowedExtraGuests} adicional
              {allowedExtraGuests === 1 ? '' : 'es'} (máx. {maxGuests} personas por cabaña).
            </p>
            {cabin.price_per_extra_person > 0 && maxGuests > includedGuests && (
              <p className="mt-2 text-sm text-primary-400">
                Cada persona extra: {formatPrice(cabin.price_per_extra_person)}/noche
              </p>
            )}
          </div>

          <div className="rounded-lg border border-dark-800 bg-dark-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="partySize" className="block text-sm font-medium text-gray-300">
                  Cantidad de personas
                </label>
                <p className="text-xs text-gray-500">
                  Mínimo {minGuests}, máximo {maxGuests}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setPartySize(Math.max(minGuests, partySize - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dark-700 text-lg font-bold text-gray-300 hover:border-primary-500 hover:text-primary-500 disabled:opacity-50"
                  disabled={partySize <= minGuests}
                >
                  −
                </button>
                <span className="w-12 text-center text-2xl font-bold text-white">
                  {partySize}
                </span>
                <button
                  type="button"
                  onClick={() => setPartySize(Math.min(maxGuests, partySize + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dark-700 text-lg font-bold text-gray-300 hover:border-primary-500 hover:text-primary-500 disabled:opacity-50"
                  disabled={partySize >= maxGuests}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setCurrentStep('details')} disabled={!canProceedFromPartySize}>
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Formulario de detalles */}
      {currentStep === 'details' && selectedRange?.from && (
        <div className="space-y-6">
          <button
            onClick={() => setCurrentStep('party-size')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Cambiar cantidad de personas
          </button>

          <div>
            <h2 className="text-2xl font-bold text-white">Confirma tu reserva</h2>
            <p className="mt-1 text-gray-400">Solo faltan tus datos para completar</p>
          </div>

          <BookingForm
            cabin={cabin}
            startDate={selectedRange.from}
            endDate={selectedRange.to ?? addDays(selectedRange.from, 1)}
            partySize={partySize}
            onBack={() => setCurrentStep('party-size')}
            onDatesUnavailable={handleDatesUnavailable}
          />
        </div>
      )}
    </div>
  );
}
