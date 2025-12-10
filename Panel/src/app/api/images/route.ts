import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, STORAGE_BUCKET } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_UPLOAD_BYTES =
  (Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || process.env.MEDIA_MAX_UPLOAD_MB || '8') ||
    8) *
  1024 *
  1024;

const buildError = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status });

const parseBoolean = (value: FormDataEntryValue | null) =>
  value === 'true' || value === true || value === '1';

const extractPathFromPublicUrl = (url: string) => {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
};

async function assertTargetExists(
  supabase: ReturnType<typeof createAdminClient>,
  target: { categoryId: string | null; cabinId: string | null }
) {
  const { categoryId, cabinId } = target;

  if (!categoryId && !cabinId) {
    return 'Debe indicar categoryId o cabinId';
  }
  if (categoryId && cabinId) {
    return 'Solo se permite un destino: categoryId o cabinId';
  }

  if (categoryId) {
    const { data } = await supabase
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .maybeSingle();
    if (!data) return 'La categoría no existe';
  }

  if (cabinId) {
    const { data } = await supabase
      .from('cabins')
      .select('id')
      .eq('id', cabinId)
      .maybeSingle();
    if (!data) return 'La cabaña no existe';
  }

  return null;
}

async function getNextOrderIndex(
  supabase: ReturnType<typeof createAdminClient>,
  target: { categoryId: string | null; cabinId: string | null }
) {
  const { categoryId, cabinId } = target;
  let query = supabase.from('images').select('order_index').order('order_index', { ascending: false }).limit(1);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (cabinId) query = query.eq('cabin_id', cabinId);
  const { data } = await query.maybeSingle();
  return (data?.order_index ?? -1) + 1;
}

// GET - Obtener imágenes
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const cabinId = searchParams.get('cabinId');
    const id = searchParams.get('id');

    let query = supabase
      .from('images')
      .select('*, category:categories(*), cabin:cabins(*)')
      .order('order_index', { ascending: true });

    if (id) {
      const { data, error } = await query.eq('id', id).maybeSingle();
      if (error) return buildError(error.message);
      if (!data) return buildError('Imagen no encontrada', 404);
      return NextResponse.json({ success: true, data });
    }

    if (categoryId) query = query.eq('category_id', categoryId);
    if (cabinId) query = query.eq('cabin_id', cabinId);

    const { data, error } = await query;
    if (error) return buildError(error.message);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/images error', error);
    return buildError('Internal server error', 500);
  }
}

// POST - Subir imagen
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const categoryId = (formData.get('categoryId') as string | null) ?? null;
    const cabinId = (formData.get('cabinId') as string | null) ?? null;
    const alt = (formData.get('alt') as string | null) ?? null;
    const isPrimary = parseBoolean(formData.get('isPrimary'));

    const targetError = await assertTargetExists(supabase, { categoryId, cabinId });
    if (targetError) return buildError(targetError);

    if (!file) {
      return buildError('File is required');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return buildError(`Tipo de archivo no permitido (${file.type})`);
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return buildError(`El archivo supera el máximo permitido de ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB`);
    }

    // Generar nombre único
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const folder = cabinId || categoryId || 'misc';
    const filePath = `${folder}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir al storage
    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });
    if (uploadError) return buildError(uploadError.message);

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    // Orden siguiente
    const nextOrder = await getNextOrderIndex(supabase, { categoryId, cabinId });

    // Si es primaria y tiene cabin, bajar el resto antes de insertar
    if (isPrimary && cabinId) {
      await supabase.from('images').update({ is_primary: false }).eq('cabin_id', cabinId);
    }

    const { data, error } = await supabase
      .from('images')
      .insert({
        url: publicUrl,
        name: file.name,
        alt: alt || file.name,
        category_id: categoryId,
        cabin_id: cabinId,
        is_primary: isPrimary,
        order_index: nextOrder,
      })
      .select('*, category:categories(*), cabin:cabins(*)')
      .maybeSingle();

    if (error || !data) {
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]); // rollback
      return buildError(error?.message || 'No se pudo insertar la imagen');
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/images error', error);
    return buildError('Internal server error', 500);
  }
}

// PATCH - Actualizar imagen
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { id, alt, order_index, is_primary } = body || {};

    if (!id) {
      return buildError('Image ID is required');
    }

    const { data: current, error: fetchError } = await supabase
      .from('images')
      .select('id, cabin_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) return buildError(fetchError.message);
    if (!current) return buildError('Imagen no encontrada', 404);

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (alt !== undefined) updates.alt = alt;
    if (order_index !== undefined) updates.order_index = Number(order_index);
    if (is_primary !== undefined) updates.is_primary = Boolean(is_primary);

    if (updates.is_primary && current.cabin_id) {
      await supabase.from('images').update({ is_primary: false }).eq('cabin_id', current.cabin_id).neq('id', id);
    }

    const { data, error } = await supabase
      .from('images')
      .update(updates)
      .eq('id', id)
      .select('*, category:categories(*), cabin:cabins(*)')
      .maybeSingle();

    if (error) return buildError(error.message);
    if (!data) return buildError('Imagen no encontrada', 404);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('PATCH /api/images error', error);
    return buildError('Internal server error', 500);
  }
}

// DELETE - Eliminar imagen
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return buildError('Image ID is required');
    }

    const { data: image } = await supabase
      .from('images')
      .select('url')
      .eq('id', id)
      .maybeSingle();

    if (image?.url) {
      const storagePath = extractPathFromPublicUrl(image.url);
      if (storagePath) {
        await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      }
    }

    const { error } = await supabase.from('images').delete().eq('id', id);
    if (error) return buildError(error.message);

    return NextResponse.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    console.error('DELETE /api/images error', error);
    return buildError('Internal server error', 500);
  }
}
