'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Clock, CheckCircle, CreditCard, AlertTriangle } from 'lucide-react';
import { formatPrice, formatDateRange } from '@/lib/utils/format';

interface BookingWithCabin {
  id: string;
  cabin_id: string;
  start_date: string;
  end_date: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  party_size: number;
  jacuzzi_days: string[];
  amount_base: number;
  amount_extra_people: number;
  amount_jacuzzi: number;
  amount_total: number;
  status: string;
  expires_at: string;
  created_at: string;
  isExpired: boolean;
  timeRemaining: number;
  cabin: {
    id: string;
    title: string;
    slug: string;
  };
}

/**
 * Página de pago con integración de Flow
 * 
 * Permite al usuario completar el pago de su reserva pendiente
 * con un timer de 45 minutos antes de que expire el hold
 */
function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking');

  const [booking, setBooking] = useState<BookingWithCabin | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Cargar los datos de la reserva
  useEffect(() => {
    if (!bookingId) {
      router.push('/');
      return;
    }

    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        
        if (!response.ok) {
          throw new Error('No se pudo cargar la reserva');
        }

        const data = await response.json();
        setBooking(data.booking);
        setTimeLeft(data.booking.timeRemaining);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, router]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Expiró, recargar para mostrar mensaje de expiración
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  // Manejar el pago con Flow
  const handlePayment = async () => {
    if (!bookingId) return;

    setPaying(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/flow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear el pago');
      }

      const { paymentUrl, token } = await response.json();

      try {
        if (token) sessionStorage.setItem('flowToken', token);
      } catch {}

      // Redirigir a Flow
      window.location.href = paymentUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setPaying(false);
    }
  };

  // Formatear el tiempo restante (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-dark-800 rounded mb-4"></div>
            <div className="h-24 bg-dark-800 rounded mb-4"></div>
            <div className="h-48 bg-dark-800 rounded"></div>
          </div>
        </div>
      </Container>
    );
  }

  if (error || !booking) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-950 border border-red-800 p-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white">Error</h1>
          <p className="mb-8 text-lg text-gray-400">
            {error || 'No se pudo cargar la reserva'}
          </p>
          <Button onClick={() => router.push('/')}>Volver al inicio</Button>
        </div>
      </Container>
    );
  }

  // Si la reserva ya expiró
  if (booking.isExpired || booking.status === 'expired') {
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
          <Button onClick={() => router.push(`/cabanas/${booking.cabin.slug}`)}>
            Volver a reservar
          </Button>
        </div>
      </Container>
    );
  }

  // Si ya está pagada
  if (booking.status === 'paid') {
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
        {/* Timer de expiración */}
        <div className={`mb-8 rounded-lg border-2 p-4 ${
          timeLeft < 900 
            ? 'border-red-700 bg-red-950' 
            : 'border-yellow-700 bg-yellow-950'
        }`}>
          <div className="flex items-center gap-3">
            <Clock className={`h-6 w-6 ${
              timeLeft < 900 ? 'text-red-500' : 'text-yellow-500'
            }`} />
            <div>
              <p className={`font-semibold ${
                timeLeft < 900 ? 'text-red-300' : 'text-yellow-300'
              }`}>
                Tiempo restante para pagar:
              </p>
              <p className={`text-2xl font-bold ${
                timeLeft < 900 ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>
        </div>

        {/* Resumen de la reserva */}
        <div className="rounded-lg border border-dark-800 bg-dark-900 p-8">
          <div className="mb-6 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <h1 className="text-2xl font-bold text-white">Reserva creada exitosamente</h1>
          </div>

          <div className="space-y-4 border-t border-dark-800 pt-6">
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
                <p className="text-lg font-semibold text-white">{booking.jacuzzi_days.length}</p>
              </div>
            )}

            <div className="border-t border-dark-800 pt-4">
              <p className="text-sm text-gray-400">Total a pagar</p>
              <p className="text-3xl font-bold text-primary-500">
                {formatPrice(booking.amount_total)}
              </p>
            </div>
          </div>

          {/* Botón de pago */}
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

          {/* Info adicional */}
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

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-dark-800 rounded mb-4"></div>
            <div className="h-24 bg-dark-800 rounded mb-4"></div>
            <div className="h-48 bg-dark-800 rounded"></div>
          </div>
        </div>
      </Container>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}

