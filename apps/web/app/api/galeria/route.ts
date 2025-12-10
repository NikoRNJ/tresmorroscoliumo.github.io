import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/galeria
 * Public API to fetch gallery images grouped by category
 * Used by the frontend Gallery component
 */
import fs from 'fs';
import path from 'path';

// Helper for dev mode fallback
const getDevImages = (subfolder: string) => {
    try {
        // Try monorepo structure first
        let dir = path.join(process.cwd(), 'apps', 'web', 'public', 'images', 'galeria', subfolder);
        if (!fs.existsSync(dir)) {
            dir = path.join(process.cwd(), 'public', 'images', 'galeria', subfolder);
        }

        if (fs.existsSync(dir)) {
            return fs.readdirSync(dir)
                .filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f))
                .map(f => ({
                    src: `/images/galeria/${subfolder}/${f}`,
                    alt: f.replace(/\.[^.]+$/, '').replace(/-/g, ' ')
                }));
        }
    } catch (e) {
        console.error('Dev scan error:', e);
    }
    return [];
};

export async function GET() {
    try {
        // Fetch images from galeria table
        const { data, error } = await (supabaseAdmin
            .from('galeria') as any)
            .select('id, image_url, category, alt_text, position')
            .order('category', { ascending: true })
            .order('position', { ascending: true });

        if (error) {
            console.error('Error fetching galeria:', error);
            // In dev, continue even if DB fails
            if (process.env.NODE_ENV !== 'development') {
                return NextResponse.json({ error: 'Error fetching gallery' }, { status: 500 });
            }
        }

        const categoryMap = new Map<string, { id: string; label: string; images: { src: string; alt: string }[] }>();

        // 1. Process DB Data
        for (const row of data || []) {
            // ... (keep existing logic but inline simplified)
            const category = row.category as string;
            let tabId = '';
            let tabLabel = '';

            const lower = category.toLowerCase();
            if (lower.includes('exterior')) { tabId = 'exteriores'; tabLabel = 'EXTERIORES'; }
            else if (lower.includes('interior')) { tabId = 'interiores'; tabLabel = 'INTERIORES'; }
            else if (lower.includes('playas')) { tabId = 'playas'; tabLabel = 'PLAYAS'; }
            else if (lower.includes('puntos')) { tabId = 'puntos-turisticos'; tabLabel = 'PUNTOS TURÍSTICOS'; }
            else continue;

            if (!categoryMap.has(tabId)) categoryMap.set(tabId, { id: tabId, label: tabLabel, images: [] });
            categoryMap.get(tabId)!.images.push({ src: row.image_url, alt: row.alt_text || 'Imagen' });
        }

        // 2. DEV MODE INJECTION: Force 'exterior' from filesystem
        // This ensures the user SEES the folder contents even if DB sync is missing.
        if (process.env.NODE_ENV === 'development') {
            const devExteriors = getDevImages('exterior');
            if (devExteriors.length > 0) {
                if (!categoryMap.has('exteriores')) {
                    categoryMap.set('exteriores', { id: 'exteriores', label: 'EXTERIORES', images: [] });
                }
                const tab = categoryMap.get('exteriores')!;
                const existingSrcs = new Set(tab.images.map(i => i.src));

                for (const img of devExteriors) {
                    if (!existingSrcs.has(img.src)) {
                        tab.images.push(img);
                    }
                }
            }
        }

        const order = ['exteriores', 'interiores', 'puntos-turisticos', 'playas'];
        const collections = order
            .filter(id => categoryMap.has(id))
            .map(id => categoryMap.get(id)!);

        return NextResponse.json(
            { collections },
            {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            }
        );
    } catch (error) {
        console.error('Error in galeria API:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
