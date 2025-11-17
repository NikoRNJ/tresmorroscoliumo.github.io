import { redirect } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getBookingWithMeta } from '@core/lib/data/bookings';
import { PaymentConfirmationClient } from './PaymentConfirmationClient';

interface PageProps {
  searchParams?: {
    booking?: string;
    token?: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function PaymentConfirmationPage({ searchParams }: PageProps) {
  const bookingId =
    typeof searchParams?.booking === 'string' ? searchParams.booking : null;
  const token =
    typeof searchParams?.token === 'string' ? searchParams.token : null;

  if (!bookingId) {
    redirect('/');
  }

  const { booking, error } = await getBookingWithMeta(bookingId);

  if (!booking && error) {
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
            {error || 'No pudimos cargar la reserva. Intenta nuevamente.'}
          </p>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <PaymentConfirmationClient
      bookingId={bookingId}
      tokenFromQuery={token}
      initialBooking={booking}
    />
  );
}

