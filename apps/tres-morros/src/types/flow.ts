export interface FlowOrderInput {
  bookingId: string;
  subject: string;
  amount: number;
  email: string;
  name: string;
  returnUrl: string;
  confirmationUrl: string;
}

export interface FlowOrderResponse {
  token: string;
  url: string;
  flowOrderId?: string;
}

export interface FlowWebhookPayload {
  status: "SUCCESS" | "REJECTED" | "CANCELED" | string;
  commerceOrder: string;
  flowOrderId: string;
  token: string;
  amount: number;
  email?: string;
  subject?: string;
}
