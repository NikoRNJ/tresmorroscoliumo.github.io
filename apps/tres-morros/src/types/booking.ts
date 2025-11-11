export type BookingStatus =
  | "draft"
  | "hold"
  | "pending"
  | "paid"
  | "canceled"
  | "expired";

export type AvailabilityColor = "green" | "yellow" | "red";

export interface BookingRecord {
  id: string;
  cabin_id: string;
  cabin_slug: string;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  expires_at: string | null;
}

export interface AdminBlockRecord {
  id: string;
  cabin_id: string;
  cabin_slug: string;
  start_date: string;
  end_date: string;
  reason: string | null;
}

export interface AvailabilityDay {
  date: string;
  state: AvailabilityColor;
  reason?: string;
}
