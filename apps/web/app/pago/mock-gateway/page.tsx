'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { CreditCard, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Página de pasarela de pago MOCK
 * 
 * Esta página simula la pasarela de Flow/Webpay para desarrollo y pruebas.
 * En producción, el usuario sería redirigido a la pasarela real de Flow.
 * 
 * Flujo:
 * 1. Usuario llega aquí desde /api/payments/flow/create (modo mock)
 * 2. Usuario puede "Pagar" o "Cancelar"
 * 3. Al pagar, se llama a /api/payments/flow/mock-confirm que marca como 'paid'
 * 4. Se redirige a /pago/confirmacion
 */

function MockGatewayContent() {
  const siteEnv = process.env.NEXT_PUBLIC_SITE_ENV || 'development';
  const mockAllowed = siteEnv !== 'production';
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const bookingId = searchParams.get('booking');
  const token = searchParams.get('token');
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mockAllowed) {
      router.replace('/');
      return;
    }
    if (!bookingId || !token) {
      router.push('/');
    }
  }, [bookingId, token, router, mockAllowed]);

  const handlePay = async () => {
    if (!bookingId || !token) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/flow/mock-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookingId,
          token,
          action: 'pay'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el pago');
      }

      // Guardar token para la página de confirmación
      try {
        sessionStorage.setItem('flowToken', token);
      } catch {}

      // Redirigir a confirmación
      router.push(`/pago/confirmacion?booking=${bookingId}&token=${token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!bookingId || !token) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/flow/mock-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookingId,
          token,
          action: 'cancel'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar');
      }

      // Redirigir a confirmación con estado de cancelación
      router.push(`/pago/confirmacion?booking=${bookingId}&cancelled=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setProcessing(false);
    }
  };

  if (!mockAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <Container>
          <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Mock deshabilitado</h1>
            <p className="text-sm text-gray-600">
              Esta pasarela de prueba no está disponible en producción.
            </p>
          </div>
        </Container>
      </div>
    );
  }

  if (!bookingId || !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-16">
      <Container>
        <div className="mx-auto max-w-lg">
          {/* Header simulando Flow/Webpay */}
          <div className="rounded-t-xl bg-white p-6 text-center border-b">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-blue-100 p-3">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Pasarela de Pago
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              🔧 Modo Desarrollo (Mock)
            </p>
          </div>

          {/* Contenido */}
          <div className="bg-white p-6 space-y-6">
            {/* Alerta de modo desarrollo */}
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Modo de Prueba
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Esta es una simulación de la pasarela de pago Flow/Webpay. 
                    En producción, serías redirigido a la pasarela real.
                  </p>
                </div>
              </div>
            </div>

            {/* Info de la reserva */}
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Reserva</p>
              <p className="font-mono text-sm text-gray-900 break-all">
                {bookingId}
              </p>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              <Button
                onClick={handlePay}
                disabled={processing}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
              >
                {processing ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                {processing ? 'Procesando...' : 'Simular Pago Exitoso'}
              </Button>

              <Button
                onClick={handleCancel}
                disabled={processing}
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50 py-3"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Cancelar Pago
              </Button>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="rounded-b-xl bg-gray-100 p-4 text-center">
            <p className="text-xs text-gray-500">
              Simulación de pago seguro • Tres Morros de Coliumo
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-16">
      <Container>
        <div className="mx-auto max-w-lg">
          <div className="rounded-xl bg-white p-6 text-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando pasarela de pago...</p>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function MockGatewayPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MockGatewayContent />
    </Suspense>
  );
}
