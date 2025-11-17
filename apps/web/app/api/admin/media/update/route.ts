import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type CabinImageUpdatePayload = Database['public']['Tables']['cabin_images']['Update'];

export async function POST(request: NextRequest) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const imageId = body?.imageId;
    const sortOrder = body?.sortOrder;
    const altText = body?.altText;

    if (!imageId) {
      return NextResponse.json({ error: 'imageId requerido' }, { status: 400 });
    }

    const updatePayload: CabinImageUpdatePayload = {};

    if (typeof sortOrder === 'number') {
      updatePayload.sort_order = sortOrder;
    }

    if (typeof altText === 'string') {
      updatePayload.alt_text = altText;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No hay cambios para aplicar' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('cabin_images')
      .update(updatePayload)
      .eq('id', imageId);

    if (error) {
      return NextResponse.json({ error: 'No se pudo actualizar la imagen' }, { status: 500 });
    }

    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: 'media_image_updated',
      event_source: 'system',
      payload: { imageId, ...updatePayload },
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating image metadata:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

