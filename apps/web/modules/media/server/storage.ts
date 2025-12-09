import { supabaseAdmin } from '@/lib/supabase/server';

const DEFAULT_BUCKET = 'media';
const DEFAULT_EXPIRATION = 60 * 60; // 1 hour

export const mediaBucket = process.env.MEDIA_BUCKET || DEFAULT_BUCKET;

const toBuffer = (data: ArrayBuffer | Buffer) =>
  Buffer.isBuffer(data) ? data : Buffer.from(data);

export async function uploadToStorage(
  path: string,
  data: ArrayBuffer | Buffer,
  contentType: string
) {
  const { error } = await supabaseAdmin.storage
    .from(mediaBucket)
    .upload(path, toBuffer(data), {
      cacheControl: '3600',
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`No se pudo subir el archivo: ${error.message}`);
  }
}

export async function removeFromStorage(path: string) {
  const { error } = await supabaseAdmin.storage.from(mediaBucket).remove([path]);
  if (error) {
    throw new Error(`No se pudo eliminar el archivo: ${error.message}`);
  }
}

export async function getSignedUrl(path: string, expiresIn = DEFAULT_EXPIRATION) {
  const { data, error } = await supabaseAdmin.storage
    .from(mediaBucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(`No se pudo generar URL firmada: ${error?.message}`);
  }

  return data.signedUrl;
}

export function getPublicUrl(path: string) {
  const { data } = supabaseAdmin.storage.from(mediaBucket).getPublicUrl(path);
  return data.publicUrl;
}

export function extractPathFromPublicUrl(url: string) {
  const marker = `/object/public/${mediaBucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}
