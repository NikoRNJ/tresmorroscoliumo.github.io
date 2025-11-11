import { NextResponse } from "next/server";
import { z } from "zod";
import { addMinutes } from "date-fns";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateBookingTotal } from "@/lib/pricing";
import { toDateOnly } from "@/lib/dates";

export const runtime = "nodejs";

const dateField = z
  .string()
  .min(10)
  .refine((value) => !Number.isNaN(Date.parse(value)), "Fecha inválida");

const schema = z.object({
  cabinSlug: z.string().min(1),
  startDate: dateField,
  endDate: dateField,
  partySize: z.number().int().min(1),
  includeJacuzzi: z.boolean().optional().default(false),
  guestName: z.string().min(3),
  guestEmail: z.string().email(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }

  const data = parsed.data;
  const start = toDateOnly(data.startDate);
  const end = toDateOnly(data.endDate);

  if (!(start < end)) {
    return NextResponse.json(
      { message: "El check-out debe ser posterior al check-in" },
      { status: 400 },
    );
  }

  const { data: cabin, error: cabinError } = await supabaseAdmin
    .from("cabin")
    .select("id, slug, name, nightly_rate, jacuzzi_rate, max_guests")
    .eq("slug", data.cabinSlug)
    .single();

  if (cabinError || !cabin) {
    return NextResponse.json({ message: "Cabina no encontrada" }, { status: 404 });
  }

  if (data.partySize > cabin.max_guests) {
    return NextResponse.json(
      { message: "Excede la capacidad permitida" },
      { status: 400 },
    );
  }

  const { data: overrides } = await supabaseAdmin
    .from("price_calendar")
    .select("date, nightly_rate")
    .eq("cabin_id", cabin.id)
    .gte("date", data.startDate.slice(0, 10))
    .lte("date", data.endDate.slice(0, 10));

  const quote = calculateBookingTotal({
    start,
    end,
    nightlyBase: Number(cabin.nightly_rate),
    includeJacuzzi: data.includeJacuzzi,
    jacuzziRate: Number(cabin.jacuzzi_rate),
    priceOverrides: overrides ?? [],
  });

  const expiresAt = addMinutes(new Date(), 20).toISOString();

  const { data: booking, error } = await supabaseAdmin
    .from("booking")
    .insert({
      cabin_id: cabin.id,
      cabin_slug: cabin.slug,
      guest_name: data.guestName,
      guest_email: data.guestEmail,
      guest_phone: data.phone ?? null,
      party_size: data.partySize,
      include_jacuzzi: data.includeJacuzzi,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      amount_total: quote.total,
      amount_breakdown: quote,
      status: "hold",
      currency: "CLP",
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error || !booking) {
    return NextResponse.json(
      { message: "No pudimos crear la reserva" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    bookingId: booking.id,
    amountTotal: quote.total,
    expiresAt,
  });
}
