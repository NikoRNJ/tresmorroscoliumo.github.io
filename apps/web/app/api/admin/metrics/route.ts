import { NextResponse } from 'next/server';
import { addDays, startOfMonth } from 'date-fns';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type BookingStatus = Database['public']['Tables']['bookings']['Row']['status'];

export async function GET() {
  const isAdmin = await requireAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const startMonthIso = startOfMonth(now).toISOString();
  const sevenDaysAgo = addDays(now, -7).toISOString();
  const today = now.toISOString().slice(0, 10);
  const inSevenDays = addDays(now, 7).toISOString().slice(0, 10);

  async function countByStatus(status: BookingStatus) {
    const { count, error } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  const statusKeys: BookingStatus[] = ['pending', 'paid', 'expired', 'canceled'];
  const statusCountsPromise = Promise.all(
    statusKeys.map(async (status) => ({
      status,
      count: await countByStatus(status),
    }))
  );

  const revenuePromise = supabaseAdmin
    .from('bookings')
    .select('amount_total')
    .eq('status', 'paid')
    .gte('paid_at', startMonthIso)
    .returns<Array<{ amount_total: number }>>();

  const upcomingPromise = supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('status', 'paid')
    .gte('start_date', today)
    .lte('start_date', inSevenDays)
    .returns<Array<{ id: string }>>();

  const flowErrorsPromise = supabaseAdmin
    .from('api_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'flow_payment_error')
    .gte('created_at', sevenDaysAgo);

  const recentFlowPromise = supabaseAdmin
    .from('api_events')
    .select('id, created_at, error_message')
    .eq('event_type', 'flow_payment_error')
    .order('created_at', { ascending: false })
    .limit(5);

  const [
    statusRows,
    { data: revenueRows, error: revenueError },
    { data: upcomingRows, error: upcomingError },
    { count: flowErrorsCount, error: flowErrorsError },
    { data: recentFlowEvents, error: recentFlowError },
  ] = await Promise.all([
    statusCountsPromise,
    revenuePromise,
    upcomingPromise,
    flowErrorsPromise,
    recentFlowPromise,
  ]);

  if (revenueError || upcomingError || flowErrorsError || recentFlowError) {
    return NextResponse.json(
      { error: 'No se pudieron calcular las métricas' },
      { status: 500 }
    );
  }

  const statusCounts = statusRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = Number(row.count || 0);
    return acc;
  }, {});

  const monthlyRevenue =
    revenueRows?.reduce((sum, row) => sum + (Number(row.amount_total) || 0), 0) || 0;

  return NextResponse.json({
    statusCounts,
    monthlyRevenue,
    upcomingCheckins: upcomingRows?.length || 0,
    flowErrorsLast7Days: flowErrorsCount || 0,
    recentFlowEvents: recentFlowEvents || [],
    generatedAt: new Date().toISOString(),
  });
}

