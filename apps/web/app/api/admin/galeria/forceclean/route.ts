import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/galeria/forceclean?key=tresmorros2024
 * 
 * Limpia FORZADAMENTE la tabla galeria creando un cliente nuevo
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
        return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
    }

    // Crear cliente FRESCO
    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const results: any = { steps: [] };

    try {
        // Paso 1: Ver qué hay
        const { data: before, error: err1 } = await supabase
            .from('galeria')
            .select('id, category')
            .limit(100);

        results.steps.push({ step: 'before', count: before?.length, categories: Array.from(new Set(before?.map(r => r.category) || [])) });

        if (err1) {
            results.steps.push({ step: 'error_fetch', error: err1.message });
        }

        // Paso 2: Eliminar TODO
        if (before && before.length > 0) {
            const { error: deleteErr } = await supabase
                .from('galeria')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Match all

            if (deleteErr) {
                results.steps.push({ step: 'delete_error', error: deleteErr.message });
            } else {
                results.steps.push({ step: 'deleted', count: before.length });
            }
        }

        // Paso 3: Verificar que se eliminó
        const { data: after } = await supabase
            .from('galeria')
            .select('id')
            .limit(100);

        results.steps.push({ step: 'after', count: after?.length });

        return NextResponse.json(results);

    } catch (error: any) {
        return NextResponse.json({ error: error.message, results }, { status: 500 });
    }
}
