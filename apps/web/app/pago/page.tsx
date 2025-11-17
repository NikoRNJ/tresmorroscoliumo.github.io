import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';
import { PaymentPageClient } from './PaymentPageClient';
import { getBookingWithMeta } from '@core/lib/data/bookings';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  searchParams?: { booking?: string };
}

export const dynamic = 'force-dynamic';

export default async function PaymentPage({ searchParams }: PageProps) {
  const bookingId =
    typeof searchParams?.booking === 'string' ? searchParams.booking : null;

  if (!bookingId) {
    redirect('/');
  }

  const { booking, error } = await getBookingWithMeta(bookingId);

  if (!booking) {
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
            {error || 'No se pudo cargar la reserva. Intenta nuevamente.'}
          </p>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </Container>
    );
  }

  return <PaymentPageClient booking={booking} />;
}

