'use client';

import { useState } from 'react';
import type { GaleriaItem } from '../types';
import { Trash2, GripVertical, Edit2, X, Check, ImageOff } from 'lucide-react';

type GaleriaImageCardProps = {
    item: GaleriaItem;
    disabled?: boolean;
    onDelete: (item: GaleriaItem) => void;
    onUpdateMeta: (item: GaleriaItem, payload: { altText?: string }) => void;
};

export function GaleriaImageCard({
    item,
    disabled,
    onDelete,
    onUpdateMeta,
}: GaleriaImageCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editAltText, setEditAltText] = useState(item.altText || '');
    const [imageError, setImageError] = useState(false);

    const handleSave = () => {
        onUpdateMeta(item, { altText: editAltText });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditAltText(item.altText || '');
        setIsEditing(false);
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

    // Extract filename from URL
    const fileName = item.imageUrl.split('/').pop() || item.id;

    return (
        <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-primary-200">
            {/* Image */}
            <div className="relative aspect-[4/3] w-full bg-gray-200">
                {imageError || !item.imageUrl ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <ImageOff className="h-8 w-8 mb-2" />
                        <span className="text-xs">No se pudo cargar</span>
                        <span className="text-xs text-gray-300 mt-1 max-w-[90%] truncate">{item.imageUrl}</span>
                    </div>
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={item.imageUrl}
                        alt={item.altText || 'Imagen de galería'}
                        className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                        onError={() => setImageError(true)}
                        decoding="async"
                    />
                )}

                {/* Position badge */}
                <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
                    #{item.position}
                </div>

                {/* Category badge */}
                <div className={`absolute right-2 top-2 rounded-full ${getCategoryColor()} px-2.5 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-sm`}>
                    {categoryDisplayName}
                </div>

                {/* Drag handle overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                    <GripVertical className="h-10 w-10 text-white drop-shadow-lg" />
                </div>
            </div>

            {/* Info */}
            <div className="p-2">
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
                        <button
                            onClick={handleSave}
                            className="rounded p-1 text-green-600 hover:bg-green-50"
                        >
                            <Check className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleCancel}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
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
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => onDelete(item)}
                                disabled={disabled}
                                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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
