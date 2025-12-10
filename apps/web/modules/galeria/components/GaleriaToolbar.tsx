'use client';

import type { GaleriaCategory } from '../types';
import { ImageIcon, RefreshCw, FolderOpen, Info, RotateCcw } from 'lucide-react';

type GaleriaToolbarProps = {
    category: GaleriaCategory | null;
    onSync?: () => void;
    onReset?: () => void;
    syncing?: boolean;
};

// Map category slugs to folder paths
const getCategoryPath = (categoryName: string): string => {
    const lowerName = categoryName.toLowerCase();

    if (lowerName.startsWith('galeria - ')) {
        const subcat = lowerName.replace('galeria - ', '').replace(/ /g, '-');
        return `public/images/galeria/${subcat}/`;
    }
    if (lowerName.startsWith('cabins - ')) {
        const subcat = lowerName.replace('cabins - ', '').replace(/ /g, '-');
        return `public/images/cabins/${subcat}/`;
    }
    if (['exterior', 'hero', 'proposito', 'common'].includes(lowerName)) {
        return `public/images/${lowerName}/`;
    }
    return `public/images/galeria/`;
};

export function GaleriaToolbar({ category, onSync, onReset, syncing }: GaleriaToolbarProps) {
    if (!category) {
        return (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gradient-to-r from-white to-gray-50 px-4 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700">Sin categoría seleccionada</p>
                        <p className="text-xs text-gray-500">Selecciona una categoría del panel izquierdo</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {onReset && (
                        <button
                            onClick={onReset}
                            disabled={syncing}
                            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            title="Limpiar registros huérfanos y resincronizar desde filesystem"
                        >
                            <RotateCcw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Reseteando...' : 'Reset BD'}
                        </button>
                    )}
                    {onSync && (
                        <button
                            onClick={onSync}
                            disabled={syncing}
                            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Sincronizando...' : 'Sincronizar Todo'}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const folderPath = getCategoryPath(category.name);

    return (
        <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-white to-primary-50/30 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 shadow-inner">
                        <ImageIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                {category.items.length} imagen{category.items.length === 1 ? '' : 'es'}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <FolderOpen className="h-3 w-3" />
                                {folderPath}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800">
                        <Info className="h-3.5 w-3.5" />
                        Arrastra para reordenar
                    </span>
                    {onReset && (
                        <button
                            onClick={onReset}
                            disabled={syncing}
                            className="flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-700 hover:shadow disabled:bg-gray-300 disabled:cursor-not-allowed"
                            title="Limpiar registros huérfanos y resincronizar desde filesystem"
                        >
                            <RotateCcw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            Reset BD
                        </button>
                    )}
                    {onSync && (
                        <button
                            onClick={onSync}
                            disabled={syncing}
                            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Sincronizando...' : 'Sincronizar'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

