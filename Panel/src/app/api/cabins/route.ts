import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const buildError = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status });

// GET - Listar cabañas
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('cabins').select('*').order('title', { ascending: true });
    if (error) return buildError(error.message);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/cabins error', error);
    return buildError('Internal server error', 500);
  }
}
