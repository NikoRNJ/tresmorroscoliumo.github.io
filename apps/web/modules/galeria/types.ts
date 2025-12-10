/**
 * Types for the Galeria module
 */

export type GaleriaItem = {
    id: string;
    imageUrl: string;
    storagePath: string | null;
    category: string;
    position: number;
    altText: string | null;
    createdAt: string;
    status?: 'synced' | 'uploading' | 'error';
};

export type GaleriaCategory = {
    name: string;
    slug: string;
    items: GaleriaItem[];
    editable?: boolean;
};

export type GaleriaUploadJob = {
    id: string;
    category: string;
    fileName: string;
    size: number;
    type: string;
    previewUrl?: string;
    progress: number;
    status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
    error?: string;
};

export type GaleriaConstraints = {
    maxSizeMb: number;
    allowedTypes: string[];
};
