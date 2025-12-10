import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Categorías válidas para la galería pública
const VALID_GALLERY_FOLDERS = ['exterior', 'interior', 'playas', 'puntos-turisticos'];

// Mapeo de carpeta a nombre de categoría para la galería
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
 * 1. Elimina registros que no son de galería (cabins, hero, proposito)
 * 2. Lee las imágenes que YA están en Supabase Storage
 * 3. Inserta los registros correctos
 * 
 * En desarrollo: acepta query param ?key=tresmorros2024
 * En producción: requiere sesión de admin
 */
export async function GET(request: NextRequest) {
    // Verificar autenticación
    const { searchParams } = new URL(request.url);
    const devKey = searchParams.get('key');
    const isDevMode = process.env.NODE_ENV === 'development';

    // En desarrollo, permitir con clave; en producción, requiere admin
    if (isDevMode && devKey === 'tresmorros2024') {
        console.log('[fix] Acceso autorizado con clave de desarrollo');
    } else {
        const isAdmin = await requireAdmin();
        if (!isAdmin) {
            return NextResponse.json({
                error: 'Unauthorized',
                hint: isDevMode ? 'Usa ?key=tresmorros2024 para ejecutar en desarrollo' : undefined
            }, { status: 401 });
        }
    }

    const results = {
        deleted: 0,
        inserted: 0,
        errors: [] as string[],
        categories: {} as Record<string, number>,
    };

    try {
        console.log('[fix] Iniciando corrección de galería...');

        // PASO 1: Eliminar TODOS los registros actuales (están mal)
        const { data: existingRecords, error: fetchError } = await (supabaseAdmin
            .from('galeria') as any)
            .select('id');

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (existingRecords && existingRecords.length > 0) {
            const ids = existingRecords.map((r: any) => r.id);
            const { error: deleteError } = await (supabaseAdmin
                .from('galeria') as any)
                .delete()
                .in('id', ids);

            if (deleteError) {
                results.errors.push(`Error eliminando: ${deleteError.message}`);
            } else {
                results.deleted = ids.length;
                console.log(`[fix] Eliminados ${ids.length} registros incorrectos`);
            }
        }

        // PASO 2: Leer imágenes del Storage y crear registros correctos
        for (const folder of VALID_GALLERY_FOLDERS) {
            const { data: files, error: listError } = await supabaseAdmin.storage
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

            // Filtrar solo imágenes
            const imageFiles = files.filter(f =>
                /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(f.name) &&
                !f.name.startsWith('.')
            );

            console.log(`[fix] ${folder}: ${imageFiles.length} imágenes encontradas`);
            results.categories[folder] = imageFiles.length;

            // Insertar cada imagen
            const categoryName = FOLDER_TO_CATEGORY[folder] || folder;
            let position = 1;

            for (const file of imageFiles) {
                const storagePath = `${folder}/${file.name}`;

                // Obtener URL pública
                const { data: urlData } = supabaseAdmin.storage
                    .from('galeria')
                    .getPublicUrl(storagePath);

                const { error: insertError } = await (supabaseAdmin
                    .from('galeria') as any)
                    .insert({
                        image_url: urlData.publicUrl,
                        storage_path: `supabase://${storagePath}`,
                        category: categoryName,
                        position: position,
                        alt_text: file.name.replace(/\.[^.]+$/, '').replace(/-/g, ' ').replace(/_/g, ' '),
                    });

                if (insertError) {
                    results.errors.push(`Error insertando ${file.name}: ${insertError.message}`);
                } else {
                    results.inserted++;
                    position++;
                }
            }
        }

        // Log evento
        await (supabaseAdmin.from('api_events') as any).insert({
            event_type: 'galeria_fixed',
            event_source: 'admin',
            payload: results,
            status: results.errors.length > 0 ? 'partial' : 'success',
        });

        console.log('[fix] Corrección completada:', results);

        return NextResponse.json({
            success: true,
            message: `Corrección completada: ${results.deleted} eliminados, ${results.inserted} insertados`,
            results,
        }, {
            headers: { 'Cache-Control': 'no-store' },
        });

    } catch (error: any) {
        console.error('[fix] Error fatal:', error);
        return NextResponse.json({
            error: error.message,
            results,
        }, { status: 500 });
    }
}
