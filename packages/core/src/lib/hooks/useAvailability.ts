'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { buildHttpError, HttpResponseError, parseResponseBody } from '../utils/http';

interface CalendarCheckpoint {
  bookingId?: string;
  date: string;
  time: string;
  status: string;
}

interface OccupancyEntry {
  bookingId: string;
  status: string;
  startDate: string;
  endDate: string;
  arrivalTime: string;
  departureTime: string;
}

export interface AvailabilityData {
  available: string[];
  pending: string[];
  booked: string[];
  blocked: string[];
  arrivals: CalendarCheckpoint[];
  departures: CalendarCheckpoint[];
  occupancy?: OccupancyEntry[];
}

interface UseAvailabilityReturn {
  availability: AvailabilityData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para obtener la disponibilidad de una cabaña
 * 
 * @param cabinId - ID de la cabaña
 * @param currentMonth - Fecha del mes a consultar
 */
export function useAvailability(
  cabinId: string | null,
  currentMonth: Date,
  refreshToken = 0
): UseAvailabilityReturn {
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthKey = useMemo(
    () => `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`,
    [currentMonth]
  );

  const fetchAvailability = useCallback(async () => {
    if (!cabinId) return;

    setIsLoading(true);
    setError(null);

    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1; // getMonth() es 0-indexed

      const params = new URLSearchParams({
        cabinId,
        year: year.toString(),
        month: month.toString(),
        ts: Date.now().toString(),
      });

      const response = await fetch(`/api/availability?${params}`, {
        cache: 'no-store',
      });

      const parsed = await parseResponseBody<AvailabilityData>(response);

      if (!response.ok) {
        throw buildHttpError(response, parsed, 'Error al obtener disponibilidad');
      }

      if (!parsed.isJson || !parsed.data) {
        throw new HttpResponseError('Respuesta de disponibilidad inválida', response.status, parsed.text);
      }

      setAvailability(parsed.data);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [cabinId, monthKey]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability, refreshToken]);

  return {
    availability,
    isLoading,
    error,
    refetch: fetchAvailability,
  };
}
