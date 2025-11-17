'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, Clock, Loader2, Mail } from 'lucide-react';
import { formatPrice, formatDateRange } from '@/lib/utils/format';
import type { BookingWithMeta } from '@core/lib/data/bookings';

type PaymentStatus = 'checking' | 'success' | 'cancelled' | 'pending' | 'error';

const MAX_ATTEMPTS = 10;

interface PaymentConfirmationClientProps {
  bookingId: string;
  tokenFromQuery: string | null;
  initialBooking: BookingWithMeta | null;
}

export function PaymentConfirmationClient({
  bookingId,
  tokenFromQuery,
  initialBooking,
}: PaymentConfirmationClientProps) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingWithMeta | null>(initialBooking);
  const [status, setStatus] = useState<PaymentStatus>(() => {
    if (!bookingId) return 'error';
    if (initialBooking?.status === 'paid') return 'success';
    if (initialBooking?.status === 'canceled') return 'cancelled';
    return 'checking';
  });
  const [attempts, setAttempts] = useState(
    initialBooking?.status === 'paid' || initialBooking?.status === 'canceled'
      ? MAX_ATTEMPTS
      : 0
  );

  const tokenRef = useRef<string | null>(tokenFromQuery);

  useEffect(() => {
    if (!tokenRef.current && typeof window !== 'undefined') {
      tokenRef.current = sessionStorage.getItem('flowToken');
    }
  }, []);

  useEffect(() => {
    if (!bookingId) {
      router.push('/');
      return;
    }

    if (status !== 'checking' || attempts > MAX_ATTEMPTS) {
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        if (tokenRef.current && attempts === 0) {
          try {
            await fetch('/api/payments/flow/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: tokenRef.current, bookingId }),
            });
          } catch {}
        }

        const response = await fetch(`/api/bookings/${bookingId}`);

        if (!response.ok) {
          throw new Error('No se pudo verificar el estado del pago');
        }

        const data = await response.json();
        const fetchedBooking = data.booking as BookingWithMeta | undefined;

        if (fetchedBooking) {
          setBooking(fetchedBooking);
        }

        if (fetchedBooking?.status === 'paid') {
          setStatus('success');
        } else if (fetchedBooking?.status === 'canceled') {
          setStatus('cancelled');
        } else if (attempts >= MAX_ATTEMPTS) {
          setStatus('pending');
        } else {
          setAttempts((prev) => prev + 1);
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
        if (attempts >= MAX_ATTEMPTS) {
          setStatus('error');
        } else {
          setAttempts((prev) => prev + 1);
        }
      }
    };

    checkPaymentStatus();

    if (attempts < MAX_ATTEMPTS) {
      const interval = setInterval(checkPaymentStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [bookingId, attempts, status, router]);

  if (status === 'checking') {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-blue-950 border border-blue-800 p-4">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white">Verificando pago...</h1>
          <p className="mb-8 text-lg text-gray-400">
            Estamos confirmando tu pago con Webpay. Por favor espera un momento.
          </p>
          <p className="text-sm text-gray-500">
            Intento {Math.min(attempts + 1, MAX_ATTEMPTS)} de {MAX_ATTEMPTS}
          </p>
        </div>
      </Container>
    );
  }

  if (status === 'success' && booking) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-green-950 border border-green-800 p-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <h1 className="mb-4 text-3xl font-bold text-white">¡Pago confirmado!</h1>
            <p className="text-lg text-gray-400">
              Tu reserva ha sido confirmada exitosamente.
            </p>
          </div>

          <div className="rounded-lg border border-dark-800 bg-dark-900 p-8 mb-6">
            <h2 className="text-xl font-bold text-white mb-6">Detalles de tu reserva</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Número de reserva</p>
                <p className="text-lg font-mono font-semibold text-white">{booking.id}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Cabaña</p>
                <p className="text-lg font-semibold text-white">{booking.cabin.title}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Fechas</p>
                <p className="text-lg font-semibold text-white">
                  {formatDateRange(booking.start_date, booking.end_date)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Personas</p>
                <p className="text-lg font-semibold text-white">{booking.party_size}</p>
              </div>

              {booking.jacuzzi_days.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400">Días con jacuzzi</p>
                  <p className="text-lg font-semibold text-white">
                    {booking.jacuzzi_days.length}
                  </p>
                </div>
              )}

              <div className="border-t border-dark-800 pt-4">
                <p className="text-sm text-gray-400">Total pagado</p>
                <p className="text-3xl font-bold text-green-500">
                  {formatPrice(booking.amount_total)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-blue-950 border border-blue-800 p-4 mb-6">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-300">
                <p className="font-semibold text-blue-200">Confirmación enviada</p>
                <p className="mt-1">
                  Hemos enviado un email de confirmación a{' '}
                  <strong>{booking.customer_email}</strong> con todos los detalles de tu reserva.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-dark-800 border border-dark-700 p-4 mb-6">
            <h3 className="font-semibold text-white mb-2">Siguiente paso</h3>
            <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
              <li>Revisa tu email para más detalles</li>
              <li>Check-in: 15:00 hrs el día de inicio</li>
              <li>Check-out: 12:00 hrs el día de término</li>
              <li>Ante cualquier duda, contáctanos</li>
            </ul>
          </div>

          <Button onClick={() => router.push('/')} className="w-full" size="lg">
            Volver al inicio
          </Button>
        </div>
      </Container>
    );
  }

  if (status === 'cancelled' && booking) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-yellow-950 border border-yellow-800 p-4">
              <XCircle className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white">Pago cancelado</h1>
          <p className="mb-8 text-lg text-gray-400">
            El pago fue cancelado. Tu reserva sigue activa por unos minutos más si deseas intentar
            nuevamente.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => router.push(`/pago?booking=${bookingId}`)}>
              Intentar nuevamente
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/cabanas/${booking.cabin.slug}`)}
            >
              Volver a la cabaña
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  if (status === 'pending' && booking) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-blue-950 border border-blue-800 p-4">
              <Clock className="h-12 w-12 text-blue-500" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white">Pago en proceso</h1>
          <p className="mb-8 text-lg text-gray-400">
            Tu pago está siendo procesado. Te enviaremos un email una vez confirmado.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Número de reserva: <span className="font-mono">{bookingId}</span>
          </p>
          <Button onClick={() => router.push('/')}>Volver al inicio</Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-950 border border-red-800 p-4">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>
        <h1 className="mb-4 text-3xl font-bold text-white">Error al verificar el pago</h1>
        <p className="mb-8 text-lg text-gray-400">
          No pudimos verificar el estado de tu pago. Por favor revisa tu email o contáctanos.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
          <Button variant="outline" onClick={() => router.push('/')}>
            Volver al inicio
          </Button>
        </div>
      </div>
    </Container>
  );
}


