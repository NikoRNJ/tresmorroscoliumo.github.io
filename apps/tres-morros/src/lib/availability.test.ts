import type { BookingRecord, AdminBlockRecord } from "@/types/booking";
import { buildAvailabilityCalendar } from "./availability";
import { toDateOnly } from "./dates";

const booking: BookingRecord = {
  id: "1",
  cabin_id: "",
  cabin_slug: "laguna-norte",
  start_date: "2025-03-10",
  end_date: "2025-03-13",
  status: "paid",
  expires_at: null,
};

describe("buildAvailabilityCalendar", () => {
  it("marks booked nights as red", () => {
    const days = buildAvailabilityCalendar({
      start: toDateOnly("2025-03-09"),
      end: toDateOnly("2025-03-13"),
      bookings: [booking],
      adminBlocks: [],
    });

    const reserved = days.filter((day) => day.state === "red");
    expect(reserved).toHaveLength(3);
  });

  it("marks holds as yellow when not expired", () => {
    const hold: BookingRecord = {
      ...booking,
      id: "hold",
      start_date: "2025-04-01",
      end_date: "2025-04-03",
      status: "hold",
      expires_at: new Date(Date.now() + 10 * 60000).toISOString(),
    };
    const days = buildAvailabilityCalendar({
      start: toDateOnly("2025-04-01"),
      end: toDateOnly("2025-04-02"),
      bookings: [hold],
      adminBlocks: [],
    });

    expect(days.every((day) => day.state === "yellow")).toBe(true);
  });

  it("overrides bookings with admin blocks", () => {
    const block: AdminBlockRecord = {
      id: "block",
      cabin_id: "",
      cabin_slug: "laguna-norte",
      start_date: "2025-05-05",
      end_date: "2025-05-06",
      reason: "Mantención",
    };

    const days = buildAvailabilityCalendar({
      start: toDateOnly("2025-05-04"),
      end: toDateOnly("2025-05-06"),
      bookings: [],
      adminBlocks: [block],
    });

    expect(days.filter((day) => day.state === "red")).toHaveLength(2);
  });
});
