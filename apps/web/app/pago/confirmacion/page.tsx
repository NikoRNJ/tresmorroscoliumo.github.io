'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function PaymentConfirmationPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const status = useMemo(() => {
    if (!token) return 'missing';
    return 'processing';
  }, [token]);

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
            <Link href="/pago" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">Ir a pagar</Button>
            </Link>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-blue-950 border border-blue-800 p-4">
            <Clock className="h-12 w-12 text-blue-500" />
          </div>
        </div>
        <h1 className="mb-4 text-3xl font-bold text-white">Pago recibido</h1>
        <p className="mb-4 text-lg text-gray-300">
          Estamos confirmando tu pago con Flow. Esto puede tardar unos segundos.
        </p>
        <div className="rounded-lg bg-dark-800 border border-dark-700 p-4 text-sm text-gray-300 mb-6">
          <p className="font-semibold text-white">Token de pago</p>
          <p className="font-mono break-all text-gray-200">{token}</p>
          <p className="mt-2 text-gray-400">
            Guarda este token como referencia. Recibirás un correo cuando el pago quede confirmado.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full">Volver al inicio</Button>
          </Link>
          <Link href="/pago" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">Ver otra reserva</Button>
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
