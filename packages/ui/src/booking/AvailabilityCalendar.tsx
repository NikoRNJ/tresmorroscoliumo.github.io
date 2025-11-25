'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DayPicker, DateRange, type DayButtonProps } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { format, parseISO, addMonths, differenceInDays, addDays, startOfMonth } from 'date-fns';
import { useAvailability } from '@core/lib/hooks/useAvailability';
import { ChevronLeft, ChevronRight, Loader2, RotateCw } from 'lucide-react';
import 'react-day-picker/dist/style.css';

interface AvailabilityCalendarProps {
  cabinId: string;
  onRangeSelect: (range: DateRange | undefined) => void;
  selectedRange?: DateRange;
  refreshToken?: number;
}

/**
 * Calendario de disponibilidad de cabaña
 * Adaptado al tema oscuro del proyecto
 * 
 * Colores:
 * - Verde: Disponible
 * - Amarillo: Hold temporal (pending)
 * - Rojo: Reservado (paid)
 * - Gris: Bloqueado por admin
 * 
 * IMPORTANTE: Mínimo 1 noche (check-in y check-out deben ser días diferentes)
 */
export function AvailabilityCalendar({
  cabinId,
  onRangeSelect,
  selectedRange,
  refreshToken = 0,
}: AvailabilityCalendarProps) {
  const initialMonth = startOfMonth(new Date());
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const maxMonth = startOfMonth(addMonths(initialMonth, 1));
  const { availability, isLoading, error, refetch } = useAvailability(
    cabinId,
    currentMonth,
    refreshToken
  );
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!availability) return;
    setLastUpdated(new Date());
  }, [availability]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  const handleManualRefresh = async () => {
    setIsManualRefresh(true);
    try {
      await refetch();
    } finally {
      setIsManualRefresh(false);
    }
  };

  // Helper para parsear fechas como local midnight (evita problemas de timezone)
  const parseDateLocal = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Convertir arrays de strings a Sets de Dates para react-day-picker
  const bookedDates = availability?.booked.map(parseDateLocal) || [];
  const pendingDates = availability?.pending.map(parseDateLocal) || [];
  const blockedDates = availability?.blocked.map(parseDateLocal) || [];
  const availableDates = availability?.available.map(parseDateLocal) || [];
  const arrivalMarkers = availability?.arrivals ?? [];
  const departureMarkers = availability?.departures ?? [];
  const arrivalDates = arrivalMarkers.map((marker) => parseDateLocal(marker.date));
  const departureDates = departureMarkers.map((marker) => parseDateLocal(marker.date));
  const checkpointMap = useMemo(() => {
    const map = new Map<string, { type: 'arrival' | 'departure'; label: string }>();
    const formatLabel = (prefix: string, time: string, status: string) => {
      const statusLabel = status === 'paid' ? 'Pagado' : 'Pendiente';
      return `${prefix} ${time} · ${statusLabel}`;
    };
    arrivalMarkers.forEach((marker) => {
      map.set(marker.date, {
        type: 'arrival',
        label: formatLabel('Llegan', marker.time, marker.status),
      });
    });
    departureMarkers.forEach((marker) => {
      map.set(marker.date, {
        type: 'departure',
        label: formatLabel('Se retiran', marker.time, marker.status),
      });
    });
    return map;
  }, [arrivalMarkers, departureMarkers]);

  // Todas las fechas no disponibles (para deshabilitar en el calendario)
  const disabledDates = [...bookedDates, ...blockedDates, ...pendingDates];

  const clampMonth = (month: Date) => {
    const monthStart = startOfMonth(month);
    if (monthStart.getTime() < initialMonth.getTime()) return initialMonth;
    if (monthStart.getTime() > maxMonth.getTime()) return maxMonth;
    return monthStart;
  };

  // Handler personalizado para validar mínimo 1 noche
  const handleRangeSelect = (range: DateRange | undefined) => {
    // Caso 1: Usuario limpia la selección
    if (!range) {
      onRangeSelect(undefined);
      return;
    }

    // Caso 2: Solo tiene 'from' (primer click en una fecha)
    if (range.from && !range.to) {
      onRangeSelect(range);
      return;
    }

    // Caso 3: Tiene 'from' y 'to' (segundo click completado)
    if (range.from && range.to) {
      const nights = differenceInDays(range.to, range.from);
      if (nights < 1) {
        onRangeSelect({ from: range.from, to: undefined });
        return;
      }

      const disabledSet = new Set(disabledDates.map((d) => format(d, 'yyyy-MM-dd')));
      let hasConflict = false;
      let cursor = new Date(range.from);
      while (cursor < range.to) {
        const key = format(cursor, 'yyyy-MM-dd');
        if (disabledSet.has(key)) { hasConflict = true; break; }
        cursor = addDays(cursor, 1);
      }

      if (hasConflict) {
        const fromStr = format(range.from, 'yyyy-MM-dd');
        const availSet = new Set(availableDates.map((d) => format(d, 'yyyy-MM-dd')));
        const segments: string[][] = [];
        let seg: string[] = [];
        let cur = new Date(range.from);
        while (format(cur, 'yyyy-MM-dd') <= format(range.to, 'yyyy-MM-dd')) {
          const k = format(cur, 'yyyy-MM-dd');
          if (availSet.has(k)) { seg.push(k); } else { if (seg.length) { segments.push(seg); seg = []; } }
          cur = addDays(cur, 1);
        }
        if (seg.length) segments.push(seg);
        let best: string[] | null = null;
        for (const s of segments) { if (s[0] >= fromStr) { best = s; break; } }
        if (!best && segments.length) { best = segments.sort((a, b) => b.length - a.length)[0]; }
        if (best && best.length) {
          const start = parseISO(best[0]);
          const len = best.length;
          onRangeSelect({ from: start, to: addDays(start, len) });
          return;
        }
        onRangeSelect({ from: range.from, to: undefined });
        return;
      }

      onRangeSelect(range);
    }
  };

  // Modifiers para los estilos
  const modifiers = {
    booked: bookedDates,
    pending: pendingDates,
    blocked: blockedDates,
    available: availableDates,
    arrival: arrivalDates,
    departure: departureDates,
  };

  const modifiersStyles = {
    booked: {
      backgroundColor: '#7f1d1d',
      color: '#fca5a5',
      fontWeight: 'bold',
    },
    pending: {
      backgroundColor: '#78350f',
      color: '#fcd34d',
      fontWeight: 'bold',
    },
    blocked: {
      backgroundColor: '#374151',
      color: '#9ca3af',
      textDecoration: 'line-through',
    },
    available: {
      backgroundColor: '#065f46',
      color: '#6ee7b7',
    },
  };

  const modifiersClassNames = {
    arrival: 'day-arrival',
    departure: 'day-departure',
  };

  const CustomDayButton = ({ children, day, modifiers, ...buttonProps }: DayButtonProps) => {
    const ref = useRef<HTMLButtonElement>(null);
    useEffect(() => {
      if (modifiers.focused) {
        ref.current?.focus();
      }
    }, [modifiers.focused]);

    const dayStr = format(day.date, 'yyyy-MM-dd');
    const checkpoint = checkpointMap.get(dayStr);

    return (
      <button ref={ref} {...buttonProps}>
        <div className="flex h-full flex-col items-center justify-center text-center">
          <span>{children}</span>
          {checkpoint && (
            <span className="checkpoint-label mt-1">
              {checkpoint.label}
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="rounded-lg border border-dark-800 bg-dark-900 p-4">
      {/* Header con navegación de meses */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() =>
              setCurrentMonth((prev) =>
                prev.getTime() <= initialMonth.getTime() ? initialMonth : startOfMonth(addMonths(prev, -1))
              )
            }
            className="rounded-md p-2 text-gray-300 transition-colors hover:bg-dark-800 hover:text-primary-500 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Mes anterior"
            disabled={currentMonth.getTime() <= initialMonth.getTime()}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <h3 className="text-lg font-semibold capitalize text-white">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h3>

          <button
            onClick={() =>
              setCurrentMonth((prev) =>
                prev.getTime() >= maxMonth.getTime() ? maxMonth : startOfMonth(addMonths(prev, 1))
              )
            }
            className="rounded-md p-2 text-gray-300 transition-colors hover:bg-dark-800 hover:text-primary-500 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Mes siguiente"
            disabled={currentMonth.getTime() >= maxMonth.getTime()}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          {lastUpdated && (
            <span className="rounded border border-dark-700 px-2 py-1">
              Última actualización · {format(lastUpdated, "HH:mm:ss")}
            </span>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={isManualRefresh}
            className="inline-flex items-center gap-1 rounded border border-dark-700 px-3 py-1 text-sm text-gray-200 transition-colors hover:border-primary-500 hover:text-primary-300 disabled:opacity-50"
          >
            <RotateCw className={`h-4 w-4 ${isManualRefresh ? 'animate-spin' : ''}`} />
            {isManualRefresh ? 'Actualizando…' : 'Actualizar disponibilidad'}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <span className="ml-2 text-gray-400">Cargando disponibilidad...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-md border border-red-800 bg-red-950/50 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Calendario */}
      {!isLoading && !error && (
        <>
          <div className="calendar-dark">
            <DayPicker
              mode="range"
              selected={selectedRange}
              onSelect={handleRangeSelect}
              disabled={[
                { before: new Date() }, // Deshabilitar fechas pasadas
                ...disabledDates,
              ]}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              modifiersClassNames={modifiersClassNames}
              locale={es}
              month={currentMonth}
              onMonthChange={(month) => setCurrentMonth(clampMonth(month))}
              showOutsideDays={false}
              numberOfMonths={2}
              fromMonth={initialMonth}
              toMonth={maxMonth}
              components={{ DayButton: CustomDayButton }}
              className="mx-auto"
            />
          </div>

          {/* Leyenda */}
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-dark-800 pt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-emerald-900"></div>
              <span className="text-gray-400">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-yellow-900"></div>
              <span className="text-gray-400">Reserva temporal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-red-900"></div>
              <span className="text-gray-400">Reservado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-gray-700"></div>
              <span className="text-gray-400">No disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-amber-600"></div>
              <span className="text-gray-400">Check-in (llegan)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-orange-400"></div>
              <span className="text-gray-400">Check-out (se van)</span>
            </div>
          </div>
        </>
      )}

      {/* Estilos personalizados para tema oscuro */}
      <style jsx global>{`
        .calendar-dark .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #9d8f77;
          --rdp-background-color: #1a1a1a;
          --rdp-outline: 2px solid var(--rdp-accent-color);
        }
        
        .calendar-dark .rdp-months {
          display: flex;
          justify-content: center;
        }
        
        .calendar-dark .rdp-head_cell {
          color: #9ca3af;
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .calendar-dark .rdp-cell {
          padding: 2px;
        }
        
        .calendar-dark .rdp-day {
          color: #d1d5db;
          border-radius: 0.375rem;
        }
        
        .calendar-dark .rdp-day:hover:not(.rdp-day_disabled):not(.rdp-day_selected) {
          background-color: #374151;
        }
        
        .calendar-dark .rdp-day_selected:not(.rdp-day_disabled) {
          background-color: #9d8f77;
          color: #0a0a0a;
          font-weight: bold;
        }
        
        .calendar-dark .checkpoint-label {
          display: block;
          width: 100%;
          font-size: 10px;
          line-height: 1.1;
          color: #fef3c7;
          white-space: normal;
          word-break: break-word;
          overflow: hidden;
          text-overflow: ellipsis;
          max-height: 2.2em;
        }

        .calendar-dark .rdp-day.day-arrival {
          background-color: #92400e !important;
          color: #fff7ed !important;
          border: 1px solid #fbbf24;
        }

        .calendar-dark .rdp-day.day-departure {
          background-color: #b45309 !important;
          color: #fff7ed !important;
          border: 1px solid #f97316;
        }
        
        .calendar-dark .rdp-day_disabled {
          color: #4b5563;
          opacity: 0.5;
        }
        
        .calendar-dark .rdp-day_outside {
          color: #4b5563;
          opacity: 0.3;
        }
      `}</style>
    </div>
  );
}
