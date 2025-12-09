import { supabaseAdmin } from '../supabase/server';
import type { Database } from '../../types/database';

type BookingRow = Database['public']['Tables']['bookings']['Row'];
type CabinRow = Database['public']['Tables']['cabins']['Row'];

export type BookingWithCabin = BookingRow & { cabin: CabinRow };

export type BookingWithMeta = BookingWithCabin & {
  isExpired: boolean;
  timeRemaining: number;
};

interface BookingFetchResult {
  booking: BookingWithMeta | null;
  error: string | null;
}

const computeMeta = (booking: BookingWithCabin): BookingWithMeta => {
  const now = new Date();
  const expiresAt = booking.expires_at ? new Date(booking.expires_at) : null;
  const pendingHold = booking.status === 'pending' && expiresAt !== null;
  const isExpired = pendingHold ? now >= expiresAt! : booking.status === 'expired';
  const timeRemaining =
    pendingHold && !isExpired && expiresAt
      ? Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
      : 0;

  return {
    ...booking,
    isExpired,
    timeRemaining,
  };
};

export async function getBookingWithMeta(bookingId: string): Promise<BookingFetchResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*, cabin:cabins(*)')
      .eq('id', bookingId)
      .limit(1);

    if (error) {
      return { booking: null, error: error.message };
    }

    const booking = data?.[0] as BookingWithCabin | undefined;

    if (!booking) {
      return { booking: null, error: null };
    }

    return {
      booking: computeMeta(booking),
      error: null,
    };
  } catch (err) {
    return {
      booking: null,
      error: err instanceof Error ? err.message : 'Unexpected error fetching booking',
    };
  }
}


