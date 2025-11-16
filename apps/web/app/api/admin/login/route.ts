import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminPassword, createAdminSession } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';

const loginSchema = z.object({
  password: z.string().min(1, 'Contraseña requerida'),
});

/**
 * POST /api/admin/login
 * 
 * Autenticar admin
 * Iteración 7: Panel de Administración
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = loginSchema.parse(body);

    // Verificar contraseña
    const isValid = verifyAdminPassword(password);

    if (!isValid) {
      // Log del intento fallido
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'admin_login_failed',
        event_source: 'system',
        payload: {
          timestamp: new Date().toISOString(),
          ip: request.headers.get('x-forwarded-for') || 'unknown',
        },
        status: 'error',
      });

      return NextResponse.json(
        { success: false, error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Crear sesión
    await createAdminSession();

    // Log del login exitoso
    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: 'admin_login_success',
      event_source: 'system',
      payload: {
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      },
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin login:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
