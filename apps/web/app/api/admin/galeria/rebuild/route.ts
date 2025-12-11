import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const STORAGE_BUCKET = 'galeria';

// Helper to format category names (caleta-del-medio -> Caleta Del Medio)
function formatCategoryName(slug: string): string {
    return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getLocalBasePath() {
    const mono = path.join(process.cwd(), 'apps', 'web', 'public', 'images');
    if (fs.existsSync(mono)) return mono;
    return path.join(process.cwd(), 'public', 'images');
}

function isImage(name: string) {
    return /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(name) && !name.startsWith('.');
}

function getContentType(name: string) {
    const ext = name.toLowerCase().split('.').pop();
    const types: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
        webp: 'image/webp', gif: 'image/gif', avif: 'image/avif',
    };
    return types[ext || ''] || 'application/octet-stream';
}

interface SyncJob {
    localPath: string;
    storageFolder: string;
    category: string;
}

function getSyncJobs(): SyncJob[] {
    const basePath = getLocalBasePath();
    const jobs: SyncJob[] = [];

    // 1. Hero
    jobs.push({
        localPath: path.join(basePath, 'hero'),
        storageFolder: 'hero',
        category: 'Hero'
    });

    // 2. Proposito
    jobs.push({
        localPath: path.join(basePath, 'proposito'),
        storageFolder: 'proposito',
        category: 'Proposito'
    });

    // 3. Galeria Standard Folders
    const galeriaFolders = ['exterior', 'interior', 'playas', 'puntos-turisticos'];
    const folderToCat: Record<string, string> = {
        'exterior': 'Exterior',
        'interior': 'Interior',
        'playas': 'Playas',
        'puntos-turisticos': 'Puntos turisticos',
    };

    for (const f of galeriaFolders) {
        jobs.push({
            localPath: path.join(basePath, 'galeria', f),
            storageFolder: f, // Matches legacy structure: root relative in bucket
            category: folderToCat[f]
        });
    }

    // 4. Cabins (Dynamic Subfolders)
    const cabinsPath = path.join(basePath, 'cabins');
    if (fs.existsSync(cabinsPath)) {
        const cabinDirs = fs.readdirSync(cabinsPath).filter(f => {
            try {
                return fs.statSync(path.join(cabinsPath, f)).isDirectory();
            } catch { return false; }
        });

        for (const c of cabinDirs) {
            jobs.push({
                localPath: path.join(cabinsPath, c),
                storageFolder: `cabins/${c}`,
                category: `Cabaña ${formatCategoryName(c)}`
            });
        }
    }

    return jobs;
}

/**
 * GET /api/admin/galeria/rebuild?key=tresmorros2024
 * 
 * RECONSTRUCCIÓN COMPLETA:
 * 1. Lee imagenes de Supabase Storage (y sube las locales faltantes/actualizadas)
 * 2. Limpia la tabla galeria
 * 3. Inserta registros para todas las categorías
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key !== 'tresmorros2024') {
        return NextResponse.json({ error: 'Unauthorized', hint: 'Use ?key=tresmorros2024' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const results = {
        uploaded: 0,
        skipped: 0,
        inserted: 0,
        deleted: 0,
        errors: [] as string[],
        categories: {} as Record<string, number>,
    };

    try {
        console.log('[rebuild] Iniciando reconstrucción...');
        const jobs = getSyncJobs();

        // PASO 0: Sincronizar Local -> Storage
        console.log('[rebuild] Sincronizando archivos locales a Storage...');

        for (const job of jobs) {
            if (!fs.existsSync(job.localPath)) {
                console.log(`[rebuild] Skipping job, path not found: ${job.localPath}`);
                continue;
            }

            const localFiles = fs.readdirSync(job.localPath).filter(f => isImage(f));

            for (const file of localFiles) {
                try {
                    const filePath = path.join(job.localPath, file);
                    const fileBuffer = fs.readFileSync(filePath);
                    const contentType = getContentType(file);
                    const storagePath = `${job.storageFolder}/${file}`;

                    const { error: uploadError } = await supabase.storage
                        .from(STORAGE_BUCKET)
                        .upload(storagePath, fileBuffer, {
                            contentType,
                            upsert: true
                        });

                    if (uploadError) {
                        console.error(`[rebuild] Error subiendo ${storagePath}:`, uploadError);
                        results.errors.push(`Upload ${file}: ${uploadError.message}`);
                    } else {
                        results.uploaded++;
                    }
                } catch (err: any) {
                    results.errors.push(`Local read error ${file}: ${err.message}`);
                }
            }
        }

        // PASO 1: Limpiar tabla galeria COMPLETAMENTE
        const { data: allRecords } = await supabase.from('galeria').select('id');
        if (allRecords && allRecords.length > 0) {
            const { error: deleteError } = await supabase
                .from('galeria')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete distinct from nothing

            if (deleteError) {
                results.errors.push(`Delete error: ${deleteError.message}`);
            } else {
                results.deleted = allRecords.length;
                console.log(`[rebuild] Eliminados ${allRecords.length} registros`);
            }
        }

        // PASO 2: Insertar registros desde Supabase Storage
        for (const job of jobs) {
            // List files in the storage folder
            const { data: files, error: listError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .list(job.storageFolder, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'name', order: 'asc' },
                });

            if (listError || !files) {
                // If folder is empty or doesn't exist in storage yet (and no local files uploaded), this might fail or return empty
                // Note: .list() on a non-existent folder often returns empty list, which is fine.
                if (listError) results.errors.push(`List ${job.storageFolder}: ${listError.message}`);
                continue;
            }

            const imageFiles = files.filter(f => isImage(f.name));
            results.categories[job.category] = (results.categories[job.category] || 0) + imageFiles.length;

            console.log(`[rebuild] Storage ${job.storageFolder} -> Cat '${job.category}': ${imageFiles.length} imágenes`);

            let position = 1;

            for (const file of imageFiles) {
                const storagePath = `${job.storageFolder}/${file.name}`;
                const { data: urlData } = supabase.storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(storagePath);

                const { error: insertError } = await supabase
                    .from('galeria')
                    .insert({
                        image_url: urlData.publicUrl,
                        storage_path: `supabase://${storagePath}`,
                        category: job.category,
                        position: position++,
                        alt_text: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
                    });

                if (insertError) {
                    results.errors.push(`Insert ${file.name}: ${insertError.message}`);
                } else {
                    results.inserted++;
                }
            }
        }

        // Log evento
        await supabase.from('api_events').insert({
            event_type: 'galeria_rebuilt',
            event_source: 'admin',
            payload: results,
            status: results.errors.length > 0 ? 'partial' : 'success',
        });

        console.log('[rebuild] Completado:', results);

        return NextResponse.json({
            success: true,
            message: `Reconstrucción completada`,
            results,
        });

    } catch (error: any) {
        console.error('[rebuild] Error:', error);
        return NextResponse.json({ error: error.message, results }, { status: 500 });
    }
}
