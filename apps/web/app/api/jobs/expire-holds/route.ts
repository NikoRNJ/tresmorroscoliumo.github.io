import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/jobs/expire-holds
 * 
 * Job ejecutado por cron cada 5 minutos para expirar holds vencidos
 * 
 * Headers requeridos:
 * - x-cron-secret: Secret para autenticar el cron
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar secret del cron
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Buscar todos los holds expirados
    const { data: expiredHolds, error: selectError } = await supabaseAdmin
      .from('bookings')
      .select('id, cabin_id, start_date, end_date, customer_email')
      .eq('status', 'pending')
      .lt('expires_at', now)
      .returns<Array<{ id: string; cabin_id: string; start_date: string; end_date: string; customer_email: string }>>();

    if (selectError) {
      console.error('Error fetching expired holds:', selectError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!expiredHolds || expiredHolds.length === 0) {
      return NextResponse.json({
        message: 'No expired holds found',
        expired: 0,
      });
    }

    // Actualizar status a 'expired'
    const holdIds = expiredHolds.map((h) => h.id);
    const { error: updateError } = await (supabaseAdmin
      .from('bookings') as any)
      .update({ status: 'expired' })
      .in('id', holdIds);

    if (updateError) {
      console.error('Error updating holds:', updateError);
      return NextResponse.json({ error: 'Update error' }, { status: 500 });
    }

    // Log del evento
    await supabaseAdmin.from('api_events').insert(
      expiredHolds.map((hold) => ({
        event_type: 'booking_hold_expired',
        event_source: 'system',
        booking_id: hold.id,
        payload: {
          cabin_id: hold.cabin_id,
          customer_email: hold.customer_email,
        },
        status: 'success',
      })) as any
    );

    return NextResponse.json({
      message: `Expired ${expiredHolds.length} holds`,
      expired: expiredHolds.length,
      bookingIds: holdIds,
    });
  } catch (error) {
    console.error('Error in expire-holds job:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
