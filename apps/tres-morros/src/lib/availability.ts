import { eachDayOfInterval, isWithinInterval, parseISO, subDays } from "date-fns";
import type {
  AdminBlockRecord,
  AvailabilityDay,
  BookingRecord,
  BookingStatus,
} from "@/types/booking";
import { toDateOnly } from "./dates";

const blockingStatuses: BookingStatus[] = ["paid", "pending"];
const softBlockingStatuses: BookingStatus[] = ["hold"];

const isActiveHold = (booking: BookingRecord, now: Date) => {
  if (booking.status !== "hold") return false;
  if (!booking.expires_at) return true;
  return parseISO(booking.expires_at) > now;
};

export const buildAvailabilityCalendar = ({
  start,
  end,
  bookings,
  adminBlocks,
}: {
  start: Date;
  end: Date;
  bookings: BookingRecord[];
  adminBlocks: AdminBlockRecord[];
}): AvailabilityDay[] => {
  const today = new Date();
  const days = eachDayOfInterval({ start, end });

  return days.map((day) => {
    const iso = day.toISOString().slice(0, 10);

    const block = adminBlocks.find((item) => {
      const startDate = toDateOnly(item.start_date);
      const endDate = toDateOnly(item.end_date);
      return isWithinInterval(day, {
        start: startDate,
        end: endDate,
      });
    });

    if (block) {
      return { date: iso, state: "red", reason: block.reason ?? "Bloqueado" };
    }

    const booking = bookings.find((item) => {
      const startDate = toDateOnly(item.start_date);
      const endDate = subDays(toDateOnly(item.end_date), 1);
      if (endDate < startDate) return false;
      return isWithinInterval(day, {
        start: startDate,
        end: endDate,
      });
    });

    if (!booking) {
      return { date: iso, state: "green" };
    }

    if (blockingStatuses.includes(booking.status)) {
      return { date: iso, state: "red", reason: "Reservado" };
    }

    if (
      softBlockingStatuses.includes(booking.status) &&
      isActiveHold(booking, today)
    ) {
      return { date: iso, state: "yellow", reason: "Hold en proceso" };
    }

    return { date: iso, state: "green" };
  });
};
