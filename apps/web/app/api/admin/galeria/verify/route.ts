import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

// Helper to get correct base path for images (handles monorepo context)
const getPublicImagesBase = () => {
    const monorepoPath = path.join(process.cwd(), 'apps', 'web', 'public', 'images');
    if (fs.existsSync(monorepoPath)) {
        return monorepoPath;
    }
    return path.join(process.cwd(), 'public', 'images');
};

const getPublicPath = () => {
    const monorepoPath = path.join(process.cwd(), 'apps', 'web', 'public');
    if (fs.existsSync(monorepoPath)) {
        return monorepoPath;
    }
    return path.join(process.cwd(), 'public');
};

// Base paths
const PUBLIC_IMAGES_BASE = getPublicImagesBase();
const GALERIA_PATH = path.join(PUBLIC_IMAGES_BASE, 'galeria');

// Folders to scan (relative to public/images)
const SCAN_FOLDERS = ['galeria', 'cabins', 'hero', 'proposito'];

type VerificationResult = {
    isValid: boolean;
    filesystemCount: number;
    databaseCount: number;
    missingInDb: string[];
    orphanedInDb: string[];
    categories: {
        name: string;
        slug: string;
        filesystemCount: number;
        databaseCount: number;
        isValid: boolean;
    }[];
};

/**
 * GET /api/admin/galeria/verify
 * Verify synchronization between filesystem and database
 * Returns detailed report of any discrepancies
 */
