import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

const STORAGE_BUCKET = 'galeria';

// Helper to get correct base path for images
const getPublicImagesPath = () => {
    const monorepoPath = path.join(process.cwd(), 'apps', 'web', 'public', 'images', 'galeria');
    if (fs.existsSync(monorepoPath)) {
        return monorepoPath;
    }
    return path.join(process.cwd(), 'public', 'images', 'galeria');
};

/**
 * GET /api/admin/galeria/migrate
 * Permite ejecutar la migración desde el navegador
 */
export async function GET(request: NextRequest) {
    return runMigration(request);
}

/**
 * POST /api/admin/galeria/migrate
 * 
 * MIGRACIÓN COMPLETA: Lee imágenes del filesystem local,
 * las sube a Supabase Storage, y actualiza la base de datos.
 * 
 * ⚠️ SOLO ejecutar desde LOCALHOST con las imágenes locales.
 */
export async function POST(request: NextRequest) {
    return runMigration(request);
}

async function runMigration(request: NextRequest) {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const basePath = getPublicImagesPath();

        if (!fs.existsSync(basePath)) {
            return NextResponse.json({
                error: `No se encontró la carpeta de galería: ${basePath}`,
                hint: 'Ejecuta este endpoint desde localhost con las imágenes locales.'
            }, { status: 400 });
        }

        console.log('[migrate] Iniciando migración desde:', basePath);

        const results = {
            scanned: 0,
            uploaded: 0,
            failed: 0,
            skipped: 0,
            errors: [] as string[],
        };

        // Escanear todas las categorías (carpetas)
        const categories = fs.readdirSync(basePath).filter(item => {
            const fullPath = path.join(basePath, item);
            return fs.statSync(fullPath).isDirectory() && !item.startsWith('.');
        });

        console.log('[migrate] Categorías encontradas:', categories);

        for (const categoryFolder of categories) {
            const categoryPath = path.join(basePath, categoryFolder);
            const categoryName = capitalize(categoryFolder.replace(/-/g, ' '));

            // Escanear imágenes en esta categoría
            const files = fs.readdirSync(categoryPath).filter(isImageFile);

            console.log(`[migrate] Categoría "${categoryName}": ${files.length} archivos`);

            for (const fileName of files) {
                results.scanned++;

                const filePath = path.join(categoryPath, fileName);
                const supabasePath = `${categoryFolder}/${fileName}`;

                try {
                    // Leer archivo
                    const buffer = fs.readFileSync(filePath);

                    // Verificar si ya existe en Supabase Storage
                    const { data: existingFiles } = await supabaseAdmin.storage
                        .from(STORAGE_BUCKET)
                        .list(categoryFolder, { search: fileName });

                    if (existingFiles && existingFiles.some(f => f.name === fileName)) {
                        console.log(`[migrate] Ya existe en Storage: ${supabasePath}`);
                        results.skipped++;
                        continue;
                    }

                    // Subir a Supabase Storage
                    const { error: uploadError } = await supabaseAdmin.storage
                        .from(STORAGE_BUCKET)
                        .upload(supabasePath, buffer, {
                            contentType: getContentType(fileName),
                            upsert: true,
                        });

                    if (uploadError) {
                        console.error(`[migrate] Error subiendo ${supabasePath}:`, uploadError);
                        results.failed++;
                        results.errors.push(`${supabasePath}: ${uploadError.message}`);
                        continue;
                    }

                    // Obtener URL pública
                    const { data: urlData } = supabaseAdmin.storage
                        .from(STORAGE_BUCKET)
                        .getPublicUrl(supabasePath);

                    const publicUrl = urlData.publicUrl;
                    const storagePath = `supabase://${supabasePath}`;

                    // Verificar si ya existe en la DB con URL local
                    const localUrl = `/images/galeria/${categoryFolder}/${fileName}`;
                    const { data: existingRecord } = await (supabaseAdmin
                        .from('galeria') as any)
                        .select('id')
                        .eq('image_url', localUrl)
                        .maybeSingle();

                    if (existingRecord) {
                        // Actualizar registro existente con nueva URL
                        await (supabaseAdmin.from('galeria') as any)
                            .update({
                                image_url: publicUrl,
                                storage_path: storagePath,
                            })
                            .eq('id', existingRecord.id);

                        console.log(`[migrate] Actualizado: ${fileName} -> ${publicUrl}`);
                    } else {
                        // Insertar nuevo registro
                        const { data: posData } = await (supabaseAdmin.from('galeria') as any)
                            .select('position')
                            .eq('category', categoryName)
                            .order('position', { ascending: false })
                            .limit(1);

                        const nextPosition = (posData?.[0]?.position || 0) + 1;

                        await (supabaseAdmin.from('galeria') as any).insert({
                            image_url: publicUrl,
                            storage_path: storagePath,
                            category: categoryName,
                            position: nextPosition,
                            alt_text: fileName.replace(/\.[^.]+$/, '').replace(/-/g, ' ').replace(/_/g, ' '),
                        });

                        console.log(`[migrate] Insertado: ${fileName} -> ${publicUrl}`);
                    }

                    results.uploaded++;

                } catch (fileError: any) {
                    console.error(`[migrate] Error procesando ${fileName}:`, fileError);
                    results.failed++;
                    results.errors.push(`${fileName}: ${fileError.message}`);
                }
            }
        }

        // Log del evento
        await (supabaseAdmin.from('api_events') as any).insert({
            event_type: 'galeria_migrated_to_supabase',
            event_source: 'admin',
            payload: results,
            status: results.failed > 0 ? 'partial' : 'success',
        });

        console.log('[migrate] Migración completada:', results);

        return NextResponse.json({
            success: true,
            message: `Migración completada: ${results.uploaded} subidas, ${results.skipped} omitidas, ${results.failed} fallidas`,
            results,
        });

    } catch (error: any) {
        console.error('[migrate] Error fatal:', error);
        return NextResponse.json({
            error: 'Error en migración',
            details: error.message
        }, { status: 500 });
    }
}

function isImageFile(filename: string): boolean {
    return /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(filename);
}

function getContentType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const types: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
        avif: 'image/avif',
    };
    return types[ext || ''] || 'application/octet-stream';
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
