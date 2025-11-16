import { supabaseAdmin } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils/format';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Users 
} from 'lucide-react';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Database } from '@/types/database';

type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingWithCabin = Booking & {
  cabin: {
    title: string;
  };
};

/**
 * Calcular estadísticas del mes actual
 */
async function getMonthlyStats() {
  const now = new Date();
  const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(now), 'yyyy-MM-dd');

  // Ingresos del mes (reservas pagadas)
  const { data: paidBookings } = await supabaseAdmin
    .from('bookings')
    .select('amount_total')
    .eq('status', 'paid')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .returns<Array<{ amount_total: number }>>();

  const monthlyRevenue = paidBookings?.reduce((sum, b) => sum + b.amount_total, 0) || 0;

  // Reservas totales del mes
  const { count: totalBookings } = await supabaseAdmin
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'paid'])
    .gte('start_date', startDate);

  // Próximas reservas (próximos 7 días)
  const in7Days = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
  const { data: upcomingBookings } = await supabaseAdmin
    .from('bookings')
    .select('*, cabin:cabins(title)')
    .eq('status', 'paid')
    .gte('start_date', format(now, 'yyyy-MM-dd'))
    .lte('start_date', in7Days)
    .order('start_date', { ascending: true })
    .limit(5)
    .returns<Array<BookingWithCabin>>();

  // Tasa de ocupación (simplificada)
  const { data: allCabins } = await supabaseAdmin
    .from('cabins')
    .select('id')
    .eq('active', true)
    .returns<Array<{ id: string }>>();

  const totalCabins = allCabins?.length || 0;
  const daysInMonth = endOfMonth(now).getDate();
  const totalPossibleNights = totalCabins * daysInMonth;

  const { data: bookedNights } = await supabaseAdmin
    .from('bookings')
    .select('nights')
    .eq('status', 'paid')
    .gte('start_date', startDate)
    .lte('end_date', endDate)
    .returns<Array<{ nights: number }>>();

  const totalBookedNights = bookedNights?.reduce((sum, b) => sum + (b.nights || 0), 0) || 0;
  const occupancyRate = totalPossibleNights > 0 
    ? Math.round((totalBookedNights / totalPossibleNights) * 100) 
    : 0;

  return {
    monthlyRevenue,
    totalBookings: totalBookings || 0,
    upcomingBookings: upcomingBookings || [],
    occupancyRate,
  };
}

/**
 * Dashboard principal del admin
 */
export default async function AdminDashboard() {
  const stats = await getMonthlyStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Resumen de {format(new Date(), "MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Ingresos del mes */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingresos del Mes</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatPrice(stats.monthlyRevenue)}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Reservas del mes */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reservas del Mes</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.totalBookings}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Tasa de ocupación */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasa de Ocupación</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.occupancyRate}%
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Próximas llegadas */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Próximas Llegadas</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.upcomingBookings.length}
              </p>
              <p className="text-xs text-gray-500">En los próximos 7 días</p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Próximas Reservas */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900">Próximas Llegadas</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.upcomingBookings.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hay reservas próximas en los siguientes 7 días
            </div>
          ) : (
            stats.upcomingBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-6">
                <div>
                  <p className="font-semibold text-gray-900">{booking.customer_name}</p>
                  <p className="text-sm text-gray-600">{booking.cabin.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {format(parseISO(booking.start_date), "d 'de' MMMM", { locale: es })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {booking.nights} noche{booking.nights !== 1 ? 's' : ''} · {booking.party_size} personas
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
