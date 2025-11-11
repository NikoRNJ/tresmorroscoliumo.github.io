"use client";

import { useState } from "react";
import { CabinCalendar } from "./CabinCalendar";
import { useAvailability } from "@/hooks/useAvailability";

interface Props {
  cabinSlug: string;
}

export const CabinAvailabilityPanel = ({ cabinSlug }: Props) => {
  const [visibleDate, setVisibleDate] = useState(() => new Date());
  const { data, isLoading, error } = useAvailability({
    cabinSlug,
    month: visibleDate.getMonth() + 1,
    year: visibleDate.getFullYear(),
  });

  return (
    <div className="space-y-4">
      <CabinCalendar
        month={visibleDate.getMonth() + 1}
        year={visibleDate.getFullYear()}
        availability={data}
        onMonthChange={(date) => setVisibleDate(date)}
      />
      {isLoading && (
        <p className="text-sm text-slate-500">Actualizando calendario...</p>
      )}
      {error && (
        <p className="text-sm text-rose-500">
          Error al cargar disponibilidad: {error}
        </p>
      )}
    </div>
  );
};
