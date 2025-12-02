import { supabaseAdmin } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils/format';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { Database } from '@/types/database';

type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingWithCabin = Booking & {
  cabin: {
    title: string;
    slug: string;
  };
};

/**
 * Página de listado de reservas
 */
export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const statusFilter = searchParams.status || 'all';

  // Construir query
  let query = supabaseAdmin
    .from('bookings')
    .select('*, cabin:cabins(title, slug)')
    .order('created_at', { ascending: false });

  // Aplicar filtro de estado
  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: bookings, error } = await query.returns<Array<BookingWithCabin>>();

  if (error) {
    console.error('Error fetching bookings:', error);
  }

  // Badges de estado
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      canceled: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendiente',
      paid: 'Pagada',
      expired: 'Expirada',
      canceled: 'Cancelada',
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
          <p className="mt-2 text-gray-600">
            Gestiona todas las reservas del sistema
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'Todas' },
          { value: 'paid', label: 'Pagadas' },
          { value: 'pending', label: 'Pendientes' },
          { value: 'expired', label: 'Expiradas' },
          { value: 'canceled', label: 'Canceladas' },
        ].map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/reservas?status=${filter.value}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === filter.value
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Referencia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Cabaña
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fechas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {!bookings || bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No hay reservas{statusFilter !== 'all' ? ` con estado "${getStatusLabel(statusFilter)}"` : ''}
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="font-mono text-sm font-medium text-gray-900">
                      {booking.id.substring(0, 8).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.customer_name}
                    </div>
                    <div className="text-sm text-gray-500">{booking.customer_email}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {booking.cabin.title}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {format(parseISO(booking.start_date), 'd MMM', { locale: es })} -{' '}
                      {format(parseISO(booking.end_date), 'd MMM yyyy', { locale: es })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {booking.nights} noche{booking.nights !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {formatPrice(booking.amount_total)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(
                        booking.status
                      )}`}
                    >
                      {getStatusLabel(booking.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <Link
                      href={`/admin/reservas/${booking.id}`}
                      className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
                    >
                      Ver detalles
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
