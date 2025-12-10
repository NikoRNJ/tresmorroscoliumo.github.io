import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { toWebp } from '@/modules/media/server/imageProcessing';
import { generateFileName, toSlugSegment } from '@/modules/galeria/utils/filePaths';
import fs from 'fs';
import path from 'path';

// Base path for public/images/galeria - handles monorepo context
const getPublicImagesGaleriaPath = () => {
    const monorepoPath = path.join(process.cwd(), 'apps', 'web', 'public', 'images', 'galeria');
    if (fs.existsSync(path.join(process.cwd(), 'apps', 'web', 'public'))) {
        return monorepoPath;
    }
    return path.join(process.cwd(), 'public', 'images', 'galeria');
};
const PUBLIC_IMAGES_PATH = getPublicImagesGaleriaPath();

/**
 * POST /api/admin/galeria/upload
 * Upload an image to a specific category (saves to public/images/galeria/)
 */
export async function POST(request: NextRequest) {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const category = formData.get('category');

    if (!(file instanceof File)) {
        return NextResponse.json({ error: 'Archivo no encontrado en la petición' }, { status: 400 });
    }

    if (!category || typeof category !== 'string') {
        return NextResponse.json({ error: 'Categoría requerida' }, { status: 400 });
    }

    try {
        // Convert to WebP format
        const rawBuffer = Buffer.from(await file.arrayBuffer());
        const processed = await toWebp(rawBuffer);

        // Generate filename and local path
        const baseName = file.name?.split('.').slice(0, -1).join('.') || 'imagen';
        const fileName = generateFileName(baseName, 'webp');

        // Parse category: "Galeria - Interior" -> "interior"
        const categorySlug = extractCategorySlug(category);

        // Ensure category folder exists
        const categoryPath = path.join(PUBLIC_IMAGES_PATH, categorySlug);
        if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath, { recursive: true });
        }

        // Write file to disk (use buffer from ProcessedImage)
        const filePath = path.join(categoryPath, fileName);
        fs.writeFileSync(filePath, processed.buffer);

        // Public URL for the image
        const publicUrl = `/images/galeria/${categorySlug}/${fileName}`;
        const storagePath = `public/images/galeria/${categorySlug}/${fileName}`;

        // Get next position for this category
        const { data: existing } = await (supabaseAdmin
            .from('galeria') as any)
            .select('position')
            .eq('category', category);

        const positions = (existing || []).map((item: any) => item.position ?? 0);
        const position = positions.length > 0 ? Math.max(...positions) + 1 : 1;

        // Insert into database
        const { data, error } = await (supabaseAdmin
            .from('galeria') as any)
            .insert({
                image_url: publicUrl,
                storage_path: storagePath,
                category: category,
                position: position,
                alt_text: baseName,
            })
            .select()
            .single();

        if (error || !data) {
            // If database insert fails, delete the file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            throw new Error('No se pudo registrar la imagen en la base de datos');
        }

        // Log event
        await (supabaseAdmin.from('api_events') as any).insert({
            event_type: 'galeria_image_uploaded',
            event_source: 'admin',
            payload: { imageId: data.id, category, storage_path: storagePath },
            status: 'success',
        });

        return NextResponse.json({
            image: {
                id: data.id,
                imageUrl: data.image_url,
                storagePath: data.storage_path,
                category: data.category,
                position: data.position,
                altText: data.alt_text,
                createdAt: data.created_at,
            },
        });
    } catch (error: any) {
        console.error('Error uploading galeria image:', error);
        return NextResponse.json(
            { error: error?.message || 'No se pudo subir la imagen' },
            { status: 400 }
        );
    }
}

/**
 * Extract category slug from category name
 * e.g., "Galeria - Interior" -> "interior"
 *       "Interior" -> "interior"
 */
function extractCategorySlug(category: string): string {
    // If contains " - ", take the part after it
    if (category.includes(' - ')) {
        const parts = category.split(' - ');
        return toSlugSegment(parts[parts.length - 1]);
    }
    return toSlugSegment(category);
}
