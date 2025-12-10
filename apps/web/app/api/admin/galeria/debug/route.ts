import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/galeria/debug
 * Endpoint de diagnóstico para ver el estado de la galería
 */
export async function GET() {
    // Crear cliente nuevo para evitar caching
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({
            error: 'Missing env vars',
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseKey,
        }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
        // Obtener todos los registros
        const { data: allRecords, error } = await (supabaseAdmin
            .from('galeria') as any)
            .select('id, image_url, category, storage_path, position, alt_text')
            .order('category')
            .order('position');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Agrupar por categoría
        const categories = new Map<string, number>();
        for (const row of allRecords || []) {
            const count = categories.get(row.category) || 0;
            categories.set(row.category, count + 1);
        }

        // Verificar bucket de storage
        let bucketInfo = null;
        try {
            const { data: bucket } = await supabaseAdmin.storage.getBucket('galeria');
            bucketInfo = bucket ? { exists: true, public: bucket.public } : { exists: false };
        } catch (e) {
            bucketInfo = { exists: false, error: String(e) };
        }

        // Listar archivos en storage
        let storageFiles: any = {};
        try {
            const folders = ['exterior', 'interior', 'playas', 'puntos-turisticos'];
            for (const folder of folders) {
                const { data: files } = await supabaseAdmin.storage
                    .from('galeria')
                    .list(folder);
                if (files && files.length > 0) {
                    storageFiles[folder] = files.length;
                }
            }
        } catch (e) {
            storageFiles = { error: String(e) };
        }

        return NextResponse.json({
            totalRecords: allRecords?.length || 0,
            categories: Object.fromEntries(categories),
            storage: {
                bucket: bucketInfo,
                files: storageFiles,
            },
            sampleRecords: allRecords?.slice(0, 5),
        }, {
            headers: {
                'Cache-Control': 'no-store',
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
