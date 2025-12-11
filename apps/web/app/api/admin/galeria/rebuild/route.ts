import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const STORAGE_BUCKET = 'galeria';
const VALID_FOLDERS = ['exterior', 'interior', 'playas', 'puntos-turisticos', 'hero'];

const FOLDER_TO_CATEGORY: Record<string, string> = {
    'exterior': 'Exterior',
    'interior': 'Interior',
    'playas': 'Playas',
    'puntos-turisticos': 'Puntos turisticos',
    'hero': 'Hero',
};

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

/**
 * GET /api/admin/galeria/rebuild?key=tresmorros2024
 * 
 * RECONSTRUCCIÓN COMPLETA:
 * 1. Lee imagenes de Supabase Storage
 * 2. Limpia la tabla galeria
 * 3. Inserta registros para las 4 categorías
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key !== 'tresmorros2024') {
        return NextResponse.json({ error: 'Unauthorized', hint: 'Use ?key=tresmorros2024' }, { status: 401 });
    }

    // Crear cliente fresco
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

        // PASO 0: Sincronizar Local -> Storage (Subir archivos locales)
        console.log('[rebuild] Sincronizando archivos locales a Storage...');
        const localBasePath = getLocalBasePath();

        for (const folder of VALID_FOLDERS) {
            // Resolver ruta local: 'hero' está en root de images, otros en 'galeria/'
            const folderPath = folder === 'hero'
                ? path.join(localBasePath, 'hero')
                : path.join(localBasePath, 'galeria', folder);

            if (!fs.existsSync(folderPath)) continue;

            const localFiles = fs.readdirSync(folderPath);
            const imageFiles = localFiles.filter(f => isImage(f));

            for (const file of imageFiles) {
                try {
                    const filePath = path.join(folderPath, file);
                    const fileBuffer = fs.readFileSync(filePath);
                    const contentType = getContentType(file);
                    const storagePath = `${folder}/${file}`;

                    const { error: uploadError } = await supabase.storage
                        .from(STORAGE_BUCKET)
                        .upload(storagePath, fileBuffer, {
                            contentType,
                            upsert: true
                        });

                    if (uploadError) {
                        console.error(`[rebuild] Error subiendo ${file}:`, uploadError);
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
                .neq('id', '00000000-0000-0000-0000-000000000000');

            if (deleteError) {
                results.errors.push(`Delete error: ${deleteError.message}`);
            } else {
                results.deleted = allRecords.length;
                console.log(`[rebuild] Eliminados ${allRecords.length} registros`);
            }
        }

        // PASO 2: Insertar registros desde Supabase Storage
        for (const folder of VALID_FOLDERS) {
            const { data: files, error: listError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .list(folder);

            if (listError || !files) {
                results.errors.push(`List ${folder}: ${listError?.message || 'No files'}`);
                continue;
            }

            const imageFiles = files.filter(f => isImage(f.name));
            results.categories[folder] = imageFiles.length;
            console.log(`[rebuild] Storage ${folder}: ${imageFiles.length} imágenes`);

            const categoryName = FOLDER_TO_CATEGORY[folder];
            let position = 1;

            for (const file of imageFiles) {
                const storagePath = `${folder}/${file.name}`;
                const { data: urlData } = supabase.storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(storagePath);

                const { error: insertError } = await supabase
                    .from('galeria')
                    .insert({
                        image_url: urlData.publicUrl,
                        storage_path: `supabase://${storagePath}`,
                        category: categoryName,
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
            message: `Reconstrucción: ${results.uploaded} subidas, ${results.inserted} insertadas, ${results.deleted} eliminadas`,
            results,
        });

    } catch (error: any) {
        console.error('[rebuild] Error:', error);
        return NextResponse.json({ error: error.message, results }, { status: 500 });
    }
}
