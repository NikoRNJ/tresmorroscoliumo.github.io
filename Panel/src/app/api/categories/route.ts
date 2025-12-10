import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const buildError = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status });

// GET - Listar categorías
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
    if (error) return buildError(error.message);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/categories error', error);
    return buildError('Internal server error', 500);
  }
}

// POST - Crear categoría
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { name, slug, description } = body || {};

    if (!name || !slug) {
      return buildError('Nombre y slug son obligatorios');
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({ name, slug, description })
      .select()
      .maybeSingle();

    if (error || !data) return buildError(error?.message || 'No se pudo crear la categoría');
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/categories error', error);
    return buildError('Internal server error', 500);
  }
}

// DELETE - Eliminar categoría
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return buildError('Category ID is required');

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return buildError(error.message);

    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('DELETE /api/categories error', error);
    return buildError('Internal server error', 500);
  }
}
