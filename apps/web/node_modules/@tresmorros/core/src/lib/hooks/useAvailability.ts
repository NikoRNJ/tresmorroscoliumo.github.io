'use client';

import { useState, useEffect } from 'react';

interface CalendarCheckpoint {
  date: string;
  time: string;
  status: string;
}

interface AvailabilityData {
  available: string[];
  pending: string[];
  booked: string[];
  blocked: string[];
  arrivals: CalendarCheckpoint[];
  departures: CalendarCheckpoint[];
}

interface UseAvailabilityReturn {
  availability: AvailabilityData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook para obtener la disponibilidad de una cabaña
 * 
 * @param cabinId - ID de la cabaña
 * @param currentMonth - Fecha del mes a consultar
 */
export function useAvailability(
  cabinId: string | null,
  currentMonth: Date
): UseAvailabilityReturn {
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = async () => {
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
      });

      const response = await fetch(`/api/availability?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener disponibilidad');
      }

      const data: AvailabilityData = await response.json();
      setAvailability(data);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cabinId, currentMonth.getMonth(), currentMonth.getFullYear()]);

  return {
    availability,
    isLoading,
    error,
    refetch: fetchAvailability,
  };
}
