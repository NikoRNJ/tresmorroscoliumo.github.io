import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

// Helper to get correct base path for images
const getPublicImagesPath = () => {
    const monorepoPath = path.join(process.cwd(), 'apps', 'web', 'public', 'images');
    if (fs.existsSync(monorepoPath)) {
        return monorepoPath;
    }
    return path.join(process.cwd(), 'public', 'images');
};

const PUBLIC_IMAGES_PATH = getPublicImagesPath();
const IGNORED_FOLDERS = ['.git', 'node_modules', 'icons', 'favicons', 'logo'];

/**
 * POST /api/admin/galeria/sync
 * MASTER SYNC: Makes the DB exactly match the Filesystem.
 * - Adds missing images.
 * - Removes orphaned images.
 * - Smart Category Naming: 'galeria/exterior' -> 'Exterior'.
 */
export async function POST(request: NextRequest) {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Crear cliente fresco
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction) {
            console.log('[sync] Producción detectada: Saltando sincronización de filesystem (solo fetch DB).');
            // En producción, JSON confiamos en la DB y el Storage. No borramos nada basado en filesystem efímero.
        } else {
            console.log('[sync] Desarrollo detectado: Sincronizando filesystem -> DB.');

            // Step 1: Scan filesystem entirely
            const filesystemImages = scanRefinedRecursively(PUBLIC_IMAGES_PATH);
            const fsUrls = new Set(filesystemImages.map(img => img.publicUrl));

            // Step 2: Get all existing DB records
            const { data: dbRecords, error: dbError } = await supabaseAdmin
                .from('galeria')
                .select('id, image_url, category');

            if (dbError) throw dbError;

            const dbUrls = new Map((dbRecords || []).map((r: any) => [r.image_url, r]));

            // Step 3: Identify additions and deletions
            const toInsert = [];
            const toDeleteIds: string[] = [];
            const toUpdateCategory: any[] = [];

            // Check for additions and category updates
            for (const fsImg of filesystemImages) {
                if (!dbUrls.has(fsImg.publicUrl)) {
                    // New image
                    toInsert.push(fsImg);
                } else {
                    // Existing image: Check if category matches current folder structure
                    const dbRecord: any = dbUrls.get(fsImg.publicUrl);
                    if (dbRecord.category !== fsImg.category) {
                        toUpdateCategory.push({ id: dbRecord.id, category: fsImg.category });
                    }
                }
            }

            // Check for deletions (DB records not in FS - ONLY IF URL is local path)
            for (const [url, record] of Array.from(dbUrls.entries()) as [string, any][]) {
                // Solo borrar si es una ruta local y no está en disco
                // Si es una URL de supabase (https://...), NO borrar por falta en disco local
                const isLocalUrl = url.startsWith('/images/');
                if (isLocalUrl && !fsUrls.has(url)) {
                    toDeleteIds.push(record.id);
                }
            }

            // --- EXECUTE UPDATES ---

            // 1. Delete orphaned
            if (toDeleteIds.length > 0) {
                await supabaseAdmin.from('galeria').delete().in('id', toDeleteIds);
                console.log(`Deleted ${toDeleteIds.length} orphaned images.`);
            }

            // 2. Insert new
            if (toInsert.length > 0) {
                const { data: posData } = await supabaseAdmin.from('galeria').select('category, position');
                const categoryPositions = new Map<string, number>();
                posData?.forEach((r: any) => {
                    const current = categoryPositions.get(r.category) || 0;
                    if (r.position > current) categoryPositions.set(r.category, r.position);
                });

                const maxBatch = 50;
                const insertBatches = [];
                let currentBatch: any[] = [];

                for (const img of toInsert) {
                    const nextPos = (categoryPositions.get(img.category) || 0) + 1;
                    categoryPositions.set(img.category, nextPos);

                    currentBatch.push({
                        image_url: img.publicUrl,
                        storage_path: img.storagePath,
                        category: img.category,
                        position: nextPos,
                        alt_text: img.altText,
                        status: 'synced'
                    });

                    if (currentBatch.length >= maxBatch) {
                        insertBatches.push(currentBatch);
                        currentBatch = [];
                    }
                }
                if (currentBatch.length > 0) insertBatches.push(currentBatch);

                for (const batch of insertBatches) {
                    await supabaseAdmin.from('galeria').insert(batch);
                }
                console.log(`Inserted ${toInsert.length} new images.`);
            }

            // 3. Update categories
            if (toUpdateCategory.length > 0) {
                for (const update of toUpdateCategory) {
                    await supabaseAdmin.from('galeria')
                        .update({ category: update.category })
                        .eq('id', update.id);
                }
                console.log(`Updated category for ${toUpdateCategory.length} images.`);
            }

            if (toInsert.length > 0 || toDeleteIds.length > 0 || toUpdateCategory.length > 0) {
                await supabaseAdmin.from('api_events').insert({
                    event_type: 'galeria_synced_master',
                    event_source: 'admin',
                    payload: { added: toInsert.length, deleted: toDeleteIds.length, updated: toUpdateCategory.length },
                    status: 'success',
                });
            }
        }

        // Step 4: Final Fetch from DB (Source of Truth)
        const { data: allImages } = await supabaseAdmin
            .from('galeria')
            .select('*')
            .order('category', { ascending: true })
            .order('position', { ascending: true });

        const categories = Array.from(new Set(allImages?.map((i: any) => i.category) || []));

        return NextResponse.json({
            success: true,
            categories: categories,
            images: allImages || [],
        });

    } catch (error) {
        console.error('Error syncing galeria:', error);
        return NextResponse.json({ error: 'Error interno de sincronización' }, { status: 500 });
    }
}

