import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/galeria
 * Public API to fetch gallery images grouped by category
 * Used by the frontend Gallery component
 */

// Helper for dev mode fallback
const getDevImages = (subfolder: string) => {
    try {
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
    // Crear cliente fresco para evitar caching
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('[galeria] Missing Supabase credentials');
        return NextResponse.json({ collections: [], error: 'Config error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
        // Fetch images from galeria table
        const { data, error } = await supabase
            .from('galeria')
            .select('id, image_url, category, alt_text, position')
            .order('category', { ascending: true })
            .order('position', { ascending: true });

        if (error) {
            console.error('[galeria] Error fetching:', error);
            if (process.env.NODE_ENV !== 'development') {
                return NextResponse.json({ collections: [], error: error.message });
            }
        }

        console.log(`[galeria] Fetched ${data?.length || 0} records`);

        const categoryMap = new Map<string, { id: string; label: string; images: { src: string; alt: string }[] }>();

        // Process DB Data
        for (const row of data || []) {
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

        // DEV MODE & PRODUCTION: Add filesystem images for all categories
        const folderMappings = [
            { folder: 'exterior', id: 'exteriores', label: 'EXTERIORES' },
            { folder: 'interior', id: 'interiores', label: 'INTERIORES' },
            { folder: 'playas', id: 'playas', label: 'PLAYAS' },
            { folder: 'puntos-turisticos', id: 'puntos-turisticos', label: 'PUNTOS TURÍSTICOS' },
        ];

        for (const mapping of folderMappings) {
            const devImages = getDevImages(mapping.folder);
            if (devImages.length > 0) {
                if (!categoryMap.has(mapping.id)) {
                    categoryMap.set(mapping.id, { id: mapping.id, label: mapping.label, images: [] });
                }
                const tab = categoryMap.get(mapping.id)!;
                // Replace DB images with local filesystem images for consistency
                tab.images = devImages;
            }
        }

        const order = ['exteriores', 'interiores', 'puntos-turisticos', 'playas'];
        const collections = order
            .filter(id => categoryMap.has(id))
            .map(id => categoryMap.get(id)!);

        console.log(`[galeria] Returning ${collections.length} collections`);

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
        console.error('[galeria] Error:', error);
        return NextResponse.json({ collections: [], error: 'Internal error' });
    }
}
