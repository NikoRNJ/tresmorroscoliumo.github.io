import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminPassword, createAdminSession } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';

const loginSchema = z.object({
  password: z.string().min(1, 'Contraseña requerida'),
});

const MAX_LOGIN_ATTEMPTS = Math.max(
  3,
  Number(process.env.ADMIN_LOGIN_MAX_ATTEMPTS || 5)
);
const LOGIN_WINDOW_MS = Math.max(
  60_000,
  Number(process.env.ADMIN_LOGIN_WINDOW_MS || 5 * 60 * 1000)
);

const loginAttempts = new Map<
  string,
  { count: number; resetAt: number }
>();

function getIdentifier(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.ip ||
    'unknown'
  );
}

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);
  if (!entry) return false;
  if (entry.resetAt <= now) {
    loginAttempts.delete(identifier);
    return false;
  }
  return entry.count >= MAX_LOGIN_ATTEMPTS;
}

function registerFailure(identifier: string) {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);
  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(identifier, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  entry.count += 1;
  loginAttempts.set(identifier, entry);
}

function resetAttempts(identifier: string) {
  loginAttempts.delete(identifier);
}

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
    const identifier = getIdentifier(request);

    if (isRateLimited(identifier)) {
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'admin_login_rate_limited',
        event_source: 'system',
        payload: {
          timestamp: new Date().toISOString(),
          ip: identifier,
          maxAttempts: MAX_LOGIN_ATTEMPTS,
          windowMs: LOGIN_WINDOW_MS,
        },
        status: 'error',
      });

      return NextResponse.json(
        { success: false, error: 'Demasiados intentos. Intenta en unos minutos.' },
        { status: 429 }
      );
    }

    // Verificar contraseña
    const isValid = verifyAdminPassword(password);

    if (!isValid) {
      registerFailure(identifier);
      // Log del intento fallido
      await (supabaseAdmin.from('api_events') as any).insert({
        event_type: 'admin_login_failed',
        event_source: 'system',
        payload: {
          timestamp: new Date().toISOString(),
          ip: identifier,
          attempts: loginAttempts.get(identifier)?.count ?? 1,
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
    resetAttempts(identifier);

    // Log del login exitoso
    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: 'admin_login_success',
      event_source: 'system',
      payload: {
        timestamp: new Date().toISOString(),
        ip: identifier,
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
