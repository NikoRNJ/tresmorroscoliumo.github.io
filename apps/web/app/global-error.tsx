'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-dark-950 text-white">
        <Container className="py-24">
          <div className="mx-auto max-w-2xl text-center space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Algo salió mal</h1>
              <p className="mt-3 text-gray-300">
                Se registró el error y nuestro equipo ya fue alertado.
              </p>
            </div>
            {error?.message && (
              <p className="rounded border border-dark-700 bg-dark-900 p-4 text-sm text-gray-400">
                {error.message}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => reset()}>Reintentar</Button>
              <Button variant="outline" onClick={() => (window.location.href = '/')}>
                Volver al inicio
              </Button>
            </div>
          </div>
        </Container>
      </body>
    </html>
  );
}


