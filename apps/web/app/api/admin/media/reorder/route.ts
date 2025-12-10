import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const orderedIds = body?.orderedIds as string[] | undefined;
  const cabinId = body?.cabinId as string | undefined;

  if (!orderedIds?.length || !cabinId) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }

  try {
    for (let index = 0; index < orderedIds.length; index++) {
      const imageId = orderedIds[index];
      await (supabaseAdmin
        .from('cabin_images') as any)
        .update({ sort_order: index + 1 })
        .eq('id', imageId)
        .eq('cabin_id', cabinId);
    }

    await (supabaseAdmin.from('api_events') as any).insert({
      event_type: 'media_reordered',
      event_source: 'admin',
      payload: { cabinId, orderedIds },
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'No se pudo reordenar las imagenes' }, { status: 500 });
  }
}
