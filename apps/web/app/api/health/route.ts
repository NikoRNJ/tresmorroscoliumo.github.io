/**
 * Health Check Endpoint - DIAGNÓSTICO DETALLADO
 * Verifica que la API está funcionando y puede conectarse a Supabase
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

// Forzar que esta ruta sea dinámica (nunca cacheada)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();

  const health = {
    status: 'checking' as 'ok' | 'error' | 'checking',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    elapsed: 0,

    // Diagnóstico de variables de entorno (sin exponer valores sensibles)
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
        : 'NOT_SET',
    },

    // Resultado de la prueba de conexión
    database: {
      connected: false,
      cabinsCount: 0,
      activeCabinsCount: 0,
      error: null as string | null,
    },
  };

  try {
    // Query 1: Probar conexión básica
    const { data: allCabins, error: allError } = await (supabaseAdmin
      .from('cabins') as any)
      .select('id, slug, active');

    if (allError) {
      health.database.error = allError.message;
      health.status = 'error';
    } else {
      health.database.connected = true;
      health.database.cabinsCount = allCabins?.length || 0;
      health.database.activeCabinsCount = allCabins?.filter((c: any) => c.active).length || 0;
      health.status = 'ok';
    }

  } catch (error) {
    health.status = 'error';
    health.database.error = error instanceof Error ? error.message : 'Unknown error';

    // Solo log si no es error de build time
    const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-server';
    if (!isBuildTime) {
      console.error('[health] Check failed:', error);
    }
  }

  health.elapsed = Date.now() - startTime;

  return NextResponse.json(health, {
    status: health.status === 'ok' ? 200 : 500,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
