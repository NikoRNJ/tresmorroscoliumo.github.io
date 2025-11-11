import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { endOfMonth, startOfMonth } from "date-fns";
import { supabaseAdmin } from "@/lib/supabase";
import { buildAvailabilityCalendar } from "@/lib/availability";
import type { BookingRecord, AdminBlockRecord } from "@/types/booking";

export const runtime = "nodejs";

const schema = z.object({
  cabinSlug: z.string().min(1),
  year: z.coerce.number().int().min(2023),
  month: z.coerce.number().int().min(1).max(12),
});

export async function GET(request: NextRequest) {
  const params = schema.safeParse({
    cabinSlug: request.nextUrl.searchParams.get("cabinSlug"),
    year: request.nextUrl.searchParams.get("year"),
    month: request.nextUrl.searchParams.get("month"),
  });

  if (!params.success) {
    return NextResponse.json(params.error.flatten(), { status: 400 });
  }

  const { cabinSlug, year, month } = params.data;
  const rangeStart = startOfMonth(new Date(year, month - 1));
  const rangeEnd = endOfMonth(rangeStart);

  const { data: bookings } = await supabaseAdmin
    .from("booking")
    .select("id, cabin_id, cabin_slug, start_date, end_date, status, expires_at")
    .eq("cabin_slug", cabinSlug)
    .lte("start_date", rangeEnd.toISOString())
    .gte("end_date", rangeStart.toISOString());

  const { data: blocks } = await supabaseAdmin
    .from("admin_block")
    .select("id, cabin_slug, start_date, end_date, reason")
    .eq("cabin_slug", cabinSlug)
    .lte("start_date", rangeEnd.toISOString())
    .gte("end_date", rangeStart.toISOString());

  const calendar = buildAvailabilityCalendar({
    start: rangeStart,
    end: rangeEnd,
    bookings: (bookings ?? []) as BookingRecord[],
    adminBlocks: (blocks ?? []) as AdminBlockRecord[],
  });

  return NextResponse.json({
    month: rangeStart.toISOString().slice(0, 7),
    days: calendar,
  });
}