export async function GET(request: NextRequest) {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await verifyIntegrity();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error verifying galeria:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

/**
 * POST /api/admin/galeria/verify
 * Verify and automatically fix any discrepancies
 */
export async function POST(request: NextRequest) {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // First verify
        const verifyResult = await verifyIntegrity();

        if (verifyResult.isValid) {
            return NextResponse.json({
                success: true,
                message: 'Todo está sincronizado correctamente',
                ...verifyResult,
            });
        }

        // Fix missing files in DB
        let added = 0;
        for (const missingPath of verifyResult.missingInDb) {
            const result = await addMissingToDatabase(missingPath);
            if (result) added++;
        }

        // Remove orphaned records from DB
        let removed = 0;
        for (const orphanedUrl of verifyResult.orphanedInDb) {
            const result = await removeOrphanedFromDatabase(orphanedUrl);
            if (result) removed++;
        }

        // Verify again
        const finalResult = await verifyIntegrity();

        // Log event
        await (supabaseAdmin.from('api_events') as any).insert({
            event_type: 'galeria_verified_and_fixed',
            event_source: 'admin',
            payload: { added, removed, isValid: finalResult.isValid },
            status: 'success',
        });

        return NextResponse.json({
            success: true,
            message: `Sincronización completada. Añadidos: ${added}, Eliminados: ${removed}`,
            added,
            removed,
            ...finalResult,
        });
    } catch (error) {
        console.error('Error fixing galeria:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

/**
 * Verify integrity between filesystem and database
 */
async function verifyIntegrity(): Promise<VerificationResult> {
    // Get all files from filesystem
    const filesystemImages = scanFilesystem();

    // Get all records from database
    const { data: dbRecords } = await (supabaseAdmin
        .from('galeria') as any)
        .select('id, image_url, storage_path, category, position');

    const dbImages = (dbRecords || []) as any[];

    // Create sets for comparison
    const filesystemSet = new Set(filesystemImages.map(f => f.publicUrl));
    const dbSet = new Set(dbImages.map((r: any) => r.image_url));

    // Find discrepancies
    const missingInDb: string[] = [];
    const orphanedInDb: string[] = [];

    // Files in filesystem but not in DB
    for (const file of filesystemImages) {
        if (!dbSet.has(file.publicUrl)) {
            missingInDb.push(file.publicUrl);
        }
    }

    // Records in DB but file doesn't exist
    for (const record of dbImages) {
        const url = record.image_url as string;
        if (!filesystemSet.has(url)) {
            // Double check the file actually doesn't exist
            const localPath = urlToLocalPath(url);
            if (!fs.existsSync(localPath)) {
                orphanedInDb.push(url);
            }
        }
    }

    // Build category summary
    const categoryStats = new Map<string, { fs: number; db: number }>();

    for (const file of filesystemImages) {
        const existing = categoryStats.get(file.category) || { fs: 0, db: 0 };
        existing.fs++;
        categoryStats.set(file.category, existing);
    }

    for (const record of dbImages) {
        const cat = record.category as string;
        const existing = categoryStats.get(cat) || { fs: 0, db: 0 };
        existing.db++;
        categoryStats.set(cat, existing);
    }

    const categories = Array.from(categoryStats.entries()).map(([name, stats]) => ({
        name,
        slug: toSlugSegment(name),
        filesystemCount: stats.fs,
        databaseCount: stats.db,
        isValid: stats.fs === stats.db,
    }));

    const isValid = missingInDb.length === 0 && orphanedInDb.length === 0;

    return {
        isValid,
        filesystemCount: filesystemImages.length,
        databaseCount: dbImages.length,
        missingInDb,
        orphanedInDb,
        categories,
    };
}

/**
 * Scan filesystem for all images
 */
function scanFilesystem(): { publicUrl: string; localPath: string; category: string }[] {
    const images: { publicUrl: string; localPath: string; category: string }[] = [];

    for (const folder of SCAN_FOLDERS) {
        const folderPath = path.join(PUBLIC_IMAGES_BASE, folder);
        if (!fs.existsSync(folderPath)) continue;

        const items = fs.readdirSync(folderPath);

        for (const item of items) {
            const itemPath = path.join(folderPath, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                // Subfolder - scan for images
                const subImages = fs.readdirSync(itemPath);
                for (const subItem of subImages) {
                    if (isImageFile(subItem)) {
                        const categoryName = `${capitalize(folder)} - ${capitalize(item.replace(/-/g, ' '))}`;
                        images.push({
                            publicUrl: `/images/${folder}/${item}/${subItem}`,
                            localPath: path.join(itemPath, subItem),
                            category: categoryName,
                        });
                    }
                }
            } else if (isImageFile(item)) {
                // Direct image in folder
                const categoryName = capitalize(folder);
                images.push({
                    publicUrl: `/images/${folder}/${item}`,
                    localPath: itemPath,
                    category: categoryName,
                });
            }
        }
    }

    return images;
}

/**
 * Add missing file to database
 */
async function addMissingToDatabase(publicUrl: string): Promise<boolean> {
    // Parse category from URL
    const parts = publicUrl.replace('/images/', '').split('/');
    let category: string;

    if (parts.length >= 3) {
        // /images/galeria/interior/file.jpg -> "Galeria - Interior"
        category = `${capitalize(parts[0])} - ${capitalize(parts[1].replace(/-/g, ' '))}`;
    } else {
        // /images/exterior/file.jpg -> "Exterior"
        category = capitalize(parts[0]);
    }

    // Get next position
    const { data: existing } = await (supabaseAdmin
        .from('galeria') as any)
        .select('position')
        .eq('category', category);

    const positions = (existing || []).map((item: any) => item.position ?? 0);
    const position = positions.length > 0 ? Math.max(...positions) + 1 : 1;

    // Extract filename for alt text
    const fileName = parts[parts.length - 1];
    const altText = fileName.replace(/\.[^.]+$/, '').replace(/-/g, ' ');

    const { error } = await (supabaseAdmin
        .from('galeria') as any)
        .insert({
            image_url: publicUrl,
            storage_path: `public${publicUrl}`,
            category,
            position,
            alt_text: altText,
        });

    return !error;
}

/**
 * Remove orphaned record from database
 */
async function removeOrphanedFromDatabase(imageUrl: string): Promise<boolean> {
    const { error } = await (supabaseAdmin
        .from('galeria') as any)
        .delete()
        .eq('image_url', imageUrl);

    return !error;
}

/**
 * Convert public URL to local filesystem path
 */
function urlToLocalPath(url: string): string {
    // /images/galeria/interior/file.jpg -> apps/web/public/images/galeria/interior/file.jpg
    if (url.startsWith('/images/')) {
        return path.join(getPublicPath(), url);
    }
    return url;
}

function isImageFile(filename: string): boolean {
    return /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(filename);
}

function capitalize(str: string): string {
    return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function toSlugSegment(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'general';
}
