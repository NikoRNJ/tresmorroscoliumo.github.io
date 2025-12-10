import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/admin/galeria/update
 * Update image metadata (alt_text, position)
 */
export async function POST(request: NextRequest) {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const imageId = body?.imageId as string | undefined;
        const altText = body?.altText as string | undefined;
        const position = body?.position as number | undefined;

        if (!imageId) {
            return NextResponse.json({ error: 'imageId requerido' }, { status: 400 });
        }

        const updatePayload: Record<string, any> = {};

        if (typeof altText === 'string') {
            updatePayload.alt_text = altText;
        }

        if (typeof position === 'number') {
            updatePayload.position = position;
        }

        if (Object.keys(updatePayload).length === 0) {
            return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 });
        }

        const { error } = await (supabaseAdmin
            .from('galeria') as any)
            .update(updatePayload)
            .eq('id', imageId);

        if (error) {
            return NextResponse.json({ error: 'No se pudo actualizar la imagen' }, { status: 500 });
        }

        // Log event
        await (supabaseAdmin.from('api_events') as any).insert({
            event_type: 'galeria_image_updated',
            event_source: 'admin',
            payload: { imageId, ...updatePayload },
            status: 'success',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating galeria image:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
