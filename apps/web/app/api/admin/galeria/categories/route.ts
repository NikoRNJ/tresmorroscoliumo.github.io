import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/galeria/categories
 * List all distinct categories
 */
export async function GET(request: NextRequest) {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get distinct categories with count
        const { data, error } = await (supabaseAdmin
            .from('galeria') as any)
            .select('category')
            .order('category', { ascending: true });

        if (error) {
            throw error;
        }

        // Get unique categories with item count
        const categoryMap = new Map<string, number>();
        for (const row of data || []) {
            const count = categoryMap.get(row.category) || 0;
            categoryMap.set(row.category, count + 1);
        }

        const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
            name,
            count,
        }));

        return NextResponse.json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

/**
 * POST /api/admin/galeria/categories
 * Create a new category (optional - categories are created automatically when uploading)
 */
export async function POST(request: NextRequest) {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const categoryName = body?.name as string | undefined;

    if (!categoryName || categoryName.trim().length === 0) {
        return NextResponse.json({ error: 'Nombre de categoría requerido' }, { status: 400 });
    }

    // Categories are managed implicitly - just return success
    // The category will be created when the first image is uploaded
    return NextResponse.json({
        success: true,
        category: { name: categoryName.trim(), count: 0 }
    });
}
