import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
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
const STORAGE_BUCKET = 'galeria';

/**
 * POST /api/admin/galeria/sync
 * MASTER SYNC: Makes the DB exactly match the Filesystem/Storage.
 * - Adds missing images.
 * - Removes orphaned local images (dev only).
 * - Smart Category Naming: 'galeria/exterior' -> 'Exterior'.
 */
export async function POST(request: NextRequest) {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

        const { data: dbRecords, error: dbError } = await supabaseAdmin
            .from('galeria')
            .select('id, image_url, storage_path, category, position');

        if (dbError) throw dbError;

        let syncStats = { added: 0, deleted: 0, updated: 0 };

        if (isProduction) {
            console.log('[sync] Produccion detectada: sincronizando Supabase Storage -> DB.');
            const storageImages = await scanSupabaseStorage(supabaseAdmin);
            syncStats = await syncImages(storageImages, dbRecords || [], supabaseAdmin, { allowDeletes: false });
        } else {
            console.log('[sync] Desarrollo detectado: sincronizando filesystem -> DB.');
            const filesystemImages = scanRefinedRecursively(PUBLIC_IMAGES_PATH);
            syncStats = await syncImages(filesystemImages, dbRecords || [], supabaseAdmin, { allowDeletes: true });
        }

        if (syncStats.added > 0 || syncStats.deleted > 0 || syncStats.updated > 0) {
            await supabaseAdmin.from('api_events').insert({
                event_type: 'galeria_synced_master',
                event_source: 'admin',
                payload: {
                    added: syncStats.added,
                    deleted: syncStats.deleted,
                    updated: syncStats.updated,
                    mode: isProduction ? 'storage' : 'filesystem',
                },
                status: 'success',
            });
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
        return NextResponse.json({ error: 'Error interno de sincronizacion' }, { status: 500 });
    }
}

/**
 * RECURSIVE SCANNER WITH SMART FLATTENING (local filesystem)
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
            results = results.concat(scanRefinedRecursively(rootPath, itemThumbPath));
        } else if (isImageFile(item)) {
            const publicUrl = `/images/${itemThumbPath.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/')}`;
            const storagePath = `public${publicUrl}`;

            results.push({
                publicUrl,
                storagePath,
                category: deriveCategoryFromPath(currentSubPath),
                altText: cleanAltText(item)
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

type ScannedImage = {
    publicUrl: string;
    storagePath: string;
    category: string;
    altText: string;
};

type SyncOptions = {
    allowDeletes: boolean;
};

/**
 * Sync a list of scanned images with the galeria table
 */
async function syncImages(
    images: ScannedImage[],
    dbRecords: any[],
    client: SupabaseClient,
    options: SyncOptions
) {
    const toInsert: ScannedImage[] = [];
    const toUpdateCategory: { id: string; category: string }[] = [];
    const toDeleteIds: string[] = [];

    const dbByStoragePath = new Map<string, any>();
    const dbByUrl = new Map<string, any>();

    for (const record of dbRecords || []) {
        if (record.storage_path) dbByStoragePath.set(record.storage_path, record);
        if (record.image_url) dbByUrl.set(record.image_url, record);
    }

    for (const img of images) {
        const matched = dbByStoragePath.get(img.storagePath) || dbByUrl.get(img.publicUrl);
        if (!matched) {
            toInsert.push(img);
        } else if (matched.category !== img.category) {
            toUpdateCategory.push({ id: matched.id, category: img.category });
        }
    }

    if (options.allowDeletes) {
        const sourceUrls = new Set(images.map((img) => img.publicUrl));
        for (const record of dbRecords || []) {
            const url = record.image_url as string;
            if (url?.startsWith('/images/') && !sourceUrls.has(url)) {
                toDeleteIds.push(record.id);
            }
        }
    }

    if (toDeleteIds.length > 0) {
        await client.from('galeria').delete().in('id', toDeleteIds);
        console.log(`Deleted ${toDeleteIds.length} orphaned images.`);
    }

    if (toInsert.length > 0) {
        const categoryPositions = buildCategoryPositions(dbRecords);
        const sortedToInsert = [...toInsert].sort((a, b) => (a.category + a.storagePath).localeCompare(b.category + b.storagePath));

        const batches: any[] = [];
        let batch: any[] = [];
        const maxBatch = 50;

        for (const img of sortedToInsert) {
            const nextPos = (categoryPositions.get(img.category) || 0) + 1;
            categoryPositions.set(img.category, nextPos);

            batch.push({
                image_url: img.publicUrl,
                storage_path: img.storagePath,
                category: img.category,
                position: nextPos,
                alt_text: img.altText,
                status: 'synced',
            });

            if (batch.length >= maxBatch) {
                batches.push(batch);
                batch = [];
            }
        }
        if (batch.length > 0) batches.push(batch);

        for (const b of batches) {
            await client.from('galeria').insert(b);
        }
        console.log(`Inserted ${toInsert.length} new images.`);
    }

    if (toUpdateCategory.length > 0) {
        for (const update of toUpdateCategory) {
            await client
                .from('galeria')
                .update({ category: update.category })
                .eq('id', update.id);
        }
        console.log(`Updated category for ${toUpdateCategory.length} images.`);
    }

    return {
        added: toInsert.length,
        deleted: toDeleteIds.length,
        updated: toUpdateCategory.length,
    };
}

