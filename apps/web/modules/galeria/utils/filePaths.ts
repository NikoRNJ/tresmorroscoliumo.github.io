import { nanoid } from 'nanoid';

const ACCENTS_REGEX = /[\u0300-\u036f]/g;
const INVALID_CHARS_REGEX = /[^a-z0-9]+/g;

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
 * Build the storage path for a galeria image
 * Format: galeria/{category-slug}/{filename}
 */
export const buildGaleriaPath = (category: string, fileName: string): string =>
    `galeria/${toSlugSegment(category)}/${fileName}`;

/**
 * Build the folder prefix for a category
 */
export const buildGaleriaFolderPrefix = (category: string): string =>
    `galeria/${toSlugSegment(category)}/`;

/**
 * Get the next position number for a new item
 */
export const nextPosition = (items: { position?: number }[]): number => {
    if (!items.length) return 1;
    const positions = items.map((item) => item.position ?? 0);
    return Math.max(...positions) + 1;
};
