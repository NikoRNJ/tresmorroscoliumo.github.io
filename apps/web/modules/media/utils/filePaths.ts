import crypto from 'node:crypto';
import { MediaItem } from '../types';

const ACCENTS_REGEX = /[\u0300-\u036f]/g;
const INVALID_CHARS_REGEX = /[^a-z0-9]+/g;

export const toSlugSegment = (value: string) => {
  const normalized = value
    .normalize('NFD')
    .replace(ACCENTS_REGEX, '')
    .toLowerCase()
    .replace(INVALID_CHARS_REGEX, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'media';
};

export const generateFileName = (base: string, extension: string) => {
  const slug = toSlugSegment(base);
  const short = crypto.randomBytes(2).toString('hex');
  const safeExtension = extension.replace('.', '').toLowerCase() || 'webp';
  return `${slug}-${Date.now()}-${short}.${safeExtension}`;
};

export const buildMediaPath = (cabinSlug: string, fileName: string) =>
  `cabins/${toSlugSegment(cabinSlug)}/gallery/${fileName}`;

export const buildFolderPrefix = (cabinSlug: string) =>
  `cabins/${toSlugSegment(cabinSlug)}/gallery/`;

type SortCandidate = Partial<Pick<MediaItem, 'sortOrder'>> & { sort_order?: number };

export const nextSortOrder = (items: SortCandidate[]) => {
  if (!items.length) return 1;
  const values = items.map((item) =>
    typeof item.sortOrder === 'number'
      ? item.sortOrder
      : typeof item.sort_order === 'number'
        ? item.sort_order
        : 0
  );
  return Math.max(...values) + 1;
};
