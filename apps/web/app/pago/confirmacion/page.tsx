'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

function PaymentConfirmationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const bookingId = searchParams.get('booking');
  const [bookingIdForRetry, setBookingIdForRetry] = useState<string | null>(() => bookingId);

  type ViewState =
    | { kind: 'missing' }
    | { kind: 'loading' }
    | { kind: 'paid'; message: string }
    | { kind: 'pending'; message: string }
    | { kind: 'rejected'; message: string }
    | { kind: 'cancelled'; message: string }
    | { kind: 'expired'; message: string }
    | { kind: 'invalid'; message: string }
    | { kind: 'error'; message: string };

  const [state, setState] = useState<ViewState>(() => (!token ? { kind: 'missing' } : { kind: 'loading' }));

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setState({ kind: 'missing' });
      return;
    }

    const fetchStatus = async (attempt = 0) => {
      try {
        const res = await fetch('/api/payments/flow/confirm', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token, bookingId }),
        });
        let data: any;
        try {
          data = await res.json();
        } catch {
          throw new Error(`Respuesta inesperada del servidor (status ${res.status})`);
        }
        if (cancelled) return;

        const bookingFromResponse = typeof data?.bookingId === 'string' ? data.bookingId : null;
        if (bookingFromResponse && bookingFromResponse !== bookingIdForRetry) {
          setBookingIdForRetry(bookingFromResponse);
        }

        if (data.success) {
          setState({ kind: 'paid', message: data.message ?? 'Pago confirmado' });
          return;
        }

        const code = data.code as string | undefined;
        const message = data.message as string | undefined;

        switch (code) {
          case 'PENDING':
            if (attempt < 2) {
              setTimeout(() => fetchStatus(attempt + 1), 1200);
            }
            setState({ kind: 'pending', message: message ?? 'Pago en proceso, estamos confirmando con Flow.' });
            return;
          case 'REJECTED':
            setState({ kind: 'rejected', message: message ?? 'Pago rechazado. Intenta nuevamente.' });
            return;
          case 'CANCELLED':
            setState({ kind: 'cancelled', message: message ?? 'Pago cancelado.' });
            return;
          case 'HOLD_EXPIRED':
            setState({ kind: 'expired', message: message ?? 'El tiempo para pagar expiró.' });
            return;
          case 'INVALID_BOOKING_STATE':
            setState({ kind: 'invalid', message: message ?? 'La reserva ya no está vigente.' });
            return;
          default:
            setState({ kind: 'error', message: message ?? 'No pudimos confirmar el pago. Intenta nuevamente.' });
            return;
        }
      } catch (err) {
        if (cancelled) return;
        setState({ kind: 'error', message: 'No pudimos confirmar el pago. Intenta nuevamente.' });
      }
    };

    setState({ kind: 'loading' });
    fetchStatus();

    return () => {
      cancelled = true;
    };
  }, [token, bookingId, bookingIdForRetry]);

  const status = useMemo(() => state.kind, [state.kind]);

  const renderContent = () => {
    if (status === 'missing') {
      return (
        <>
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-950 border border-red-800 p-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white">No recibimos el token</h1>
          <p className="mb-8 text-lg text-gray-400">
            Vuelve a la página de pago y reintenta. Si el pago se debitó, revisaremos el estado y te
            avisaremos por correo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full">Volver al inicio</Button>
            </Link>
            <Link href={bookingIdForRetry ? `/pago?booking=${bookingIdForRetry}` : '/pago'} className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">Ir a pagar</Button>
            </Link>
          </div>
        </>
      );
    }

    const renderToken = () => (
      <div className="rounded-lg bg-dark-800 border border-dark-700 p-4 text-sm text-gray-300 mb-6">
        <p className="font-semibold text-white">Token de pago</p>
        <p className="font-mono break-all text-gray-200">{token}</p>
        <p className="mt-2 text-gray-400">
          Guarda este token como referencia. Te avisaremos por correo cuando se confirme.
        </p>
      </div>
    );

    if (status === 'loading' || status === 'pending') {
      return (
        <>
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-blue-950 border border-blue-800 p-4">
              <Clock className="h-12 w-12 text-blue-500 animate-spin" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white">Confirmando con Flow</h1>
          <p className="mb-4 text-lg text-gray-300">
            {(state.kind === 'pending' && state.message) || 'Esto puede tardar unos segundos.'}
          </p>
          {renderToken()}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={() => location.reload()} className="w-full sm:w-auto">
              Reintentar ahora
            </Button>
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full">Volver al inicio</Button>
            </Link>
          </div>
        </>
      );
    }

    if (status === 'paid') {
      return (
        <>
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-green-950 border border-green-800 p-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white">Pago confirmado</h1>
          <p className="mb-4 text-lg text-gray-300">{state.kind === 'paid' ? state.message : ''}</p>
          {renderToken()}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full">Volver al inicio</Button>
            </Link>
            <Link href="/pago" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">Hacer otra reserva</Button>
            </Link>
          </div>
        </>
      );
    }

    const errorMessage =
      state.kind === 'rejected' ||
        state.kind === 'cancelled' ||
        state.kind === 'expired' ||
        state.kind === 'invalid' ||
        state.kind === 'error'
        ? state.message
        : 'No pudimos confirmar el pago. Intenta nuevamente.';

    return (
      <>
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-950 border border-red-800 p-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
        </div>
        <h1 className="mb-4 text-3xl font-bold text-white">
          {state.kind === 'rejected'
            ? 'Pago rechazado'
            : state.kind === 'cancelled'
              ? 'Pago cancelado'
              : state.kind === 'expired'
                ? 'Reserva expirada'
                : 'No pudimos confirmar el pago'}
        </h1>
        <p className="mb-4 text-lg text-gray-300">{errorMessage}</p>
        {renderToken()}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={bookingIdForRetry ? `/pago?booking=${bookingIdForRetry}` : '/pago'} className="w-full sm:w-auto">
            <Button className="w-full">Intentar otro pago</Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">Volver al inicio</Button>
          </Link>
        </div>
      </>
    );
  };

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl text-center">
        {renderContent()}
        <div className="mt-8 text-xs text-gray-500 flex items-center justify-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Si el pago fue exitoso, aparecerá pronto en tu correo y en el panel.</span>
        </div>
      </div>
    </Container>
  );
}

export default function PaymentConfirmationPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-16">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-blue-950 border border-blue-800 p-4">
                <Clock className="h-12 w-12 text-blue-500 animate-spin" />
              </div>
            </div>
            <h1 className="mb-4 text-3xl font-bold text-white">Cargando</h1>
            <p className="text-gray-300">Estamos cargando la confirmación de tu pago.</p>
          </div>
        </Container>
      }
    >
      <PaymentConfirmationContent />
    </Suspense>
  );
}
