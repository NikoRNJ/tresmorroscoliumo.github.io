import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const STORAGE_BUCKET = 'galeria';

// Mapeos de carpeta -> Categoría
// Las claves son rutas relativas desde public/images
const FOLDER_MAP: Record<string, string> = {
    'galeria/exterior': 'Exterior',
    'galeria/interior': 'Interior',
    'galeria/playas': 'Playas',
    'galeria/puntos-turisticos': 'Puntos turisticos',
    'hero': 'Hero',
    'proposito': 'Proposito',
    'cabins/caleta-del-medio': 'Cabaña - Caleta del Medio',
    'cabins/los-morros': 'Cabaña - Los Morros',
    'cabins/vegas-del-coliumo': 'Cabaña - Vegas del Coliumo',
    'common': 'Otros',
};

function getLocalBasePath() {
    // Intentar encontrar la raíz de images
    const paths = [
        path.join(process.cwd(), 'apps', 'web', 'public', 'images'),
        path.join(process.cwd(), 'public', 'images')
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

function getContentType(filename: string) {
    const ext = filename.toLowerCase().split('.').pop();
    const map: Record<string, string> = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp'
    };
    return map[ext || ''] || 'application/octet-stream';
}

/**
 * GET /api/admin/galeria/full-sync?key=tresmorros2024
 * 
 * Sincronización MAESTRA (Local -> Producción):
 * 1. Lee TODAS las imágenes locales (hero, cabins, galeria, etc).
 * 2. Las sube a Supabase Storage si no existen.
 * 3. Actualiza la tabla galeria.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('key') !== 'tresmorros2024') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'Config error' }, { status: 500 });

    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const basePath = getLocalBasePath();
    if (!basePath) return NextResponse.json({ error: 'No se encontró carpeta images local' }, { status: 404 });

    const log: any[] = [];
    const stats = { uploaded: 0, skipped: 0, errors: 0, db_inserted: 0 };

    try {
        console.log('[full-sync] Iniciando sincronización maestra...');

        // 1. Limpiar DB (opcional, pero seguro para evitar duplicados en dev limpio)
        // No borramos todo, usaremos upsert o verificaremos existencia.

        // 2. Recorrer carpetas mapeadas
        for (const [relPath, categoryName] of Object.entries(FOLDER_MAP)) {
            const localDir = path.join(basePath, relPath);

            if (!fs.existsSync(localDir)) {
                log.push({ folder: relPath, status: 'not_found_local' });
                continue;
            }

            const files = fs.readdirSync(localDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
            log.push({ folder: relPath, category: categoryName, files: files.length });

            let position = 1;

            for (const file of files) {
                const localFilePath = path.join(localDir, file);
                // Normalizar path de almacenamiento: cabins/los-morros/foto.jpg
                // Usamos path posix para storage
                const storagePath = `${relPath.replace(/\\/g, '/')}/${file}`;

                try {
                    // A. Subir a Storage
                    const fileBuffer = fs.readFileSync(localFilePath);

                    // Verificar si existe antes de subir para ahorrar ancho de banda (opcional)
                    // Hacemos upsert: false. Si falla, asumimos que existe.
                    const { error: uploadError } = await supabase.storage
                        .from(STORAGE_BUCKET)
                        .upload(storagePath, fileBuffer, {
                            contentType: getContentType(file),
                            upsert: true
                        });

                    if (uploadError) {
                        // console.error(`Error subiendo ${storagePath}:`, uploadError.message);
                        // No importa, seguimos.
                    } else {
                        stats.uploaded++;
                    }

                    // B. Obtener URL Pública
                    const { data: urlData } = supabase.storage
                        .from(STORAGE_BUCKET)
                        .getPublicUrl(storagePath);

                    if (!urlData.publicUrl) continue;

                    // C. Actualizar/Insertar en DB
                    // Buscamos por storage_path para evitar duplicados manualmente dado que no hay constraint
                    const dbStoragePath = `supabase://${storagePath}`;

                    const { data: existing } = await supabase
                        .from('galeria')
                        .select('id')
                        .eq('storage_path', dbStoragePath)
                        .maybeSingle();

                    let upsertError;

                    if (existing) {
                        const { error } = await supabase
                            .from('galeria')
                            .update({
                                image_url: urlData.publicUrl,
                                category: categoryName,
                                alt_text: file.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
                                position: position++,
                            })
                            .eq('id', existing.id);
                        upsertError = error;
                    } else {
                        const { error } = await supabase
                            .from('galeria')
                            .insert({
                                storage_path: dbStoragePath,
                                image_url: urlData.publicUrl,
                                category: categoryName,
                                alt_text: file.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
                                position: position++,
                            });
                        upsertError = error;
                    }

                    if (upsertError) {
                        log.push({ error: `DB error ${file}`, details: upsertError.message });
                        stats.errors++;
                    } else {
                        stats.db_inserted++;
                    }

                } catch (e: any) {
                    log.push({ error: `File error ${file}`, details: e.message });
                    stats.errors++;
                }
            }
        }

        // 3. Log event
        await supabase.from('api_events').insert({
            event_type: 'full_sync',
            event_source: 'admin_local',
            payload: stats,
            status: 'success'
        });

        return NextResponse.json({ success: true, stats, log });

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
