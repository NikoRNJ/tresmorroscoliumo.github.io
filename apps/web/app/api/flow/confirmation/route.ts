import { NextRequest, NextResponse } from 'next/server';

/**
 * DEPRECATED: Esta ruta está deprecada.
 * Usa /api/payments/flow/webhook en su lugar.
 * 
 * Esta ruta redirige automáticamente al endpoint principal para mantener
 * compatibilidad con configuraciones anteriores.
 */

const WEBHOOK_URL = '/api/payments/flow/webhook';

export async function POST(request: NextRequest) {
  console.warn('[Flow] ⚠️ /api/flow/confirmation está DEPRECADO. Usa /api/payments/flow/webhook');
  
  // Redirigir la solicitud al endpoint principal
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const targetUrl = new URL(WEBHOOK_URL, siteUrl);
  
  // Reenviar la solicitud al endpoint correcto
  const formData = await request.formData();
  
  const response = await fetch(targetUrl.toString(), {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function GET() {
  return NextResponse.json({ 
    status: 'deprecated',
    message: 'Este endpoint está deprecado. Usa /api/payments/flow/webhook',
    redirect: WEBHOOK_URL
  });
}
