'use client';

import { useGaleriaLibrary } from '../hooks/useGaleriaLibrary';
import type { GaleriaCategory, GaleriaConstraints } from '../types';
import { CategoryTree } from './CategoryTree';
import { GaleriaToolbar } from './GaleriaToolbar';
import { GaleriaDropzone } from './GaleriaDropzone';
import { GaleriaUploadQueue } from './GaleriaUploadQueue';
import { GaleriaSortableGrid } from './GaleriaSortableGrid';
import { Plus } from 'lucide-react';

type GaleriaDashboardProps = {
    categories: GaleriaCategory[];
    constraints: GaleriaConstraints;
};

export function GaleriaDashboard({ categories, constraints }: GaleriaDashboardProps) {
    const {
        categories: stateCategories,
        currentCategory,
        selectCategory,
        updateMeta,
        reorder,
        remove,
        upload,
        sync,
        reset,
        uploadQueue,
        isPending,
        isSyncing,
        message,
        error,
        clearFeedback,
        setError,
        newCategoryName,
        setNewCategoryName,
        addCategory,
    } = useGaleriaLibrary({ initialCategories: categories, constraints });

    return (
        <div className="flex gap-4">
            <div className="w-64 shrink-0 space-y-4">
                <CategoryTree
                    categories={stateCategories}
                    selected={currentCategory?.slug ?? null}
                    onSelect={(slug: string) => {
                        clearFeedback();
                        selectCategory(slug);
                    }}
                />

                {/* Add new category */}
                <div className="border-t border-gray-200 pt-4">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                        Nueva categoría
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    addCategory(newCategoryName);
                                }
                            }}
                            placeholder="Ej: Bautizos"
                            className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <button
                            onClick={() => addCategory(newCategoryName)}
                            disabled={!newCategoryName.trim()}
                            className="rounded-md bg-primary-600 p-1.5 text-white hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 space-y-4">
                <GaleriaToolbar
                    category={currentCategory}
                    onSync={() => {
                        clearFeedback();
                        void sync();
                    }}
                    onReset={() => {
                        clearFeedback();
                        void reset();
                    }}
                    syncing={isSyncing}
                />

                {message && (
                    <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
                        {error}
                    </div>
                )}

                <GaleriaDropzone
                    constraints={constraints}
                    onFiles={(files: File[]) => {
                        void upload(files);
                    }}
                    onError={(msg: string) => {
                        clearFeedback();
                        setError(msg);
                    }}
                    disabled={!currentCategory || isPending || isSyncing}
                />

                <GaleriaUploadQueue jobs={uploadQueue} />

                <GaleriaSortableGrid
                    items={currentCategory?.items ?? []}
                    onReorder={reorder}
                    onDelete={remove}
                    onUpdateMeta={updateMeta}
                    disabled={isPending || isSyncing}
                />
            </div>
        </div>
    );
}

