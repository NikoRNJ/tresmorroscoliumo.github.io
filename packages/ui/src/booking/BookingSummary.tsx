'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatPrice } from '@core/lib/utils/format';
import { PriceBreakdown } from '@core/lib/utils/pricing';
import { Calendar, Users, Waves } from 'lucide-react';

interface BookingSummaryProps {
  cabinName: string;
  startDate: Date;
  endDate: Date;
  partySize: number;
  priceBreakdown: PriceBreakdown;
}

/**
 * Resumen de la reserva antes de confirmar
 * Adaptado al tema oscuro
 */
export function BookingSummary({
  cabinName,
  startDate,
  endDate,
  partySize,
  priceBreakdown,
}: BookingSummaryProps) {
  return (
    <div className="rounded-lg border-2 border-primary-500/30 bg-primary-500/5 p-6">
      <h3 className="mb-4 text-lg font-bold text-white">Resumen de tu reserva</h3>

      <div className="space-y-4">
        {/* Cabaña */}
        <div>
          <p className="text-sm font-medium text-gray-400">Cabaña</p>
          <p className="text-base font-semibold text-white">{cabinName}</p>
        </div>

        {/* Fechas */}
        <div className="flex items-start gap-2">
          <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-500" />
          <div>
            <p className="text-sm font-medium text-gray-400">Fechas</p>
            <p className="text-base font-semibold text-white">
              {format(startDate, "d 'de' MMMM", { locale: es })} -{' '}
              {format(endDate, "d 'de' MMMM yyyy", { locale: es })}
            </p>
            <p className="text-sm text-gray-400">
              {priceBreakdown.nights} noche{priceBreakdown.nights !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Huéspedes */}
        <div className="flex items-start gap-2">
          <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-500" />
          <div>
            <p className="text-sm font-medium text-gray-400">Huéspedes</p>
            <p className="text-base font-semibold text-white">
              {partySize} persona{partySize !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Jacuzzi (si aplica) */}
        {priceBreakdown.jacuzziDays > 0 && (
          <div className="flex items-start gap-2">
            <Waves className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-500" />
            <div>
              <p className="text-sm font-medium text-gray-400">Jacuzzi</p>
              <p className="text-base font-semibold text-white">
                {priceBreakdown.jacuzziDays} día{priceBreakdown.jacuzziDays !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Desglose de precios */}
        <div className="space-y-2 border-t border-primary-500/20 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">
              {priceBreakdown.nights} noche{priceBreakdown.nights !== 1 ? 's' : ''} (base)
            </span>
            <span className="font-medium text-white">
              {formatPrice(priceBreakdown.basePrice)}
            </span>
          </div>

          {priceBreakdown.extraPeople > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                {priceBreakdown.extraPeople} persona{priceBreakdown.extraPeople !== 1 ? 's' : ''} extra × {priceBreakdown.nights} noche{priceBreakdown.nights !== 1 ? 's' : ''}
              </span>
              <span className="font-medium text-white">
                {formatPrice(priceBreakdown.extraPeoplePrice)}
              </span>
            </div>
          )}

          {priceBreakdown.jacuzziDays > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                Jacuzzi ({priceBreakdown.jacuzziDays} día
                {priceBreakdown.jacuzziDays !== 1 ? 's' : ''})
              </span>
              <span className="font-medium text-white">
                {formatPrice(priceBreakdown.jacuzziPrice)}
              </span>
            </div>
          )}

          {priceBreakdown.towelsCount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Toallas ({priceBreakdown.towelsCount})</span>
              <span className="font-medium text-white">{formatPrice(priceBreakdown.towelsPrice)}</span>
            </div>
          )}

          <div className="flex justify-between border-t border-primary-500/20 pt-2">
            <span className="text-base font-bold text-white">Total</span>
            <span className="text-xl font-bold text-primary-500">
              {formatPrice(priceBreakdown.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