function buildCategoryPositions(records: any[]): Map<string, number> {
    const positions = new Map<string, number>();
    for (const rec of records || []) {
        const current = positions.get(rec.category) || 0;
        const pos = rec.position || 0;
        if (pos > current) positions.set(rec.category, pos);
    }
    return positions;
}

/**
 * Scan the Supabase Storage bucket recursively and return normalized image metadata
 */
async function scanSupabaseStorage(
    client: SupabaseClient,
    prefix = '',
    seen = new Set<string>()
): Promise<ScannedImage[]> {
    const { data, error } = await client.storage.from(STORAGE_BUCKET).list(prefix, { limit: 1000 });
    if (error) {
        console.error('[sync] Error listing storage path', prefix, error);
        return [];
    }

    let results: ScannedImage[] = [];

    for (const item of data || []) {
        const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
        if (!itemPath) continue;

        if (isImageFile(item.name)) {
            const normalized = normalizeStoragePath(itemPath);
            if (seen.has(normalized)) continue;
            seen.add(normalized);

            const { data: urlData } = client.storage.from(STORAGE_BUCKET).getPublicUrl(itemPath);
            results.push({
                publicUrl: urlData.publicUrl,
                storagePath: `supabase://${itemPath}`,
                category: deriveCategoryFromPath(itemPath),
                altText: cleanAltText(item.name),
            });
        } else {
            const nested = await scanSupabaseStorage(client, itemPath, seen);
            results = results.concat(nested);
        }
    }

    return results;
}

function deriveCategoryFromPath(relativePath: string): string {
    const parts = relativePath.split(/[/\\]/).filter((p) => p);

    // Remove filename if present
    if (parts.length > 0 && /\.[^.]+$/.test(parts[parts.length - 1])) {
        parts.pop();
    }

    if (parts.length === 0) return 'General';

    const galeriaIndex = parts.findIndex((p) => p.toLowerCase() === 'galeria');
    const cabinsIndex = parts.findIndex((p) => p.toLowerCase() === 'cabins');

    if (galeriaIndex !== -1 && galeriaIndex + 1 < parts.length) {
        return capitalize(parts[galeriaIndex + 1].replace(/-/g, ' '));
    }
    if (cabinsIndex !== -1 && cabinsIndex + 1 < parts.length) {
        return `Cabaña - ${capitalize(parts[cabinsIndex + 1].replace(/-/g, ' '))}`;
    }
    return capitalize(parts[parts.length - 1].replace(/-/g, ' '));
}

function cleanAltText(filename: string): string {
    return filename.replace(/\.[^.]+$/, '').replace(/-/g, ' ').replace(/_/g, ' ');
}

function normalizeStoragePath(pathname: string): string {
    return pathname.replace(/^galeria[/\\]/i, '').toLowerCase();
}
