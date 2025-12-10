import { supabaseAdmin } from '@/lib/supabase/server';
import { GaleriaDashboard } from '@/modules/galeria/components/GaleriaDashboard';
import type { GaleriaCategory, GaleriaConstraints } from '@/modules/galeria/types';
import { toSlugSegment } from '@/modules/galeria/utils/filePaths';

export const dynamic = 'force-dynamic';

export default async function GaleriaPage() {
    // Fetch all galeria items grouped by category from database
    let galeriaRows: any[] = [];

    try {
        const { data, error } = await (supabaseAdmin
            .from('galeria') as any)
            .select('*')
            .order('category', { ascending: true })
            .order('position', { ascending: true });

        if (error) {
            console.error('Error obteniendo galería:', error);
        } else {
            galeriaRows = data ?? [];
        }
    } catch (err) {
        console.error('Error inesperado obteniendo galería:', err);
    }

    // Group by category
    const categoryMap = new Map<string, GaleriaCategory>();

    for (const row of galeriaRows) {
        const slug = toSlugSegment(row.category);

        if (!categoryMap.has(slug)) {
            categoryMap.set(slug, {
                name: row.category,
                slug,
                items: [],
                editable: true,
            });
        }

        const category = categoryMap.get(slug)!;
        category.items.push({
            id: row.id,
            imageUrl: row.image_url,
            storagePath: row.storage_path,
            category: row.category,
            position: row.position,
            altText: row.alt_text,
            createdAt: row.created_at,
            status: 'synced',
        });
    }

    const categories = Array.from(categoryMap.values());

    // Default categories based on public/images folder structure
    // REMOVED HARDCODED DEFAULTS to prevent inconsistencies.
    // The categories must come exclusively from the database sync.
    if (categories.length === 0) {
        // Optional: We could add a 'system' warning category or just leave empty
    }

    const uploadConstraints: GaleriaConstraints = {
        maxSizeMb: Number(process.env.MEDIA_MAX_UPLOAD_MB || '8') || 8,
        allowedTypes:
            (process.env.MEDIA_ALLOWED_TYPES || 'image/jpeg,image/png,image/webp')
                .split(',')
                .map((type) => type.trim())
                .filter(Boolean) ?? [],
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Galería de Imágenes</h1>
                <p className="text-sm text-gray-600">
                    Gestiona las imágenes locales por categorías. Haz clic en <strong>&ldquo;Sincronizar Storage&rdquo;</strong> para detectar imágenes existentes en <code>public/images</code>.
                </p>
            </div>

            <GaleriaDashboard categories={categories} constraints={uploadConstraints} />
        </div>
    );
}
