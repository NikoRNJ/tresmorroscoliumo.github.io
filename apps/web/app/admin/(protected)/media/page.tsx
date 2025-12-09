import fs from 'node:fs/promises';
import path from 'node:path';
import { supabaseAdmin } from '@/lib/supabase/server';
import { MediaDashboard } from '@/modules/media/components/MediaDashboard';
import type { MediaFolder, UploadConstraints } from '@/modules/media/types';

const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

async function getLocalImages(slug: string) {
  const dir = path.join(process.cwd(), 'apps', 'web', 'public', 'images', 'cabins', slug);
  try {
    const files = await fs.readdir(dir);
    const images = files.filter((file) => validExtensions.includes(path.extname(file).toLowerCase()));
    return images.map((file, index) => ({
      id: `local-${slug}-${file}`,
      cabinId: `local-${slug}`,
      cabinSlug: slug,
      url: `/images/cabins/${slug}/${file}`,
      altText: file,
      sortOrder: index + 1,
      isPrimary: index === 0,
      status: 'synced' as const,
    }));
  } catch {
    return [];
  }
}

export default async function MediaPage() {
  let cabinRows: any[] = [];

  try {
    const { data, error } = await supabaseAdmin
      .from('cabins')
      .select(
        'id, slug, title, cabin_images(id, cabin_id, image_url, alt_text, sort_order, is_primary)'
      )
      .order('title', { ascending: true });

    if (error) {
      console.error('Error obteniendo cabañas:', error);
    } else {
      cabinRows = data ?? [];
    }
  } catch (err) {
    console.error('Error inesperado obteniendo cabañas:', err);
  }

  const folders: MediaFolder[] = await Promise.all(
    cabinRows.map(async (cabin: any) => {
      const dbImages =
        (cabin.cabin_images || [])
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((img: any) => ({
            id: img.id,
            cabinId: img.cabin_id,
            cabinSlug: cabin.slug,
            url: img.image_url,
            altText: img.alt_text,
            sortOrder: img.sort_order ?? 0,
            isPrimary: img.is_primary,
            status: 'synced' as const,
          })) ?? [];

      const localFallback = dbImages.length === 0 ? await getLocalImages(cabin.slug) : [];

      return {
        cabinId: cabin.id,
        cabinSlug: cabin.slug,
        cabinTitle: cabin.title,
        items: dbImages.length ? dbImages : localFallback,
      };
    })
  );

  const uploadConstraints: UploadConstraints = {
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
        <h1 className="text-2xl font-bold text-gray-900">Gestion de media</h1>
        <p className="text-sm text-gray-600">
          Arrastra, reordena y sincroniza las galerias de cada cabana.
        </p>
      </div>

      <MediaDashboard folders={folders} constraints={uploadConstraints} />
    </div>
  );
}
