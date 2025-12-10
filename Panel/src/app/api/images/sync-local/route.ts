import fs from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, STORAGE_BUCKET } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

const buildError = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status });

async function getCabinsMap(supabase: ReturnType<typeof createAdminClient>) {
  const { data: cabins, error } = await supabase.from('cabins').select('id, slug, title');
  if (error) throw new Error(error.message);
  return cabins?.reduce<Record<string, { id: string; title: string }>>((acc, cabin) => {
    acc[cabin.slug] = { id: cabin.id, title: cabin.title };
    return acc;
  }, {}) || {};
}

async function ensurePrimary(supabase: ReturnType<typeof createAdminClient>, cabinId: string, imageId: string) {
  // Marcar primaria y quitar al resto
  await supabase.from('images').update({ is_primary: false }).eq('cabin_id', cabinId).neq('id', imageId);
  await supabase.from('images').update({ is_primary: true }).eq('id', imageId);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json().catch(() => ({}));
    const { baseDir } = body || {};

    // Directorio raíz de imágenes locales
    const repoRoot = path.resolve(process.cwd(), '..');
    const defaultDir = path.join(repoRoot, 'apps', 'web', 'public', 'images', 'cabins');
    const imagesDir = baseDir ? path.resolve(baseDir) : defaultDir;

    const cabinsMap = await getCabinsMap(supabase);
    const folders = await fs.readdir(imagesDir);

    let created = 0;
    let skipped = 0;
    const results: Array<{ slug: string; file: string; status: 'created' | 'skipped' }> = [];

    for (const folder of folders) {
      const slug = folder;
      if (!cabinsMap[slug]) {
        console.warn(`Cabin slug ${slug} no existe en DB; omitiendo carpeta.`);
        continue;
      }
      const cabinId = cabinsMap[slug].id;
      const cabinPath = path.join(imagesDir, folder);

      const files = await fs.readdir(cabinPath);
      // obtener orden actual
      const { data: existing } = await supabase
        .from('images')
        .select('id, name, is_primary, order_index')
        .eq('cabin_id', cabinId)
        .order('order_index', { ascending: true });

      let nextOrder = (existing?.[existing.length - 1]?.order_index ?? -1) + 1;
      const hasPrimary = existing?.some((i) => i.is_primary) ?? false;

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) continue;

        const already = existing?.find((img) => img.name === file);
        if (already) {
          skipped += 1;
          results.push({ slug, file, status: 'skipped' });
          continue;
        }

        const buffer = await fs.readFile(path.join(cabinPath, file));
        const mime = MIME_BY_EXT[ext] || 'application/octet-stream';
        const storagePath = `${cabinId}/${file}`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, buffer, { contentType: mime, cacheControl: '3600', upsert: false });

        if (uploadError) {
          console.error(`No se pudo subir ${file}: ${uploadError.message}`);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

        const isPrimary = !hasPrimary && nextOrder === 0;

        const { data, error } = await supabase
          .from('images')
          .insert({
            url: publicUrl,
            name: file,
            alt: file,
            cabin_id: cabinId,
            is_primary: isPrimary,
            order_index: nextOrder,
          })
          .select('id')
          .maybeSingle();

        if (error || !data) {
          console.error(`No se pudo insertar ${file}: ${error?.message}`);
          continue;
        }

        if (isPrimary) {
          await ensurePrimary(supabase, cabinId, data.id);
        }

        created += 1;
        nextOrder += 1;
        results.push({ slug, file, status: 'created' });
      }
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      results,
      bucket: STORAGE_BUCKET,
      baseDir: imagesDir,
    });
  } catch (error) {
    console.error('POST /api/images/sync-local error', error);
    return buildError('Internal server error', 500);
  }
}
