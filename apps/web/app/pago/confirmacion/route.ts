import { NextRequest, NextResponse } from 'next/server';

// Redirige cualquier POST directo a la página hacia el handler de retorno
export async function POST(req: NextRequest) {
  const url = new URL('/api/flow/return', process.env.NEXT_PUBLIC_SITE_URL || req.url);
  return NextResponse.redirect(url, { status: 307 });
}
