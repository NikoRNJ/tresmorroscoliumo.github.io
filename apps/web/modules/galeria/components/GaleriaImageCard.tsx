'use client';

import { useState, useEffect } from 'react';
// import Image from 'next/image';
import type { GaleriaItem } from '../types';
import { Trash2, GripVertical, Edit2, X, Check, ImageOff, RefreshCw, ExternalLink, Eye } from 'lucide-react';
import { resolveImageUrl } from '../utils/filePaths';

type GaleriaImageCardProps = {
    item: GaleriaItem;
    disabled?: boolean;
    onDelete: (item: GaleriaItem) => void;
    onUpdateMeta: (item: GaleriaItem, payload: { altText?: string }) => void;
    onPreview?: (item: GaleriaItem) => void;
};

/**
 * Resuelve la URL de imagen - intenta Supabase Storage si es URL relativa local
 */


export function GaleriaImageCard({
    item,
    disabled,
    onDelete,
    onUpdateMeta,
    onPreview,
}: GaleriaImageCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editAltText, setEditAltText] = useState(item.altText || '');
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // Resolver URL de imagen
    const imageUrl = resolveImageUrl(item.imageUrl, item.storagePath);

    // Extract filename from URL (moved up to be available in render)
    const fileName = item.imageUrl.split('/').pop() || item.id;

    // Reset error state when item changes
    useEffect(() => {
        setImageError(false);
        setImageLoaded(false);
        setRetryCount(0);
    }, [item.id, item.imageUrl]);

    const handleSave = () => {
        onUpdateMeta(item, { altText: editAltText });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditAltText(item.altText || '');
        setIsEditing(false);
    };

    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
        setImageError(false);
        setImageLoaded(false);
    };

    // Get category display name
    const categoryDisplayName = item.category.includes(' - ')
        ? item.category.split(' - ')[1]
        : item.category;

    // Get category color based on type
    const getCategoryColor = () => {
        const lowerCat = item.category.toLowerCase();
        if (lowerCat.startsWith('galeria')) return 'bg-purple-500/80';
        if (lowerCat.startsWith('cabin')) return 'bg-blue-500/80';
        if (lowerCat === 'hero') return 'bg-amber-500/80';
        if (lowerCat === 'proposito') return 'bg-green-500/80';
        if (lowerCat === 'exterior') return 'bg-cyan-500/80';
        return 'bg-gray-500/80';
    };

    return (
        <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-primary-200">
            {/* Image Container */}
            <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-gray-200 to-gray-300">
                {imageError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50 p-2">
                        <ImageOff className="h-8 w-8 mb-2 text-gray-300" />
                        <span className="text-xs text-center font-medium">No se pudo cargar</span>
                        <span className="text-[10px] text-gray-400 mt-1 max-w-full truncate px-2" title={item.imageUrl}>
                            {fileName}
                        </span>
                        <button
                            onClick={handleRetry}
                            className="mt-2 flex items-center gap-1 rounded bg-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-300 transition-colors"
                        >
                            <RefreshCw className="h-3 w-3" />
                            Reintentar
                        </button>
                        <a
                            href={imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 flex items-center gap-1 text-[10px] text-blue-500 hover:underline"
                        >
                            <ExternalLink className="h-3 w-3" />
                            Ver URL
                        </a>
                    </div>
                ) : (
                    <>
                        {/* Loading skeleton */}
                        {!imageLoaded && (
                            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 to-gray-300">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
                                </div>
                            </div>
                        )}

                        {/* Actual image - USANDO IMG NATIVO para máxima fiabilidad en Admin */}
                        <img
                            key={`${item.id}-${retryCount}`}
                            src={imageUrl}
                            alt={item.altText || 'Imagen de galería'}
                            className="absolute inset-0 h-full w-full object-cover transition-all duration-300 group-hover:scale-105"
                            onLoad={() => setImageLoaded(true)}
                            onError={(e) => {
                                console.error('Error cargando imagen nativa:', imageUrl);
                                setImageError(true);
                            }}
                            loading="eager"
                        />
                    </>
                )}

                {/* Position badge */}
                <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-sm z-10 pointer-events-none">
                    #{item.position}
                </div>

                {/* Category badge */}
                <div className={`absolute right-2 top-2 rounded-full ${getCategoryColor()} px-2.5 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-sm z-10 pointer-events-none`}>
                    {categoryDisplayName}
                </div>

                {/* Overlay Controls (Drag & Preview) */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100 z-20">
                    {/* Drag Handle */}
                    <div className="cursor-grab active:cursor-grabbing p-4 opacity-70 hover:opacity-100">
                        <GripVertical className="h-10 w-10 text-white drop-shadow-lg" />
                    </div>

                    {/* Preview Button */}
                    {onPreview && !imageError && (
                        <button
                            className="absolute bottom-3 right-3 rounded-full bg-white/20 p-2 text-white shadow-lg backdrop-blur-md hover:bg-white/40 active:scale-95 transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPreview(item);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            title="Previsualizar imagen"
                        >
                            <Eye className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="p-2 bg-white">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={editAltText}
                            onChange={(e) => setEditAltText(e.target.value)}
                            className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            placeholder="Texto alternativo"
                            autoFocus
                        />
                        <button onClick={handleSave} className="rounded p-1 text-green-600 hover:bg-green-50">
                            <Check className="h-4 w-4" />
                        </button>
                        <button onClick={handleCancel} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onPreview?.(item)}>
                            <p className="truncate text-xs font-medium text-gray-900" title={fileName}>
                                {fileName}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                                {item.altText || 'Sin descripción'}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsEditing(true)}
                                disabled={disabled}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                                title="Editar descripción"
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => onDelete(item)}
                                disabled={disabled}
                                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                title="Eliminar imagen"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
