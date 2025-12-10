import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { deleteImage } from '@/modules/galeria/services/storageService';

/**
 * POST /api/admin/galeria/delete
 * Delete an image from galeria (removes from storage and database)
 * 
 * Funciona tanto con storage local (desarrollo) como Supabase Storage (producción)
 */
export async function POST(request: NextRequest) {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const imageId = body?.imageId as string | undefined;

    if (!imageId) {
        return NextResponse.json({ error: 'imageId requerido' }, { status: 400 });
    }

    try {
        // Get image data before deletion
        const { data: imageData, error: fetchError } = await (supabaseAdmin
            .from('galeria') as any)
            .select('id, category, storage_path, image_url, position')
            .eq('id', imageId)
            .maybeSingle();

        if (fetchError || !imageData) {
            return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
        }

        // Delete from storage (local or Supabase depending on storage_path prefix)
        const deleteResult = await deleteImage(
            imageData.storage_path,
            imageData.image_url
        );

        if (!deleteResult.success) {
            console.warn('No se pudo eliminar archivo del storage:', deleteResult.error);
            // Continuamos con la eliminación de DB aunque falle el storage
        }

        // Delete from database
        const { error: deleteError } = await (supabaseAdmin
            .from('galeria') as any)
            .delete()
            .eq('id', imageId);

        if (deleteError) {
            return NextResponse.json({ error: 'No se pudo eliminar la imagen' }, { status: 500 });
        }

        // Re-normalize positions for remaining items in category
        const { data: remaining } = await (supabaseAdmin
            .from('galeria') as any)
            .select('id')
            .eq('category', imageData.category)
            .order('position', { ascending: true });

        if (remaining?.length) {
            for (let i = 0; i < remaining.length; i++) {
                await (supabaseAdmin
                    .from('galeria') as any)
                    .update({ position: i + 1 })
                    .eq('id', remaining[i].id);
            }
        }

        // Log event
        await (supabaseAdmin.from('api_events') as any).insert({
            event_type: 'galeria_deleted',
            event_source: 'admin',
            payload: {
                imageId,
                category: imageData.category,
                storagePath: imageData.storage_path,
            },
            status: 'success',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting galeria image:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
