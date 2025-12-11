import { nanoid } from 'nanoid';

const ACCENTS_REGEX = /[\u0300-\u036f]/g;
const INVALID_CHARS_REGEX = /[^a-z0-9]+/g;
const FALLBACK_SVG =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120" fill="none" stroke="%23cbd5e1" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="148" height="108" rx="12" fill="%23f8fafc"/><path d="M38 86l24-30 26 26 18-20 16 20"/><circle cx="58" cy="48" r="8"/></svg>';

const normalize = (value?: string | null): string => (value ?? '').replace(/\\/g, '/').trim();

const encodePath = (value: string): string => {
    try {
        if (value.includes('%')) return value;
        const [base, query] = value.split('?');
        const encodedBase = base
            .split('/')
            .map((segment, idx) => (idx === 0 ? segment : encodeURIComponent(segment)))
            .join('/');
        return query ? `${encodedBase}?${query}` : encodedBase;
    } catch {
        return value;
    }
};

const looksLikeStoragePath = (value: string): boolean =>
    /^[a-z0-9._-]+(?:\/[a-z0-9._-]+)+$/i.test(value);

const buildSupabasePublicUrl = (pathValue?: string | null): string | null => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
    if (!supabaseUrl) return null;

    const raw = normalize(pathValue);
    if (!raw) return null;

    if (
        raw.startsWith('public/') ||
        raw.startsWith('/public/') ||
        raw.startsWith('/images/') ||
        raw.startsWith('images/') ||
        raw.startsWith('local://')
    ) {
        return null;
    }

    const cleaned = raw
        .replace(/^supabase:\/\//i, '')
        .replace(/^\/+/, '')
        .replace(/^galeria\//i, '');

    if (!raw.startsWith('supabase://') && !looksLikeStoragePath(cleaned)) {
        return null;
    }

    if (!cleaned) return null;
    return `${supabaseUrl}/storage/v1/object/public/galeria/${cleaned}`;
};

const buildLocalPublicUrl = (pathValue?: string | null): string | null => {
    const raw = normalize(pathValue);
    if (!raw) return null;

    if (raw.startsWith('/images/')) return encodePath(raw);
    if (raw.startsWith('images/')) return encodePath(`/${raw}`);
    if (raw.startsWith('/public/images/')) return encodePath(raw.replace(/^\/public/, ''));
    if (raw.startsWith('public/images/')) return encodePath(`/${raw.replace(/^public\//, '')}`);

    if (raw.startsWith('local://')) {
        const cleaned = raw.replace('local://', '').replace(/^\/+/, '');
        return buildLocalPublicUrl(cleaned);
    }

    if (raw.startsWith('galeria/')) {
        return encodePath(`/images/${raw}`);
    }

    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
        return encodePath(`/images/galeria/${raw.replace(/^\/+/, '')}`);
    }

    return null;
};

/**
 * Convert a string to a URL-safe slug
 */
export const toSlugSegment = (value: string): string => {
    const normalized = value
        .normalize('NFD')
        .replace(ACCENTS_REGEX, '')
        .toLowerCase()
        .replace(INVALID_CHARS_REGEX, '-')
        .replace(/^-+|-+$/g, '');

    return normalized || 'general';
};

/**
 * Generate a unique filename with timestamp and random suffix
 */
export const generateFileName = (base: string, extension: string): string => {
    const slug = toSlugSegment(base);
    const short = nanoid(4);
    const safeExtension = extension.replace('.', '').toLowerCase() || 'webp';
    return `${slug}-${Date.now()}-${short}.${safeExtension}`;
};

/**
 * Helper to determine storage prefix based on category name.
 * Aligns with the admin/rebuild script structure.
 */
function getCategoryStoragePrefix(category: string): string {
    const slug = toSlugSegment(category);

    if (slug === 'hero') return 'hero/';
    if (slug === 'proposito') return 'proposito/';

    // Cabins: "Cabaña Caleta Del Medio" -> "cabins/caleta-del-medio/"
    // Slug for "Cabaña Caleta Del Medio" is "cabana-caleta-del-medio"
    if (slug.startsWith('cabana-') || category.toLowerCase().trim().startsWith('cabaña')) {
        // Try to extract the name part. 
        const cabinSlug = slug.replace(/^cabana-/, '');
        if (cabinSlug) return `cabins/${cabinSlug}/`;
    }

    // Standard gallery folders (exterior, interior, etc.)
    // Stored at root in the bucket: 'exterior/', 'interior/'
    // We map the slug directly to the folder.
    return `${slug}/`;
}

/**
 * Build the storage path for a galeria image
 * Format: {prefix}/{filename}
 */
export const buildGaleriaPath = (category: string, fileName: string): string =>
    `${getCategoryStoragePrefix(category)}${fileName}`;

/**
 * Build the folder prefix for a category
 */
export const buildGaleriaFolderPrefix = (category: string): string =>
    getCategoryStoragePrefix(category);

/**
 * Get the next position number for a new item
 */
export const nextPosition = (items: { position?: number }[]): number => {
    if (!items.length) return 1;
    const positions = items.map((item) => item.position ?? 0);
    return Math.max(...positions) + 1;
};

/**
 * Resuelve la URL de imagen para que siempre sea accesible en el dashboard
 * - Prefiere URLs absolutas (https)
 * - Si hay storage_path, construye la URL publica (Supabase/local)
 * - Normaliza rutas relativas con o sin prefijos
 */
export function resolveImageUrl(imageUrl: string | null | undefined, storagePath?: string | null): string {
    const rawUrl = normalize(imageUrl);
    const rawStorage = normalize(storagePath);

    if (rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:'))) {
        return rawUrl;
    }

    const supabaseFromStorage = buildSupabasePublicUrl(rawStorage);
    const shouldPreferSupabase =
        !rawUrl ||
        rawUrl.startsWith('/images/') ||
        rawUrl.startsWith('images/') ||
        rawUrl.startsWith('/public/images/') ||
        rawUrl.startsWith('public/images/') ||
        looksLikeStoragePath(rawUrl);

    if (supabaseFromStorage && shouldPreferSupabase) {
        return supabaseFromStorage;
    }

    const localFromUrl = buildLocalPublicUrl(rawUrl);
    if (localFromUrl) return localFromUrl;

    if (supabaseFromStorage) return supabaseFromStorage;

    if (rawUrl && looksLikeStoragePath(rawUrl)) {
        const supabaseFromUrl = buildSupabasePublicUrl(`supabase://${rawUrl}`);
        if (supabaseFromUrl) return supabaseFromUrl;
    }

    const localFromStorage = buildLocalPublicUrl(rawStorage);
    if (localFromStorage) return localFromStorage;

    return rawUrl ? encodePath(rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`) : FALLBACK_SVG;
}
