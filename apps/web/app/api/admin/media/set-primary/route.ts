import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const imageId = body?.imageId;
    if (!imageId) {
      return NextResponse.json({ error: 'imageId requerido' }, { status: 400 });
    }

    const { data: image, error: fetchError } = await supabaseAdmin
      .from('cabin_images')
      .select('id, cabin_id')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
    }

    await (supabaseAdmin.from('cabin_images') as any)
      .update({ is_primary: false })
      .eq('cabin_id', image.cabin_id);

    const { error: primaryError } = await (supabaseAdmin.from('cabin_images') as any)
      .update({ is_primary: true })
      .eq('id', imageId);

    if (primaryError) {
      return NextResponse.json({ error: 'No se pudo actualizar la imagen' }, { status: 500 });
    }

    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: 'media_primary_updated',
      event_source: 'system',
      payload: {
        imageId,
        cabinId: image.cabin_id,
      },
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting primary image:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

