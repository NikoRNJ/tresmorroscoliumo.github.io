import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

// Helper to get correct base path for images (handles monorepo context)
const getPublicPath = () => {
    const monorepoPath = path.join(process.cwd(), 'apps', 'web', 'public');
    if (fs.existsSync(monorepoPath)) {
        return monorepoPath;
    }
    return path.join(process.cwd(), 'public');
};

/**
 * POST /api/admin/galeria/delete
 * Delete an image from galeria (removes from filesystem and database)
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

        // Try to remove from local filesystem
        const storagePath = imageData.storage_path as string | undefined;
        const imageUrl = imageData.image_url as string | undefined;
        const PUBLIC_PATH = getPublicPath();

        // Determine local file path
        let localFilePath: string | null = null;

        if (storagePath && storagePath.startsWith('public/images/')) {
            // Path like "public/images/galeria/interior/image.webp"
            // Remove 'public/' prefix and join with actual public path
            localFilePath = path.join(PUBLIC_PATH, storagePath.replace('public/', ''));
        } else if (imageUrl && imageUrl.startsWith('/images/')) {
            // URL like "/images/galeria/interior/image.webp"
            localFilePath = path.join(PUBLIC_PATH, imageUrl);
        }

        if (localFilePath && fs.existsSync(localFilePath)) {
            try {
                fs.unlinkSync(localFilePath);
                console.log('Deleted local file:', localFilePath);
            } catch (fsError) {
                console.warn('Could not remove local file:', fsError);
            }
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
            payload: { imageId, category: imageData.category },
            status: 'success',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting galeria image:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
