import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { env } from "@/lib/env";
import { createFlowOrder } from "@/lib/flow";

export const runtime = "nodejs";

const schema = z.object({
  bookingId: z.string().uuid(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }

  const { bookingId } = parsed.data;

  const { data: booking } = await supabaseAdmin
    .from("booking")
    .select(
      "id, status, expires_at, guest_email, guest_name, amount_total, cabin_slug",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ message: "Reserva no encontrada" }, { status: 404 });
  }

  if (booking.expires_at && new Date(booking.expires_at) < new Date()) {
    await supabaseAdmin
      .from("booking")
      .update({ status: "expired" })
      .eq("id", bookingId);
    return NextResponse.json(
      { message: "La reserva caducó, inicia nuevamente" },
      { status: 410 },
    );
  }

  const flowOrder = await createFlowOrder({
    bookingId,
    subject: `Reserva ${booking.cabin_slug}`,
    amount: Number(booking.amount_total),
    email: booking.guest_email,
    name: booking.guest_name,
    confirmationUrl: `${env.NEXT_PUBLIC_SITE_URL}/api/payments/flow/webhook`,
    returnUrl: `${env.NEXT_PUBLIC_SITE_URL}/gracias?bookingId=${booking.id}`,
  });

  await supabaseAdmin
    .from("booking")
    .update({
      status: "pending",
      flow_order_id: flowOrder.flowOrderId ?? bookingId,
      flow_token: flowOrder.token,
    })
    .eq("id", bookingId);

  return NextResponse.json({
    checkoutUrl: flowOrder.url,
    token: flowOrder.token,
  });
}
