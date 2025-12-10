import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const STORAGE_BUCKET = 'galeria';
const VALID_FOLDERS = ['exterior', 'interior', 'playas', 'puntos-turisticos'];

const FOLDER_TO_CATEGORY: Record<string, string> = {
    'exterior': 'Exterior',
    'interior': 'Interior',
    'playas': 'Playas',
    'puntos-turisticos': 'Puntos turisticos',
};

function getLocalPath() {
    const mono = path.join(process.cwd(), 'apps', 'web', 'public', 'images', 'galeria');
    if (fs.existsSync(mono)) return mono;
    return path.join(process.cwd(), 'public', 'images', 'galeria');
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
 * 1. Sube TODAS las imágenes locales a Supabase Storage
 * 2. Limpia la tabla galeria
 * 3. Inserta registros para las 4 categorías
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key !== 'tresmorros2024') {
        return NextResponse.json({ error: 'Unauthorized', hint: 'Use ?key=tresmorros2024' }, { status: 401 });
    }

    const results = {
        uploaded: 0,
        skipped: 0,
        inserted: 0,
        deleted: 0,
        errors: [] as string[],
        categories: {} as Record<string, number>,
    };

    try {
        const basePath = getLocalPath();
        console.log('[rebuild] Base path:', basePath);

        // PASO 1: Subir imágenes locales a Supabase Storage
        for (const folder of VALID_FOLDERS) {
            const folderPath = path.join(basePath, folder);

            if (!fs.existsSync(folderPath)) {
                results.errors.push(`Carpeta no existe: ${folder}`);
                continue;
            }

            const files = fs.readdirSync(folderPath).filter(isImage);
            console.log(`[rebuild] ${folder}: ${files.length} archivos`);

            for (const fileName of files) {
                const filePath = path.join(folderPath, fileName);
                const storagePath = `${folder}/${fileName}`;

                try {
                    // Verificar si ya existe
                    const { data: existing } = await supabaseAdmin.storage
                        .from(STORAGE_BUCKET)
                        .list(folder, { search: fileName });

                    if (existing?.some(f => f.name === fileName)) {
                        results.skipped++;
                        continue;
                    }

                    // Subir archivo
                    const buffer = fs.readFileSync(filePath);
                    const { error: uploadError } = await supabaseAdmin.storage
                        .from(STORAGE_BUCKET)
                        .upload(storagePath, buffer, {
                            contentType: getContentType(fileName),
                            upsert: true,
                        });

                    if (uploadError) {
                        results.errors.push(`Upload ${storagePath}: ${uploadError.message}`);
                    } else {
                        results.uploaded++;
                    }
                } catch (e: any) {
                    results.errors.push(`Error ${fileName}: ${e.message}`);
                }
            }
        }

        // PASO 2: Limpiar tabla galeria COMPLETAMENTE
        const { data: allRecords } = await (supabaseAdmin.from('galeria') as any).select('id');
        if (allRecords && allRecords.length > 0) {
            const ids = allRecords.map((r: any) => r.id);
            await (supabaseAdmin.from('galeria') as any).delete().in('id', ids);
            results.deleted = ids.length;
            console.log(`[rebuild] Eliminados ${ids.length} registros`);
        }

        // PASO 3: Insertar registros desde Supabase Storage
        for (const folder of VALID_FOLDERS) {
            const { data: files, error: listError } = await supabaseAdmin.storage
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
                const { data: urlData } = supabaseAdmin.storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(storagePath);

                const { error: insertError } = await (supabaseAdmin.from('galeria') as any)
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
        await (supabaseAdmin.from('api_events') as any).insert({
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
