/**
 * Servicio de almacenamiento de imágenes
 * 
 * En DESARROLLO: usa filesystem local (public/images)
 * En PRODUCCIÓN: usa Supabase Storage
 * 
 * La detección es automática basada en el entorno.
 */

import { supabaseAdmin } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

const STORAGE_BUCKET = 'galeria';

/**
 * Detecta si estamos en producción
 */
function isProduction(): boolean {
    return process.env.NODE_ENV === 'production' ||
        process.env.NEXT_PUBLIC_SITE_ENV === 'production' ||
        !!process.env.DIGITAL_OCEAN_APP_ID;
}

/**
 * Obtiene la ruta base para imágenes locales
 */
function getLocalBasePath(): string {
    const monorepoPath = path.join(process.cwd(), 'apps', 'web', 'public', 'images', 'galeria');
    if (fs.existsSync(path.dirname(monorepoPath))) {
        return monorepoPath;
    }
    return path.join(process.cwd(), 'public', 'images', 'galeria');
}

export interface StorageResult {
    success: boolean;
    publicUrl?: string;
    storagePath?: string;
    error?: string;
}

/**
 * Sube una imagen al storage (local o Supabase según entorno)
 */
export async function uploadImage(
    buffer: Buffer,
    categorySlug: string,
    fileName: string
): Promise<StorageResult> {
    if (isProduction()) {
        return uploadToSupabase(buffer, categorySlug, fileName);
    } else {
        return uploadToLocal(buffer, categorySlug, fileName);
    }
}

/**
 * Elimina una imagen del storage
 */
export async function deleteImage(
    storagePath: string | null,
    imageUrl: string | null
): Promise<StorageResult> {
    if (isProduction()) {
        return deleteFromSupabase(storagePath, imageUrl);
    } else {
        return deleteFromLocal(storagePath, imageUrl);
    }
}

/**
 * Obtiene la URL pública de una imagen
 */
export function getPublicUrl(categorySlug: string, fileName: string): string {
    if (isProduction()) {
        const { data } = supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(`${categorySlug}/${fileName}`);
        return data.publicUrl;
    } else {
        return `/images/galeria/${categorySlug}/${fileName}`;
    }
}

// ============================================
// IMPLEMENTACIÓN LOCAL (desarrollo)
// ============================================

async function uploadToLocal(
    buffer: Buffer,
    categorySlug: string,
    fileName: string
): Promise<StorageResult> {
    try {
        const basePath = getLocalBasePath();
        const categoryPath = path.join(basePath, categorySlug);

        // Crear carpeta si no existe
        if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath, { recursive: true });
        }

        const filePath = path.join(categoryPath, fileName);
        fs.writeFileSync(filePath, buffer);

        return {
            success: true,
            publicUrl: `/images/galeria/${categorySlug}/${fileName}`,
            storagePath: `local://${categorySlug}/${fileName}`,
        };
    } catch (error: any) {
        console.error('Error guardando imagen local:', error);
        return {
            success: false,
            error: error?.message || 'Error guardando archivo',
        };
    }
}

async function deleteFromLocal(
    storagePath: string | null,
    imageUrl: string | null
): Promise<StorageResult> {
    try {
        // Determinar path local
        let localPath: string | null = null;
        const basePath = getLocalBasePath().replace('/images/galeria', '');

        if (imageUrl?.startsWith('/images/galeria/')) {
            localPath = path.join(basePath, imageUrl);
        } else if (storagePath?.startsWith('local://')) {
            const relativePath = storagePath.replace('local://', '');
            localPath = path.join(getLocalBasePath(), relativePath);
        } else if (storagePath?.startsWith('public/images/')) {
            localPath = path.join(basePath, storagePath.replace('public/', ''));
        }

        if (localPath && fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
            console.log('✅ Archivo local eliminado:', localPath);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error eliminando archivo local:', error);
        return {
            success: false,
            error: error?.message || 'Error eliminando archivo',
        };
    }
}

// ============================================
// IMPLEMENTACIÓN SUPABASE (producción)
// ============================================

async function uploadToSupabase(
    buffer: Buffer,
    categorySlug: string,
    fileName: string
): Promise<StorageResult> {
    try {
        const storagePath = `${categorySlug}/${fileName}`;

        // Subir a Supabase Storage
        const { data, error } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, buffer, {
                contentType: 'image/webp',
                upsert: false, // No sobrescribir si existe
            });

        if (error) {
            console.error('Error subiendo a Supabase Storage:', error);
            return {
                success: false,
                error: error.message,
            };
        }

        // Obtener URL pública
        const { data: urlData } = supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(storagePath);

        return {
            success: true,
            publicUrl: urlData.publicUrl,
            storagePath: `supabase://${storagePath}`,
        };
    } catch (error: any) {
        console.error('Error en uploadToSupabase:', error);
        return {
            success: false,
            error: error?.message || 'Error subiendo a Supabase',
        };
    }
}

async function deleteFromSupabase(
    storagePath: string | null,
    imageUrl: string | null
): Promise<StorageResult> {
    try {
        let pathToDelete: string | null = null;

        // Determinar el path en el bucket
        if (storagePath?.startsWith('supabase://')) {
            pathToDelete = storagePath.replace('supabase://', '');
        } else if (imageUrl) {
            // Extraer path de la URL pública de Supabase
            // URL format: https://xxx.supabase.co/storage/v1/object/public/galeria/category/file.webp
            const match = imageUrl.match(/\/storage\/v1\/object\/public\/galeria\/(.+)$/);
            if (match) {
                pathToDelete = match[1];
            }
        }

        if (!pathToDelete) {
            console.warn('No se pudo determinar path para eliminar:', { storagePath, imageUrl });
            return { success: true }; // No hay archivo que eliminar
        }

        const { error } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .remove([pathToDelete]);

        if (error) {
            console.error('Error eliminando de Supabase Storage:', error);
            return {
                success: false,
                error: error.message,
            };
        }

        console.log('✅ Archivo eliminado de Supabase Storage:', pathToDelete);
        return { success: true };
    } catch (error: any) {
        console.error('Error en deleteFromSupabase:', error);
        return {
            success: false,
            error: error?.message || 'Error eliminando de Supabase',
        };
    }
}

/**
 * Verifica la configuración del storage
 */
export async function checkStorageHealth(): Promise<{
    mode: 'local' | 'supabase';
    ready: boolean;
    error?: string;
}> {
    const mode = isProduction() ? 'supabase' : 'local';

    if (mode === 'local') {
        const basePath = getLocalBasePath();
        const exists = fs.existsSync(basePath) || fs.existsSync(path.dirname(basePath));
        return { mode, ready: exists };
    }

    // Verificar que el bucket existe en Supabase
    try {
        const { data, error } = await supabaseAdmin.storage.getBucket(STORAGE_BUCKET);
        if (error) {
            return {
                mode,
                ready: false,
                error: `Bucket '${STORAGE_BUCKET}' no encontrado. Créalo en Supabase Storage.`,
            };
        }
        return { mode, ready: true };
    } catch (err: any) {
        return {
            mode,
            ready: false,
            error: err?.message || 'Error conectando con Supabase Storage',
        };
    }
}
