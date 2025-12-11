'use client';

import { eachDayOfInterval, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check } from 'lucide-react';
import { cn } from '@core/lib/utils/cn';

interface JacuzziSelectorProps {
  startDate: Date;
  endDate: Date;
  selectedDays: string[];
  onToggleDay: (day: string) => void;
  pricePerDay: number;
}

/**
 * Selector de días con tinaja
 * Permite seleccionar qué días de la estadía se quiere tinaja con hidromasaje
 * Adaptado al tema oscuro
 */
export function JacuzziSelector({
  startDate,
  endDate,
  selectedDays,
  onToggleDay,
  pricePerDay,
}: JacuzziSelectorProps) {
  // Generar array de días entre start y end (excluyendo el último día)
  const days = eachDayOfInterval({ start: startDate, end: endDate }).slice(0, -1);

  if (days.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h4 className="font-semibold text-white">Tinaja con hidromasaje (Opcional)</h4>
        <span className="text-sm text-gray-400">
          ${pricePerDay.toLocaleString('es-CL')} por día
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const isSelected = selectedDays.includes(dayStr);

          return (
            <button
              key={dayStr}
              type="button"
              onClick={() => onToggleDay(dayStr)}
              className={cn(
                'flex items-center justify-between rounded-lg border-2 p-3 text-left transition-all',
                isSelected
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-800 bg-dark-800/50 hover:border-dark-700'
              )}
            >
              <div>
                <p className="font-medium text-white">
                  {format(day, "EEEE d 'de' MMMM", { locale: es })}
                </p>
                <p className="text-sm text-gray-400">
                  +${pricePerDay.toLocaleString('es-CL')}
                </p>
              </div>

              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border-2',
                  isSelected
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-dark-700 bg-dark-900'
                )}
              >
                {isSelected && <Check className="h-4 w-4 text-dark-950" />}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDays.length > 0 && (
        <div className="rounded-md bg-primary-500/10 border border-primary-500/20 p-3 text-sm text-primary-400">
          Has seleccionado jacuzzi para {selectedDays.length} día
          {selectedDays.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
