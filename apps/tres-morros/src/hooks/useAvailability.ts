import { useEffect, useState } from "react";
import type { AvailabilityDay } from "@/types/booking";

interface Options {
  cabinSlug: string;
  year: number;
  month: number;
}

export const useAvailability = ({ cabinSlug, year, month }: Options) => {
  const [data, setData] = useState<AvailabilityDay[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    const search = new URLSearchParams({
      cabinSlug,
      year: String(year),
      month: String(month),
    });

    fetch(`/api/bookings/availability?${search.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("No se pudo cargar la disponibilidad");
        }
        return (await res.json()) as { days: AvailabilityDay[] };
      })
      .then((json) => {
        if (!ignore) {
          setData(json.days);
        }
      })
      .catch((err) => {
        if (!ignore && err.name !== "AbortError") {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [cabinSlug, year, month]);

  return { data, isLoading, error };
};
