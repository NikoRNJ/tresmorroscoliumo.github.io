import type { AvailabilityDay } from "./booking";

export interface AvailabilityResponse {
  month: string;
  days: AvailabilityDay[];
}

export interface HoldBookingResponse {
  bookingId: string;
  amountTotal: number;
  expiresAt: string;
}

export interface FlowCreateResponse {
  checkoutUrl: string;
  token: string;
}
