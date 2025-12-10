import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const VALID_GALLERY_FOLDERS = ['exterior', 'interior', 'playas', 'puntos-turisticos'];

const FOLDER_TO_CATEGORY: Record<string, string> = {
    'exterior': 'Exterior',
    'interior': 'Interior',
    'playas': 'Playas',
    'puntos-turisticos': 'Puntos turisticos',
};

/**
 * GET /api/admin/galeria/fix?key=tresmorros2024
 * 
 * Corrige la tabla galeria:
 * 1. Elimina todos los registros
 * 2. Lee las imágenes de Supabase Storage
 * 3. Inserta los registros correctos
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key !== 'tresmorros2024') {
        return NextResponse.json({
            error: 'Unauthorized',
            hint: 'Use ?key=tresmorros2024'
        }, { status: 401 });
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
        deleted: 0,
        inserted: 0,
        errors: [] as string[],
        categories: {} as Record<string, number>,
    };

    try {
        console.log('[fix] Iniciando corrección de galería...');

        // PASO 1: Eliminar TODOS los registros
        const { data: existingRecords } = await supabase
            .from('galeria')
            .select('id');

        if (existingRecords && existingRecords.length > 0) {
            const { error: deleteError } = await supabase
                .from('galeria')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');

            if (deleteError) {
                results.errors.push(`Error eliminando: ${deleteError.message}`);
            } else {
                results.deleted = existingRecords.length;
                console.log(`[fix] Eliminados ${existingRecords.length} registros`);
            }
        }

        // PASO 2: Leer imágenes del Storage y crear registros
        for (const folder of VALID_GALLERY_FOLDERS) {
            const { data: files, error: listError } = await supabase.storage
                .from('galeria')
                .list(folder);

            if (listError) {
                results.errors.push(`Error listando ${folder}: ${listError.message}`);
                continue;
            }

            if (!files || files.length === 0) {
                console.log(`[fix] No hay archivos en ${folder}`);
                continue;
            }

            const imageFiles = files.filter(f =>
                /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(f.name) &&
                !f.name.startsWith('.')
            );

            console.log(`[fix] ${folder}: ${imageFiles.length} imágenes`);
            results.categories[folder] = imageFiles.length;

            const categoryName = FOLDER_TO_CATEGORY[folder];
            let position = 1;

            for (const file of imageFiles) {
                const storagePath = `${folder}/${file.name}`;
                const { data: urlData } = supabase.storage
                    .from('galeria')
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
            event_type: 'galeria_fixed',
            event_source: 'admin',
            payload: results,
            status: results.errors.length > 0 ? 'partial' : 'success',
        });

        console.log('[fix] Corrección completada:', results);

        return NextResponse.json({
            success: true,
            message: `Corrección: ${results.deleted} eliminados, ${results.inserted} insertados`,
            results,
        }, {
            headers: { 'Cache-Control': 'no-store' },
        });

    } catch (error: any) {
        console.error('[fix] Error:', error);
        return NextResponse.json({ error: error.message, results }, { status: 500 });
    }
}
