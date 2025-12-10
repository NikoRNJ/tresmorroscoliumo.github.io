import { supabaseAdmin } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import { buildMediaPath, generateFileName, nextSortOrder } from '../utils/filePaths';
import { getPublicUrl, mediaBucket, uploadToStorage } from './storage';
import { createThumbnail, toWebp } from './imageProcessing';

type CabinImageRow = Database['public']['Tables']['cabin_images']['Row'];

const allowedTypes =
  (process.env.MEDIA_ALLOWED_TYPES || 'image/jpeg,image/png,image/webp')
    .split(',')
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean);

const maxUploadBytes =
  (Number(process.env.MEDIA_MAX_UPLOAD_MB || '8') || 8) * 1024 * 1024;

export async function uploadCabinImage(params: {
  file: File;
  cabinId: string;
  cabinSlug: string;
}) {
  const { file, cabinId, cabinSlug } = params;
  const mime = file.type.toLowerCase();

  if (!allowedTypes.includes(mime)) {
    throw new Error('Tipo de archivo no permitido');
  }

  if (file.size > maxUploadBytes) {
    throw new Error('El archivo supera el tamano maximo permitido');
  }

  const baseName = file.name?.split('.').slice(0, -1).join('.') || 'imagen';
  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const processed = await toWebp(rawBuffer);
  const hasWebp = processed.contentType.includes('webp');
  const extension = hasWebp ? 'webp' : mime.split('/')[1] || 'bin';

  const thumb = hasWebp ? await createThumbnail(rawBuffer) : null;

  const fileName = generateFileName(baseName, extension);
  const thumbName = fileName.replace(`.${extension}`, `-thumb.${extension}`);

  const filePath = buildMediaPath(cabinSlug, fileName);
  const thumbPath = buildMediaPath(cabinSlug, thumbName);

  const finalContentType =
    processed.contentType === 'application/octet-stream' ? mime : processed.contentType;

  await uploadToStorage(filePath, processed.buffer, finalContentType);

  if (thumb) {
    await uploadToStorage(thumbPath, thumb.buffer, thumb.contentType);
  }

  const { data: existing } = await (supabaseAdmin
    .from('cabin_images') as any)
    .select('id, sort_order, is_primary')
    .eq('cabin_id', cabinId);

  const sortOrder = nextSortOrder(existing || []);
  const shouldBePrimary = !existing?.length || !existing.some((img: any) => img.is_primary);

  const { data, error } = await (supabaseAdmin
    .from('cabin_images') as any)
    .insert({
      cabin_id: cabinId,
      image_url: getPublicUrl(filePath),
      alt_text: baseName,
      sort_order: sortOrder,
      is_primary: shouldBePrimary,
    })
    .select()
    .maybeSingle();

  if (error || !data) {
    throw new Error('No se pudo registrar la imagen en la base de datos');
  }

  const record = data as CabinImageRow;

  if (shouldBePrimary && existing?.length) {
    await (supabaseAdmin
      .from('cabin_images') as any)
      .update({ is_primary: false })
      .eq('cabin_id', cabinId)
      .neq('id', record.id);
  }

  return {
    ...record,
    thumb_url: thumb ? getPublicUrl(thumbPath) : null,
    storage_path: filePath,
    bucket: mediaBucket,
    file_name: fileName,
    content_type: finalContentType,
    original_name: file.name ?? fileName,
  };
}
