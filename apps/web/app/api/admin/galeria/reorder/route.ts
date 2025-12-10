import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/admin/galeria/reorder
 * Reorder images within a category
 */
export async function POST(request: NextRequest) {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const orderedIds = body?.orderedIds as string[] | undefined;
    const category = body?.category as string | undefined;

    if (!orderedIds?.length || !category) {
        return NextResponse.json({ error: 'Datos incompletos. Se requiere orderedIds y category.' }, { status: 400 });
    }

    try {
        // Update position for each image
        for (let index = 0; index < orderedIds.length; index++) {
            const imageId = orderedIds[index];
            await (supabaseAdmin
                .from('galeria') as any)
                .update({ position: index + 1 })
                .eq('id', imageId)
                .eq('category', category);
        }

        // Log event
        await (supabaseAdmin.from('api_events') as any).insert({
            event_type: 'galeria_reordered',
            event_source: 'admin',
            payload: { category, orderedIds },
            status: 'success',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error reordering galeria:', error);
        return NextResponse.json({ error: 'No se pudo reordenar las imágenes' }, { status: 500 });
    }
}
