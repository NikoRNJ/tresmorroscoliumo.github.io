import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  FLOW_SIGNATURE_HEADER,
  parseFlowWebhook,
  verifyFlowSignature,
} from "@/lib/flow";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get(FLOW_SIGNATURE_HEADER);

  if (!verifyFlowSignature(rawBody, signature)) {
    return NextResponse.json({ message: "Firma inválida" }, { status: 401 });
  }

  const payload = parseFlowWebhook(rawBody);
  const newStatus = payload.status === "SUCCESS" ? "paid" : "canceled";

  await supabaseAdmin
    .from("booking")
    .update({
      status: newStatus,
      flow_order_id: payload.flowOrderId,
      flow_token: payload.token,
      paid_at: newStatus === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", payload.commerceOrder);

  return NextResponse.json({ ok: true });
}
