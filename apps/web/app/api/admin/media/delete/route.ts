import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { extractPathFromPublicUrl, removeFromStorage } from '@/modules/media/server/storage';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function POST(request: NextRequest) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const imageId = body?.imageId as string | undefined;

  if (!imageId) {
    return NextResponse.json({ error: 'imageId requerido' }, { status: 400 });
  }

  const { data, error } = await (supabaseAdmin
    .from('cabin_images') as any)
    .select('id, cabin_id, image_url, is_primary, sort_order')
    .eq('id', imageId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
  }

  try {
    const storagePath = extractPathFromPublicUrl(data.image_url);
    if (storagePath) {
      await removeFromStorage(storagePath);
      const thumbPath = storagePath.replace(/\.webp$/, '-thumb.webp');
      if (thumbPath !== storagePath) {
        await removeFromStorage(thumbPath).catch(() => undefined);
      }
      // intentar eliminar copia local en /public/images/cabins/<slug>/<filename>
      const match = storagePath.match(/^cabins\/([^/]+)\/gallery\/(.+)$/);
      if (match) {
        const [, slug, filename] = match;
        const localPath = path.join(process.cwd(), 'apps', 'web', 'public', 'images', 'cabins', slug, filename);
        try {
          await fs.unlink(localPath);
        } catch {
          // no-op si no existe
        }
      }
    }
  } catch (removeError) {
    console.warn('No se pudo eliminar archivo del storage', removeError);
  }

  await (supabaseAdmin.from('cabin_images') as any).delete().eq('id', imageId);

  if (data.is_primary) {
    const { data: remaining } = await (supabaseAdmin
      .from('cabin_images') as any)
      .select('id')
      .eq('cabin_id', data.cabin_id)
      .order('sort_order', { ascending: true })
      .limit(1);

    if (remaining && remaining[0]) {
      await (supabaseAdmin
        .from('cabin_images') as any)
        .update({ is_primary: true })
        .eq('id', remaining[0].id);
    }
  }

  await (supabaseAdmin.from('api_events') as any).insert({
    event_type: 'media_deleted',
    event_source: 'admin',
    payload: { imageId, cabinId: data.cabin_id },
    status: 'success',
  });

  return NextResponse.json({ success: true });
}
