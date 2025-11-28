import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

function extractBookingId(optionalRaw: string | null | undefined): string | null {
  if (!optionalRaw) return null;

  if (/^[0-9a-fA-F-]{36}$/.test(optionalRaw)) return optionalRaw;

  try {
    const parsed = JSON.parse(optionalRaw);
    if (parsed && typeof parsed.bookingId === 'string') {
      return parsed.bookingId;
    }
  } catch {}

  return null;
}

/**
 * Endpoint de retorno de Flow.
 * Flow puede llamar por GET o POST y enviar el token y optional.
 * Redirige a /pago/confirmacion?token=...&booking=... para evitar que la página reciba un POST directo.
 */
async function buildRedirect(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  let token: string | null = null;
  let bookingId: string | null = null;

  try {
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({} as any));
      token = typeof body?.token === 'string' ? body.token : null;
      bookingId = extractBookingId(typeof body?.optional === 'string' ? body.optional : null);
    } else if (req.method === 'POST') {
      const form = await req.formData();
      token = form.get('token')?.toString() || form.get('TBK_TOKEN')?.toString() || null;
      bookingId = extractBookingId(form.get('optional')?.toString());
    } else {
      const searchParams = req.nextUrl.searchParams;
      token = searchParams.get('token') || searchParams.get('TBK_TOKEN');
      bookingId = extractBookingId(searchParams.get('optional')) || searchParams.get('booking');
    }
  } catch (err) {
    console.error('Error parsing Flow return body:', err);
  }

  const params = new URLSearchParams();
  if (token) params.set('token', token);
  if (bookingId) params.set('booking', bookingId);

  const redirectPath = `/pago/confirmacion${params.toString() ? `?${params.toString()}` : ''}`;

  await (supabaseAdmin.from('api_events') as any).insert({
    event_type: 'flow_return_received',
    event_source: 'flow',
    payload: { token, bookingId },
    status: token ? 'success' : 'error',
    error_message: token ? null : 'Missing token on return',
  });

  return NextResponse.redirect(new URL(redirectPath, process.env.NEXT_PUBLIC_SITE_URL || req.url), {
    status: 303,
  });
}

export async function POST(req: NextRequest) {
  return buildRedirect(req);
}

export async function GET(req: NextRequest) {
  return buildRedirect(req);
}
