import { NextRequest, NextResponse } from 'next/server';

// Handler para capturar POST/GET que Flow pueda enviar a returnUrl y redirigir
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let token: string | null = null;

    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({} as any));
      token = typeof body?.token === 'string' ? body.token : null;
    } else {
      const form = await req.formData();
      token = form.get('token')?.toString() || form.get('TBK_TOKEN')?.toString() || null;
    }

    const redirectUrl = token
      ? `/pago/confirmacion?token=${encodeURIComponent(token)}`
      : `/pago/confirmacion`;

    return NextResponse.redirect(new URL(redirectUrl, process.env.NEXT_PUBLIC_SITE_URL || req.url), {
      status: 303,
    });
  } catch (error) {
    console.error('Error handling Flow return POST:', error);
    return NextResponse.redirect(new URL('/pago/confirmacion', process.env.NEXT_PUBLIC_SITE_URL || req.url), {
      status: 303,
    });
  }
}

export async function GET(req: NextRequest) {
  // Asegura redirección consistente si Flow hace GET con token.
  const token = req.nextUrl.searchParams.get('token');
  const redirectUrl = token
    ? `/pago/confirmacion?token=${encodeURIComponent(token)}`
    : `/pago/confirmacion`;
  return NextResponse.redirect(new URL(redirectUrl, process.env.NEXT_PUBLIC_SITE_URL || req.url), {
    status: 303,
  });
}


