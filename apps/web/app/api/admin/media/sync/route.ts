import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { buildFolderPrefix, nextSortOrder } from '@/modules/media/utils/filePaths';
import {
  extractPathFromPublicUrl,
  getPublicUrl,
  mediaBucket,
  uploadToStorage,
} from '@/modules/media/server/storage';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function POST(request: NextRequest) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const cabinId = body?.cabinId as string | undefined;

  if (!cabinId) {
    return NextResponse.json({ error: 'cabinId requerido' }, { status: 400 });
  }

  const { data: cabin, error: cabinError } = await (supabaseAdmin
    .from('cabins') as any)
    .select('id, slug, title')
    .eq('id', cabinId)
    .maybeSingle();

  if (cabinError || !cabin) {
    return NextResponse.json({ error: 'Cabana no encontrada' }, { status: 404 });
  }

  const prefix = buildFolderPrefix(cabin.slug);
  const { data: storageFiles, error: storageError } = await supabaseAdmin.storage
    .from(mediaBucket)
    .list(prefix, { limit: 1000 });

  if (storageError) {
    return NextResponse.json({ error: 'No se pudo listar el storage' }, { status: 500 });
  }

  const storedPaths =
    storageFiles
      ?.filter((file) => !file.name.endsWith('/'))
      .map((file) => `${prefix}${file.name}`)
      .filter((path) => !path.endsWith('-thumb.webp')) || [];

  const { data: dbImages } = await (supabaseAdmin
    .from('cabin_images') as any)
    .select('id, image_url, sort_order, is_primary, alt_text')
    .eq('cabin_id', cabinId)
    .order('sort_order', { ascending: true });

  const dbPaths = new Set(
    (dbImages || [])
      .map((img: any) => extractPathFromPublicUrl(img.image_url))
      .filter(Boolean) as string[]
  );

  const missingInDb = storedPaths.filter((path) => !dbPaths.has(path));
  const missingInStorage =
    dbImages
      ?.filter((img: any) => {
        const path = extractPathFromPublicUrl(img.image_url);
        return path && !storedPaths.includes(path);
      })
      .map((img: any) => img.image_url) || [];

  // Importar desde carpeta local si no hay nada en storage
  if (storedPaths.length === 0) {
    const localDir = path.join(process.cwd(), 'apps', 'web', 'public', 'images', 'cabins', cabin.slug);
    try {
      const files = await fs.readdir(localDir);
      const valid = files.filter((file) =>
        ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(path.extname(file).toLowerCase())
      );
      for (const fileName of valid) {
        const filePath = path.join(localDir, fileName);
        const buffer = await fs.readFile(filePath);
        const storagePath = `${prefix}${fileName}`;
        await uploadToStorage(storagePath, buffer, mimeFromExt(fileName));
        storedPaths.push(storagePath);
      }
    } catch {
      // no hay carpeta local, continuar
    }
  }

  let currentSort = nextSortOrder(dbImages || []) - 1;
  for (const path of missingInDb) {
    currentSort += 1;
    const sortOrder = currentSort;
    await (supabaseAdmin.from('cabin_images') as any).insert({
      cabin_id: cabinId,
      image_url: getPublicUrl(path),
      alt_text: path.split('/').pop() || 'imagen',
      sort_order: sortOrder,
      is_primary: false,
    });
  }

  const { data: refreshed } = await (supabaseAdmin
    .from('cabin_images') as any)
    .select('id, cabin_id, image_url, alt_text, sort_order, is_primary')
    .eq('cabin_id', cabinId)
    .order('sort_order', { ascending: true });

  await (supabaseAdmin.from('api_events') as any).insert({
    event_type: 'media_sync',
    event_source: 'admin',
    payload: {
      cabinId,
      added: missingInDb.length,
      missingInStorage: missingInStorage.length,
    },
    status: 'success',
  });

  return NextResponse.json({
    items: refreshed || [],
    added: missingInDb.length,
    missingInStorage,
  });
}

function mimeFromExt(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.avif') return 'image/avif';
  return 'application/octet-stream';
}
