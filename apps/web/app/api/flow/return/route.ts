import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint de retorno de Flow.
 * Flow puede llamar por GET o POST y enviar el token.
 * Redirige a /pago/confirmacion?token=... para evitar que la página reciba un POST directo.
 */
async function buildRedirect(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  let token: string | null = null;

  try {
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({} as any));
      token = typeof body?.token === 'string' ? body.token : null;
    } else if (req.method === 'POST') {
      const form = await req.formData();
      token = form.get('token')?.toString() || form.get('TBK_TOKEN')?.toString() || null;
    } else {
      token = req.nextUrl.searchParams.get('token');
    }
  } catch (err) {
    console.error('Error parsing Flow return body:', err);
  }

  const redirectUrl = token
    ? `/pago/confirmacion?token=${encodeURIComponent(token)}`
    : `/pago/confirmacion`;

  return NextResponse.redirect(new URL(redirectUrl, process.env.NEXT_PUBLIC_SITE_URL || req.url), {
    status: 303,
  });
}

export async function POST(req: NextRequest) {
  return buildRedirect(req);
}

export async function GET(req: NextRequest) {
  return buildRedirect(req);
}
