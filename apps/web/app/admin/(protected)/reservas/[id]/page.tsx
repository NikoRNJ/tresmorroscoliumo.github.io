import { supabaseAdmin } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatPrice, formatDate } from '@/lib/utils/format';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, Calendar, Home, CreditCard } from 'lucide-react';
import type { Database } from '@/types/database';

type Booking = Database['public']['Tables']['bookings']['Row'];
type Cabin = Database['public']['Tables']['cabins']['Row'];
type BookingWithCabin = Booking & {
  cabin: Cabin;
};

/**
 * Página de detalle de una reserva
 */
export default async function AdminBookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('*, cabin:cabins(*)')
    .eq('id', params.id)
    .limit(1)
    .returns<Array<BookingWithCabin>>();

  const booking = bookings?.[0];

  if (error || !booking) {
    notFound();
  }

  // Extras: toallas desde api_events (hold creado)
  let towelsCount = 0;
  try {
    const { data: events } = await supabaseAdmin
      .from('api_events')
      .select('payload')
      .eq('booking_id', params.id)
      .eq('event_type', 'booking_hold_created')
      .limit(1);
    const payload = (events?.[0] as any)?.payload;
    if (payload && typeof payload.towels_count === 'number') {
      towelsCount = Math.max(0, Math.min(7, payload.towels_count));
    }
  } catch {}

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      paid: 'bg-green-100 text-green-800 border-green-200',
      expired: 'bg-gray-100 text-gray-800 border-gray-200',
      canceled: 'bg-red-100 text-red-800 border-red-200',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendiente de Pago',
      paid: 'Pagada y Confirmada',
      expired: 'Hold Expirado',
      canceled: 'Cancelada',
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/admin/reservas"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a reservas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Reserva #{booking.id.substring(0, 8).toUpperCase()}
            </h1>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getStatusBadge(
                booking.status
              )}`}
            >
              {getStatusLabel(booking.status)}
            </span>
          </div>
          <p className="mt-2 text-gray-600">
            Creada el {formatDate(booking.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Información del Cliente</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium text-gray-900">{booking.customer_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a
                    href={`mailto:${booking.customer_email}`}
                    className="font-medium text-primary-600 hover:text-primary-700"
                  >
                    {booking.customer_email}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <a
                    href={`tel:${booking.customer_phone}`}
                    className="font-medium text-gray-900"
                  >
                    {booking.customer_phone}
                  </a>
                </div>
              </div>
              {booking.customer_notes && (
                <div className="mt-4 rounded-md bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700">Notas del cliente:</p>
                  <p className="mt-1 text-sm text-gray-600">{booking.customer_notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Booking details */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Detalles de la Reserva</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Home className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Cabaña</p>
                  <Link
                    href={`/cabanas/${booking.cabin.slug}`}
                    target="_blank"
                    className="font-medium text-primary-600 hover:text-primary-700"
                  >
                    {booking.cabin.title}
                  </Link>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Fechas de estadía</p>
                  <p className="font-medium text-gray-900">
                    {format(parseISO(booking.start_date), "d 'de' MMMM", { locale: es })} -{' '}
                    {format(parseISO(booking.end_date), "d 'de' MMMM yyyy", { locale: es })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {booking.nights} noche{booking.nights !== 1 ? 's' : ''} · {booking.party_size}{' '}
                    persona{booking.party_size !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {booking.jacuzzi_days && Array.isArray(booking.jacuzzi_days) && booking.jacuzzi_days.length > 0 && (
                <div className="rounded-md bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-900">
                    Jacuzzi solicitado para {booking.jacuzzi_days.length} día
                    {booking.jacuzzi_days.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
              {towelsCount > 0 && (
                <div className="rounded-md bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">
                    Toallas adicionales: {towelsCount} ( ${formatPrice(towelsCount * 2000)} )
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Payment info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <CreditCard className="h-5 w-5" />
              Información de Pago
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Precio base:</span>
                <span className="font-medium text-gray-900">
                  {formatPrice(booking.amount_base)}
                </span>
              </div>
              {booking.amount_jacuzzi > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Jacuzzi:</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(booking.amount_jacuzzi)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatPrice(booking.amount_total)}
                  </span>
                </div>
              </div>
              {booking.flow_order_id && (
                <div className="mt-4 rounded-md bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Flow Order ID:</p>
                  <p className="font-mono text-sm font-medium text-gray-900">
                    {booking.flow_order_id}
                  </p>
                </div>
              )}
              {booking.paid_at && (
                <div className="rounded-md bg-green-50 p-3">
                  <p className="text-xs text-green-700">Pagado el:</p>
                  <p className="text-sm font-medium text-green-900">
                    {formatDate(booking.paid_at)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Historial</h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Reserva creada</p>
                  <p className="text-xs text-gray-500">{formatDate(booking.created_at)}</p>
                </div>
              </div>
              {booking.paid_at && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-green-600"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pago confirmado</p>
                    <p className="text-xs text-gray-500">{formatDate(booking.paid_at)}</p>
                  </div>
                </div>
              )}
              {booking.canceled_at && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-red-600"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Cancelada</p>
                    <p className="text-xs text-gray-500">{formatDate(booking.canceled_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
