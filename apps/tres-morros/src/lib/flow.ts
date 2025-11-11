import crypto from "node:crypto";
import type { FlowOrderInput, FlowOrderResponse, FlowWebhookPayload } from "@/types/flow";
import { env } from "./env";

const FLOW_SIGNATURE_HEADER = "x-flow-signature";

const buildSignature = (raw: string) =>
  crypto.createHmac("sha256", env.FLOW_API_SECRET).update(raw).digest("hex");

export async function createFlowOrder(
  payload: FlowOrderInput,
): Promise<FlowOrderResponse> {
  const body = {
    apiKey: env.FLOW_API_KEY,
    commerceId: env.FLOW_COMMERCE_ID,
    commerceOrder: payload.bookingId,
    subject: payload.subject,
    currency: "CLP",
    amount: Math.round(payload.amount),
    email: payload.email,
    name: payload.name,
    urlConfirmation: payload.confirmationUrl,
    urlReturn: payload.returnUrl,
  };

  const response = await fetch(`${env.FLOW_BASE_URL}/payment/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Flow-Signature": buildSignature(JSON.stringify(body)),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Flow create order failed: ${errorBody}`);
  }

  const data = (await response.json()) as {
    token: string;
    url: string;
    flowOrder?: string;
    flowOrderId?: string;
  };

  return {
    token: data.token,
    url: data.url,
    flowOrderId: data.flowOrderId ?? data.flowOrder,
  };
}

export function verifyFlowSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = buildSignature(rawBody);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

export function parseFlowWebhook(rawBody: string): FlowWebhookPayload {
  return JSON.parse(rawBody) as FlowWebhookPayload;
}

export { FLOW_SIGNATURE_HEADER };
