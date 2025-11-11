"use client";

import { Calendar } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useMemo, useState } from "react";
import type { AvailabilityDay } from "@/types/booking";

interface Props {
  month: number;
  year: number;
  availability: AvailabilityDay[] | null;
  onMonthChange?: (date: Date) => void;
}

const stateColors = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-rose-500",
};

export const CabinCalendar = ({
  month,
  year,
  availability,
  onMonthChange,
}: Props) => {
  const [value, setValue] = useState<Date | undefined>();

  const dayState = useMemo(() => {
    if (!availability) return new Map<string, string>();
    return new Map(availability.map((day) => [day.date, day.state]));
  }, [availability]);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <Calendar
        date={value}
        showMonthAndYearPickers={false}
        shownDate={new Date(year, month - 1, 1)}
        onChange={setValue}
        onShownDateChange={(date) => onMonthChange?.(date)}
        dayContentRenderer={(date) => {
          const iso = date.toISOString().slice(0, 10);
          const state = dayState.get(iso) ?? "green";
          return (
            <div className="flex flex-col items-center gap-1">
              <span>{date.getDate()}</span>
              <span
                className={`h-2 w-2 rounded-full ${stateColors[state as keyof typeof stateColors]}`}
              />
            </div>
          );
        }}
      />
      <div className="mt-4 flex gap-4 text-sm text-slate-600">
        {Object.entries(stateColors).map(([state, color]) => (
          <div key={state} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            <span className="capitalize">{state}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
