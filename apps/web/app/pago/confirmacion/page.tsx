'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, Clock, Loader2, Mail } from 'lucide-react';
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
  amount_total: number;
  status: string;
  cabin: {
    id: string;
    title: string;
    slug: string;
  };
}

type PaymentStatus = 'checking' | 'success' | 'cancelled' | 'pending' | 'error';

/**
 * Página de confirmación de pago
 * 
 * Flow redirige aquí después del pago (exitoso o cancelado)
 * Hacemos polling para verificar el estado final ya que el webhook
 * puede tardar unos segundos en procesar
 */
function PaymentConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking');
  const token = searchParams.get('token') || (typeof window !== 'undefined' ? sessionStorage.getItem('flowToken') : null);

  const [booking, setBooking] = useState<BookingWithCabin | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('checking');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 10; // 10 intentos x 3 segundos = 30 segundos máximo

  // Polling para verificar el estado del pago
  useEffect(() => {
    if (!bookingId) {
      router.push('/');
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        if (token && bookingId && attempts === 0) {
          try {
            await fetch('/api/payments/flow/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, bookingId }),
            })
          } catch {}
        }
        const response = await fetch(`/api/bookings/${bookingId}`);
        
        if (!response.ok) {
          throw new Error('No se pudo verificar el estado del pago');
        }

        const data = await response.json();
        const fetchedBooking = data.booking;
        
        setBooking(fetchedBooking);

        // Determinar el estado según el status de la reserva
        if (fetchedBooking.status === 'paid') {
          setStatus('success');
        } else if (fetchedBooking.status === 'canceled') {
          setStatus('cancelled');
        } else if (attempts >= maxAttempts) {
          // Después de 30 segundos, si sigue pending, mostramos estado pendiente
          setStatus('pending');
        } else {
          // Continuar polling
          setAttempts((prev) => prev + 1);
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
        if (attempts >= maxAttempts) {
          setStatus('error');
        } else {
          setAttempts((prev) => prev + 1);
        }
      }
    };

    checkPaymentStatus();

    // Polling cada 3 segundos si aún estamos en estado "checking"
    if (status === 'checking' && attempts < maxAttempts) {
      const interval = setInterval(checkPaymentStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [bookingId, token, router, status, attempts, maxAttempts]);

  // Estado: Verificando pago
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
            Intento {attempts + 1} de {maxAttempts}
          </p>
        </div>
      </Container>
    );
  }

  // Estado: Pago exitoso
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

          {/* Resumen de la reserva */}
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
                  <p className="text-lg font-semibold text-white">{booking.jacuzzi_days.length}</p>
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

          {/* Información de confirmación */}
          <div className="rounded-lg bg-blue-950 border border-blue-800 p-4 mb-6">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-300">
                <p className="font-semibold text-blue-200">Confirmación enviada</p>
                <p className="mt-1">
                  Hemos enviado un email de confirmación a <strong>{booking.customer_email}</strong> con todos los detalles de tu reserva.
                </p>
              </div>
            </div>
          </div>

          {/* Siguiente paso */}
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

  // Estado: Pago cancelado
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
            El pago fue cancelado. Tu reserva sigue activa por unos minutos más si deseas intentar nuevamente.
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

  // Estado: Pendiente (timeout del polling)
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

  // Estado: Error
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
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
          <Button variant="outline" onClick={() => router.push('/')}>
            Volver al inicio
          </Button>
        </div>
      </div>
    </Container>
  );
}

export default function PaymentConfirmationPage() {
  return (
    <Suspense fallback={
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-blue-950 border border-blue-800 p-4">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white">Verificando pago...</h1>
          <p className="text-lg text-gray-400">
            Estamos confirmando tu pago. Por favor espera un momento.
          </p>
        </div>
      </Container>
    }>
      <PaymentConfirmationContent />
    </Suspense>
  );
}
