'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export default function PaymentConfirmationError({ error }: { error: Error }) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    // Log the client-side error to the server for diagnostics
    fetch('/api/logs/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: '/pago/confirmacion',
        message: error?.message,
        stack: error?.stack,
        extra: { token },
      }),
    }).catch(() => {});
  }, [error, token]);

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-950 border border-red-800 p-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
        </div>
        <h1 className="mb-4 text-3xl font-bold text-white">Error al confirmar el pago</h1>
        <p className="mb-6 text-lg text-gray-400">
          Ocurrió un problema al mostrar la confirmación. Hemos registrado el error para revisarlo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full">Volver al inicio</Button>
          </Link>
          <Link href="/pago" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">Ir a pagar</Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
