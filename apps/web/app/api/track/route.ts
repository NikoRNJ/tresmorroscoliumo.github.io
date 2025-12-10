import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createHash } from 'crypto';

/**
 * API endpoint para registrar visitas al sitio
 * Almacena IP hasheada para contar visitantes únicos (GDPR-compliant)
 * 
 * POST /api/track
 * Body: { path: string, referrer?: string }
 */

// Hashear IP con SHA-256 + salt para privacidad
function hashIP(ip: string): string {
    // Salt fijo para consistencia en el conteo
    const salt = process.env.IP_HASH_SALT || 'tresmorros-2024';
    return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

// Detectar tipo de dispositivo desde User-Agent
function getDeviceType(userAgent: string | null): string {
    if (!userAgent) return 'unknown';

    const ua = userAgent.toLowerCase();

    // Detectar bots
    if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
        return 'bot';
    }

    // Detectar móviles
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return 'mobile';
    }

    // Detectar tablets
    if (ua.includes('tablet') || ua.includes('ipad')) {
        return 'tablet';
    }

    return 'desktop';
}

// Obtener IP real del request (considerando proxies)
function getClientIP(request: NextRequest): string {
    // Orden de prioridad para obtener IP real
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        // x-forwarded-for puede tener múltiples IPs, la primera es el cliente
        return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Fallback: IP de conexión directa
    return request.headers.get('cf-connecting-ip') || // Cloudflare
        request.headers.get('x-client-ip') ||
        '0.0.0.0';
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const path = body.path || '/';
        const referrer = body.referrer || null;

        const clientIP = getClientIP(request);
        const ipHash = hashIP(clientIP);
        const userAgent = request.headers.get('user-agent');
        const deviceType = getDeviceType(userAgent);

        // No registrar bots para métricas más limpias
        if (deviceType === 'bot') {
            return NextResponse.json({ tracked: false, reason: 'bot' });
        }

        // Insertar visita en la base de datos
        const { error } = await supabaseAdmin
            .from('site_visits')
            .insert({
                ip_hash: ipHash,
                path: path,
                device_type: deviceType,
                referrer: referrer,
            });

        if (error) {
            console.error('Error registrando visita:', error);
            return NextResponse.json({ tracked: false }, { status: 500 });
        }

        return NextResponse.json({ tracked: true });

    } catch (error) {
        console.error('Error en /api/track:', error);
        return NextResponse.json({ tracked: false }, { status: 500 });
    }
}

// Responder a preflight CORS
export async function OPTIONS() {
    return NextResponse.json({}, { status: 200 });
}
