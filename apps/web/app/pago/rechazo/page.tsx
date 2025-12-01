'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, XCircle } from 'lucide-react';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

function PaymentRejectionContent() {
    const searchParams = useSearchParams();
    const reason = searchParams.get('reason');
    const bookingId = searchParams.get('booking');

    const getMessage = () => {
        switch (reason) {
            case 'rejected':
                return 'El pago fue rechazado por la entidad financiera. Por favor revisa tus datos o intenta con otro medio de pago.';
            case 'cancelled':
                return 'Has cancelado el proceso de pago.';
            case 'token_missing':
                return 'No se recibió la información necesaria para procesar el pago.';
            case 'internal_error':
                return 'Ocurrió un error interno al procesar la respuesta del pago.';
            default:
                return 'No pudimos completar el pago. Por favor intenta nuevamente.';
        }
    };

    const getTitle = () => {
        switch (reason) {
            case 'cancelled':
                return 'Pago Cancelado';
            default:
                return 'Pago Rechazado';
        }
    }

    return (
        <Container className="py-16">
            <div className="mx-auto max-w-2xl text-center">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-red-950 border border-red-800 p-4">
                        {reason === 'cancelled' ? (
                            <XCircle className="h-12 w-12 text-red-500" />
                        ) : (
                            <AlertTriangle className="h-12 w-12 text-red-500" />
                        )}

                    </div>
                </div>
                <h1 className="mb-4 text-3xl font-bold text-white">{getTitle()}</h1>
                <p className="mb-8 text-lg text-gray-400">
                    {getMessage()}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full">Volver al inicio</Button>
                    </Link>
                    {bookingId && (
                        <Link href={`/pago?booking=${bookingId}`} className="w-full sm:w-auto">
                            <Button className="w-full">Intentar nuevamente</Button>
                        </Link>
                    )}
                    {!bookingId && (
                        <Link href={`/pago`} className="w-full sm:w-auto">
                            <Button className="w-full">Ir a pagar</Button>
                        </Link>
                    )}
                </div>
            </div>
        </Container>
    );
}

export default function PaymentRejectionPage() {
    return (
        <Suspense fallback={<div className="py-16 text-center text-white">Cargando...</div>}>
            <PaymentRejectionContent />
        </Suspense>
    );
}
