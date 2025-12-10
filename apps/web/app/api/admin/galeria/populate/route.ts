import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const VALID_FOLDERS = ['exterior', 'interior', 'playas', 'puntos-turisticos'];
const FOLDER_TO_CATEGORY: Record<string, string> = {
    'exterior': 'Exterior',
    'interior': 'Interior',
    'playas': 'Playas',
    'puntos-turisticos': 'Puntos turisticos',
};

/**
 * GET /api/admin/galeria/populate?key=tresmorros2024
 * 
 * DIAGNÓSTICO Y POBLADO DIRECTO:
 * 1. Muestra estado actual
 * 2. Elimina registros existentes
 * 3. Inserta desde Storage
 * 4. Verifica resultado
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key !== 'tresmorros2024') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({
            error: 'Missing env vars',
            url: !!supabaseUrl,
            key: !!supabaseKey,
        }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const log: any[] = [];

    try {
        // PASO 1: Estado inicial
        const { data: before, error: beforeErr } = await supabase
            .from('galeria')
            .select('id, category');

        log.push({
            step: '1_estado_inicial',
            count: before?.length || 0,
            error: beforeErr?.message,
        });

        // PASO 2: Eliminar TODO con condición diferente
        if (before && before.length > 0) {
            // Intentar eliminar uno por uno
            for (const record of before) {
                const { error } = await supabase
                    .from('galeria')
                    .delete()
                    .eq('id', record.id);
                if (error) {
                    log.push({ step: '2_delete_error', id: record.id, error: error.message });
                }
            }
            log.push({ step: '2_eliminados', count: before.length });
        } else {
            log.push({ step: '2_nada_que_eliminar' });
        }

        // PASO 3: Listar Storage
        const storageInfo: any = {};
        for (const folder of VALID_FOLDERS) {
            const { data: files, error } = await supabase.storage
                .from('galeria')
                .list(folder);

            if (error) {
                storageInfo[folder] = { error: error.message };
            } else {
                const images = files?.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f.name) && !f.name.startsWith('.')) || [];
                storageInfo[folder] = { count: images.length, files: images.map(f => f.name) };
            }
        }
        log.push({ step: '3_storage', info: storageInfo });

        // PASO 4: Insertar registros
        let inserted = 0;
        const insertErrors: string[] = [];

        for (const folder of VALID_FOLDERS) {
            const { data: files } = await supabase.storage
                .from('galeria')
                .list(folder);

            if (!files) continue;

            const images = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f.name) && !f.name.startsWith('.'));
            const categoryName = FOLDER_TO_CATEGORY[folder];
            let position = 1;

            for (const file of images) {
                const storagePath = `${folder}/${file.name}`;
                const { data: urlData } = supabase.storage
                    .from('galeria')
                    .getPublicUrl(storagePath);

                const record = {
                    image_url: urlData.publicUrl,
                    storage_path: `supabase://${storagePath}`,
                    category: categoryName,
                    position: position++,
                    alt_text: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
                };

                const { error } = await supabase.from('galeria').insert(record);

                if (error) {
                    insertErrors.push(`${file.name}: ${error.message}`);
                } else {
                    inserted++;
                }
            }
        }
        log.push({ step: '4_insertados', count: inserted, errors: insertErrors });

        // PASO 5: Verificar resultado final
        const { data: after, error: afterErr } = await supabase
            .from('galeria')
            .select('id, category, image_url')
            .order('category');

        const categoryCounts: any = {};
        for (const row of after || []) {
            categoryCounts[row.category] = (categoryCounts[row.category] || 0) + 1;
        }

        log.push({
            step: '5_resultado_final',
            totalRecords: after?.length || 0,
            categories: categoryCounts,
            error: afterErr?.message,
            sample: after?.slice(0, 2),
        });

        return NextResponse.json({
            success: inserted > 0,
            message: `Poblado: ${inserted} registros insertados`,
            log,
        });

    } catch (error: any) {
        log.push({ step: 'ERROR', message: error.message, stack: error.stack });
        return NextResponse.json({ error: error.message, log }, { status: 500 });
    }
}
