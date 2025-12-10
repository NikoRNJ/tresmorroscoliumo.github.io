import { NextResponse } from 'next/server';
import { addDays, startOfMonth, format, subDays } from 'date-fns';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type BookingStatus = Database['public']['Tables']['bookings']['Row']['status'];

/**
 * API de métricas del panel de administración
 * Incluye estadísticas de reservas Y visitantes únicos
 */
export async function GET() {
  const isAdmin = await requireAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const startMonthIso = startOfMonth(now).toISOString();
  const sevenDaysAgo = addDays(now, -7).toISOString();
  const today = format(now, 'yyyy-MM-dd');
  const inSevenDays = format(addDays(now, 7), 'yyyy-MM-dd');

  // ============================================
  // MÉTRICAS DE RESERVAS
  // ============================================

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

  // ============================================
  // MÉTRICAS DE VISITANTES
  // ============================================

  // Visitantes únicos hoy
  const todayVisitorsPromise = supabaseAdmin
    .from('site_visits')
    .select('ip_hash')
    .eq('visit_date', today)
    .returns<Array<{ ip_hash: string }>>();

  // Visitantes únicos últimos 7 días
  const last7DaysVisitorsPromise = supabaseAdmin
    .from('site_visits')
    .select('ip_hash, visit_date')
    .gte('visit_date', format(subDays(now, 7), 'yyyy-MM-dd'))
    .returns<Array<{ ip_hash: string; visit_date: string }>>();

  // Visitantes únicos del mes
  const monthlyVisitorsPromise = supabaseAdmin
    .from('site_visits')
    .select('ip_hash')
    .gte('visit_date', format(startOfMonth(now), 'yyyy-MM-dd'))
    .returns<Array<{ ip_hash: string }>>();

  // Top páginas visitadas (últimos 7 días)
  const topPagesPromise = supabaseAdmin
    .from('site_visits')
    .select('path')
    .gte('visit_date', format(subDays(now, 7), 'yyyy-MM-dd'))
    .returns<Array<{ path: string }>>();

  // Distribución de dispositivos (últimos 7 días)
  const devicesPromise = supabaseAdmin
    .from('site_visits')
    .select('device_type')
    .gte('visit_date', format(subDays(now, 7), 'yyyy-MM-dd'))
    .returns<Array<{ device_type: string | null }>>();

  // ============================================
  // EJECUTAR TODAS LAS QUERIES EN PARALELO
  // ============================================

  const [
    statusRows,
    { data: revenueRows, error: revenueError },
    { data: upcomingRows, error: upcomingError },
    { count: flowErrorsCount, error: flowErrorsError },
    { data: recentFlowEvents, error: recentFlowError },
    { data: todayVisitors, error: todayVisitorsError },
    { data: last7DaysVisitors, error: last7DaysError },
    { data: monthlyVisitors, error: monthlyVisitorsError },
    { data: topPages, error: topPagesError },
    { data: devices, error: devicesError },
  ] = await Promise.all([
    statusCountsPromise,
    revenuePromise,
    upcomingPromise,
    flowErrorsPromise,
    recentFlowPromise,
    todayVisitorsPromise,
    last7DaysVisitorsPromise,
    monthlyVisitorsPromise,
    topPagesPromise,
    devicesPromise,
  ]);

  if (revenueError || upcomingError || flowErrorsError || recentFlowError) {
    return NextResponse.json(
      { error: 'No se pudieron calcular las métricas de reservas' },
      { status: 500 }
    );
  }

  // Calcular métricas de reservas
  const statusCounts = statusRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = Number(row.count || 0);
    return acc;
  }, {});

  const monthlyRevenue =
    revenueRows?.reduce((sum, row) => sum + (Number(row.amount_total) || 0), 0) || 0;

  // ============================================
  // CALCULAR MÉTRICAS DE VISITANTES
  // ============================================

  // Visitantes únicos (usando Set para eliminar duplicados)
  const uniqueTodayVisitors = new Set(todayVisitors?.map(v => v.ip_hash) || []).size;
  const uniqueMonthlyVisitors = new Set(monthlyVisitors?.map(v => v.ip_hash) || []).size;

  // Visitantes únicos por día (últimos 7 días)
  const visitorsByDay: Record<string, number> = {};
  const uniqueIPsLast7Days = new Set<string>();

  (last7DaysVisitors || []).forEach(visit => {
    uniqueIPsLast7Days.add(visit.ip_hash);
    if (!visitorsByDay[visit.visit_date]) {
      visitorsByDay[visit.visit_date] = 0;
    }
    // Contar visitas totales por día
    visitorsByDay[visit.visit_date]++;
  });

  const uniqueWeeklyVisitors = uniqueIPsLast7Days.size;

  // Top páginas (contar frecuencia)
  const pageCounts: Record<string, number> = {};
  (topPages || []).forEach(p => {
    const normalizedPath = p.path || '/';
    pageCounts[normalizedPath] = (pageCounts[normalizedPath] || 0) + 1;
  });

  const topPagesRanked = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([path, count]) => ({ path, visits: count }));

  // Distribución de dispositivos
  const deviceCounts: Record<string, number> = {};
  (devices || []).forEach(d => {
    const type = d.device_type || 'unknown';
    deviceCounts[type] = (deviceCounts[type] || 0) + 1;
  });

  // Calcular total de visitas (no únicas)
  const totalVisitsToday = todayVisitors?.length || 0;
  const totalVisits7Days = last7DaysVisitors?.length || 0;

  return NextResponse.json({
    // Métricas de reservas (existentes)
    statusCounts,
    monthlyRevenue,
    upcomingCheckins: upcomingRows?.length || 0,
    flowErrorsLast7Days: flowErrorsCount || 0,
    recentFlowEvents: recentFlowEvents || [],

    // Métricas de visitantes (nuevas)
    visitors: {
      today: {
        unique: uniqueTodayVisitors,
        total: totalVisitsToday,
      },
      week: {
        unique: uniqueWeeklyVisitors,
        total: totalVisits7Days,
      },
      month: {
        unique: uniqueMonthlyVisitors,
      },
      byDay: visitorsByDay,
      topPages: topPagesRanked,
      devices: deviceCounts,
    },

    generatedAt: new Date().toISOString(),
  });
}