/**
 * RECURSIVE SCANNER WITH SMART FLATTENING
 */
function scanRefinedRecursively(
    rootPath: string,
    currentSubPath: string = '',
): { publicUrl: string; storagePath: string; category: string; altText: string }[] {

    let results: { publicUrl: string; storagePath: string; category: string; altText: string }[] = [];
    const fullCurrentPath = path.join(rootPath, currentSubPath);

    if (!fs.existsSync(fullCurrentPath)) return [];

    const items = fs.readdirSync(fullCurrentPath);

    for (const item of items) {
        if (IGNORED_FOLDERS.includes(item) || item.startsWith('.')) continue;

        const itemThumbPath = path.join(currentSubPath, item);
        const fullItemPath = path.join(rootPath, itemThumbPath);
        const stat = fs.statSync(fullItemPath);

        if (stat.isDirectory()) {
            // Recursion
            results = results.concat(scanRefinedRecursively(rootPath, itemThumbPath));
        } else if (isImageFile(item)) {
            // DETERMINE CATEGORY
            // Logic:
            // - If path contains 'galeria', use the folder direct child of 'galeria'.
            // - Else use direct parent folder.

            let categoryName = 'General';
            // Split reliably for both Windows and Unix
            const parts = currentSubPath.split(/[/\\]/).filter(p => p); // ['galeria', 'exterior']

            if (parts.length > 0) {
                // Find 'galeria' index
                const galeriaIndex = parts.findIndex(p => p.toLowerCase() === 'galeria');

                if (galeriaIndex !== -1 && galeriaIndex + 1 < parts.length) {
                    // Use subfolder immediately after galeria: e.g. 'exterior'
                    categoryName = capitalize(parts[galeriaIndex + 1].replace(/-/g, ' '));
                } else if (galeriaIndex === -1) {
                    // Not inside galeria, use immediate parent
                    categoryName = capitalize(parts[parts.length - 1].replace(/-/g, ' '));
                } else {
                    // Inside galeria root directly -> 'General' or keep 'Galeria'?
                    // Let's call it 'Galeria' if it's direct.
                    categoryName = 'Galeria';
                }
            }

            const publicUrl = `/images/${itemThumbPath.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/')}`;
            const storagePath = `public${publicUrl}`;

            results.push({
                publicUrl,
                storagePath,
                category: categoryName,
                // Clean alt text
                altText: item.replace(/\.[^.]+$/, '').replace(/-/g, ' ').replace(/_/g, ' ')
            });
        }
    }

    return results;
}

function isImageFile(filename: string): boolean {
    return /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(filename);
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
