'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Clock, CheckCircle, CreditCard, AlertTriangle } from 'lucide-react';
import { formatPrice, formatDateRange } from '@/lib/utils/format';
import type { BookingWithMeta } from '@core/lib/data/bookings';

interface PaymentPageClientProps {
  booking: BookingWithMeta;
}

export function PaymentPageClient({ booking }: PaymentPageClientProps) {
  const router = useRouter();

  const [bookingState] = useState(booking);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(booking.timeRemaining ?? 0);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const handlePayment = async () => {
    if (!bookingState.id) return;

    setPaying(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/flow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: bookingState.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data?.paymentUrl) {
          try {
            if (data.token) sessionStorage.setItem('flowToken', data.token);
          } catch {}

          window.location.href = data.paymentUrl;
          return;
        }

        const flowError = new Error(data?.error || 'Error al crear el pago') as Error & {
          code?: string;
          status?: number;
        };
        flowError.code = data?.code;
        flowError.status = response.status;
        throw flowError;
      }

      const { paymentUrl, token } = data;

      if (!paymentUrl) {
        throw new Error('Flow no retornó la URL de pago');
      }

      try {
        if (token) sessionStorage.setItem('flowToken', token);
      } catch {}

      window.location.href = paymentUrl;
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && (err as any).code === 'FLOW_AUTH_ERROR') {
        setError(
          'La pasarela de Flow rechazó las credenciales configuradas. Nuestro equipo ya fue notificado; intenta nuevamente más tarde o contáctanos.'
        );
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
      setPaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!bookingState) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-950 border border-red-800 p-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white">Reserva no encontrada</h1>
          <p className="mb-8 text-lg text-gray-400">
            No pudimos encontrar los datos de tu reserva. Verifica el enlace o intenta nuevamente.
          </p>
          <Button onClick={() => router.push('/')}>Volver al inicio</Button>
        </div>
      </Container>
    );
  }

  const jacuzziDays = Array.isArray(bookingState.jacuzzi_days)
    ? bookingState.jacuzzi_days
    : [];

  if (bookingState.isExpired || bookingState.status === 'expired') {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-950 border border-red-800 p-4">
              <Clock className="h-12 w-12 text-red-500" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white">Reserva expirada</h1>
          <p className="mb-8 text-lg text-gray-400">
            Lo sentimos, tu reserva ha expirado. Por favor intenta reservar nuevamente.
          </p>
          <Button onClick={() => router.push(`/cabanas/${bookingState.cabin.slug}`)}>
            Volver a reservar
          </Button>
        </div>
      </Container>
    );
  }

  if (bookingState.status === 'paid') {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-green-950 border border-green-800 p-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white">¡Pago confirmado!</h1>
          <p className="mb-8 text-lg text-gray-400">
            Tu reserva ya ha sido pagada exitosamente.
          </p>
          <Button onClick={() => router.push('/')}>Volver al inicio</Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl">
        <div
          className={`mb-8 rounded-lg border-2 p-4 ${
            timeLeft < 900 ? 'border-red-700 bg-red-950' : 'border-yellow-700 bg-yellow-950'
          }`}
        >
          <div className="flex items-center gap-3">
            <Clock
              className={`h-6 w-6 ${
                timeLeft < 900 ? 'text-red-500' : 'text-yellow-500'
              }`}
            />
            <div>
              <p
                className={`font-semibold ${
                  timeLeft < 900 ? 'text-red-300' : 'text-yellow-300'
                }`}
              >
                Tiempo restante para pagar:
              </p>
              <p
                className={`text-2xl font-bold ${
                  timeLeft < 900 ? 'text-red-400' : 'text-yellow-400'
                }`}
              >
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-dark-800 bg-dark-900 p-8">
          <div className="mb-6 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <h1 className="text-2xl font-bold text-white">Reserva creada exitosamente</h1>
          </div>

          <div className="space-y-4 border-t border-dark-800 pt-6">
            <div>
              <p className="text-sm text-gray-400">Cabaña</p>
              <p className="text-lg font-semibold text-white">{bookingState.cabin.title}</p>
            </div>

            <div>
              <p className="text-sm text-gray-400">Fechas</p>
              <p className="text-lg font-semibold text-white">
                {formatDateRange(bookingState.start_date, bookingState.end_date)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400">Personas</p>
              <p className="text-lg font-semibold text-white">{bookingState.party_size}</p>
            </div>

            {jacuzziDays.length > 0 && (
              <div>
                <p className="text-sm text-gray-400">Días con jacuzzi</p>
                <p className="text-lg font-semibold text-white">
                  {jacuzziDays.length}
                </p>
              </div>
            )}

            <div className="border-t border-dark-800 pt-4">
              <p className="text-sm text-gray-400">Total a pagar</p>
              <p className="text-3xl font-bold text-primary-500">
                {formatPrice(bookingState.amount_total)}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Button
              onClick={handlePayment}
              disabled={paying}
              className="w-full"
              size="lg"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              {paying ? 'Redirigiendo a Webpay...' : 'Pagar con Webpay'}
            </Button>

            {error && (
              <div className="mt-4 rounded-lg bg-red-950 border border-red-800 p-4 text-sm text-red-300">
                <p className="font-semibold text-red-200">Error al procesar el pago</p>
                <p className="mt-1">{error}</p>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-lg bg-blue-950 border border-blue-800 p-4 text-sm text-blue-300">
            <p className="font-semibold text-blue-200">Instrucciones de pago</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Serás redirigido a la pasarela de pago de Webpay</li>
              <li>Completa el pago con tu tarjeta de débito o crédito</li>
              <li>Al finalizar, serás redirigido de vuelta automáticamente</li>
              <li>Recibirás un email de confirmación una vez aprobado el pago</li>
            </ul>
          </div>
        </div>
      </div>
    </Container>
  );
}


