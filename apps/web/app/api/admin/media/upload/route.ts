import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { uploadCabinImage } from '@/modules/media/server/actions';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function POST(request: NextRequest) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const cabinId = formData.get('cabinId');
  const cabinSlug = formData.get('cabinSlug');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Archivo no encontrado en la peticion' }, { status: 400 });
  }

  if (!cabinId || !cabinSlug) {
    return NextResponse.json({ error: 'Faltan datos de carpeta' }, { status: 400 });
  }

  try {
    const rawBuffer = Buffer.from(await (file as File).arrayBuffer());
    const image = await uploadCabinImage({
      file,
      cabinId: String(cabinId),
      cabinSlug: String(cabinSlug),
    });

    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: 'media_image_uploaded',
      event_source: 'admin',
      payload: { imageId: image.id, cabinId, storage_path: image.storage_path },
      status: 'success',
    });

    // Guardar copia local en public/images/cabins/<slug>/<filename>
    try {
      const targetDir = path.join(process.cwd(), 'apps', 'web', 'public', 'images', 'cabins', String(cabinSlug));
      await fs.mkdir(targetDir, { recursive: true });
      const filename = path.basename(image.storage_path || image.file_name || (file as File).name);
      await fs.writeFile(path.join(targetDir, filename), rawBuffer);
    } catch (fsError) {
      console.warn('No se pudo escribir copia local de la imagen:', fsError);
    }

    return NextResponse.json({ image });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error?.message || 'No se pudo subir la imagen' },
      { status: 400 }
    );
  }
}
