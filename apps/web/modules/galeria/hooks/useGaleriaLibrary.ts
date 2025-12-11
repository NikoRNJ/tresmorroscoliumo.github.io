'use client';

import { useMemo, useState, useTransition, useEffect } from 'react';
import { nanoid } from 'nanoid';
import type {
    GaleriaCategory,
    GaleriaItem,
    GaleriaConstraints,
    GaleriaUploadJob,
} from '../types';
import { toSlugSegment } from '../utils/filePaths';

// Helper to extract error message from API response
const parseError = async (response: Response): Promise<string> => {
    try {
        const payload = await response.json();
        return payload?.error || 'No se pudo completar la acción.';
    } catch {
        return 'No se pudo completar la acción.';
    }
};

type UseGaleriaLibraryProps = {
    initialCategories: GaleriaCategory[];
    constraints: GaleriaConstraints;
};

export function useGaleriaLibrary({ initialCategories, constraints }: UseGaleriaLibraryProps) {
    // ---------- State ----------
    const [categories, setCategories] = useState<GaleriaCategory[]>(initialCategories);
    const [selectedCategory, setSelectedCategory] = useState<string>(initialCategories[0]?.slug ?? '');
    const [uploadQueue, setUploadQueue] = useState<GaleriaUploadJob[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isSyncing, setIsSyncing] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Sync state with props when they change (e.g. after server-side refresh)
    useEffect(() => {
        setCategories(initialCategories);
        // Also update selected category if it's invalid
        if (!initialCategories.find(c => c.slug === selectedCategory)) {
            setSelectedCategory(initialCategories[0]?.slug ?? '');
        }
    }, [initialCategories, selectedCategory]);

    // ---------- Derived values ----------
    const currentCategory = useMemo(() => {
        if (!selectedCategory) return categories[0] ?? null;
        return categories.find((cat) => cat.slug === selectedCategory) ?? categories[0] ?? null;
    }, [categories, selectedCategory]);

    // Helper to update items of a specific category
    const updateItems = (
        categorySlug: string,
        updater: (items: GaleriaItem[]) => GaleriaItem[]
    ) => {
        setCategories((prev) =>
            prev.map((cat) =>
                cat.slug === categorySlug ? { ...cat, items: updater(cat.items) } : cat
            )
        );
    };

    // ---------- Optimistic UI helpers ----------
    const optimisticUpdateMeta = (image: GaleriaItem, newAltText: string) => {
        setCategories((prev) =>
            prev.map((cat) => ({
                ...cat,
                items: cat.items.map((item) =>
                    item.id === image.id ? { ...item, altText: newAltText } : item
                ),
            }))
        );
    };

    const optimisticRemove = (imageId: string) => {
        setCategories((prev) =>
            prev.map((cat) => ({ ...cat, items: cat.items.filter((i) => i.id !== imageId) }))
        );
    };

    // ---------- API actions ----------
    const updateMeta = (image: GaleriaItem, payload: { altText?: string }) => {
        setMessage(null);
        setError(null);
        const newAltText = payload.altText ?? image.altText ?? '';
        optimisticUpdateMeta(image, newAltText);

        startTransition(async () => {
            const response = await fetch('/api/admin/galeria/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageId: image.id, altText: newAltText }),
            });
            if (!response.ok) {
                setError(await parseError(response));
                return;
            }
            setMessage('Metadatos actualizados.');
        });
    };

    const reorder = (orderedIds: string[]) => {
        if (!currentCategory) return;
        const reordered = orderedIds
            .map((id) => currentCategory.items.find((item) => item.id === id))
            .filter(Boolean) as GaleriaItem[];
        updateItems(currentCategory.slug, () =>
            reordered.map((item, idx) => ({ ...item, position: idx + 1 }))
        );
        fetch('/api/admin/galeria/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: currentCategory.name, orderedIds }),
        }).then(async (res) => {
            if (!res.ok) setError(await parseError(res));
        });
    };

    const upload = async (files: File[]) => {
        if (!currentCategory) return;

        // Create a map to keep reference to original files
        const fileMap = new Map<string, File>();

        const jobs: GaleriaUploadJob[] = files.map((file) => {
            const jobId = nanoid();
            fileMap.set(jobId, file);
            return {
                id: jobId,
                category: currentCategory.name,
                fileName: file.name,
                size: file.size,
                type: file.type,
                status: 'pending' as const,
                progress: 0,
            };
        });
        setUploadQueue((prev) => [...prev, ...jobs]);

        for (const job of jobs) {
            const file = fileMap.get(job.id);
            if (!file) continue;

            // Update status to uploading
            setUploadQueue((prev) =>
                prev.map((u) => (u.id === job.id ? { ...u, status: 'uploading' as const, progress: 10 } : u))
            );

            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', currentCategory.name);
            try {
                const response = await fetch('/api/admin/galeria/upload', {
                    method: 'POST',
                    body: formData,
                });
                if (!response.ok) throw new Error('Upload failed');
                const payload = await response.json();
                const img = payload.image as any;
                const newItem: GaleriaItem = {
                    id: img.id,
                    imageUrl: img.imageUrl,
                    storagePath: img.storagePath,
                    category: img.category,
                    position: img.position,
                    altText: img.altText,
                    createdAt: img.createdAt,
                    status: 'synced',
                };
                updateItems(currentCategory.slug, (items) => [...items, newItem]);
                setUploadQueue((prev) =>
                    prev.map((u) => (u.id === job.id ? { ...u, status: 'done' as const, progress: 100 } : u))
                );
            } catch (e) {
                console.error(e);
                setUploadQueue((prev) =>
                    prev.map((u) => (u.id === job.id ? { ...u, status: 'error' as const, progress: 100 } : u))
                );
                setError('Error subiendo el archivo.');
            }
        }
    };

    const remove = (image: GaleriaItem) => {
        setMessage(null);
        setError(null);
        optimisticRemove(image.id);
        startTransition(async () => {
            const response = await fetch('/api/admin/galeria/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageId: image.id }),
            });
            if (!response.ok) {
                setError(await parseError(response));
                // Re-sync to restore correct state
                await sync();
                return;
            }
            // Success: state is already updated optimally. Do NOT re-sync immediately 
            // to avoid race conditions with filesystem lagging.
            // await sync(); 
            setMessage('Imagen eliminada correctamente.');
        });
    };

    // ---------- Sync & verification ----------
    const sync = async () => {
        setIsSyncing(true);
        setMessage(null);
        setError(null);
        try {
            const response = await fetch('/api/admin/galeria/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                setError(await parseError(response));
                return;
            }
            const payload = await response.json();
            const images = (payload?.images || []) as any[];
            const categoryMap = new Map<string, GaleriaCategory>();
            for (const img of images) {
                const slug = toSlugSegment(img.category);
                if (!categoryMap.has(slug)) {
                    categoryMap.set(slug, { name: img.category, slug, items: [], editable: true });
                }
                const cat = categoryMap.get(slug)!;
                cat.items.push({
                    id: img.id,
                    imageUrl: img.image_url.replace(/\\/g, '/'),
                    storagePath: img.storage_path,
                    category: img.category,
                    position: img.position,
                    altText: img.alt_text,
                    createdAt: img.created_at,
                    status: 'synced',
                });
            }
            const newCategories = Array.from(categoryMap.values());

            // SECURITY CHECK: If sync returns nothing and we have data, something might be wrong. Don't wipe UI.
            if (newCategories.length === 0 && categories.length > 0) {
                console.warn('[UseGaleriaLibrary] Sync returned empty, aborting destructive update.');
                // No actualizamos categories, mantenemos lo que hay.
                return;
            }

            // Preserve any empty categories that might exist locally
            const emptyCats = categories.filter((c) => c.items.length === 0 && !categoryMap.has(c.slug));
            setCategories([...newCategories, ...emptyCats]);
        } catch (e) {
            console.error(e);
            setError('Error al sincronizar.');
        } finally {
            setIsSyncing(false);
        }
    };

    // Reset: Clean orphaned DB records and resync from filesystem
    const reset = async () => {
        setIsSyncing(true);
        setMessage(null);
        setError(null);
        try {
            const response = await fetch('/api/admin/galeria/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                setError(await parseError(response));
                return;
            }
            const payload = await response.json();
            setMessage(`Reset completado. Eliminados: ${payload.summary?.orphanedDeleted || 0}, Añadidos: ${payload.summary?.added || 0}`);
            // Now sync to refresh UI
            await sync();
        } catch (e) {
            console.error(e);
            setError('Error al resetear.');
        } finally {
            setIsSyncing(false);
        }
    };

    // Initial load
    // Disabled auto-sync to rely on SSR data (initialCategories) and prevent flickering or destructive sync on mount.
    // useEffect(() => {
    //     void sync();
    // }, []);

    // ---------- Helper actions ----------
    const selectCategory = (slug: string) => setSelectedCategory(slug);
    const clearFeedback = () => {
        setMessage(null);
        setError(null);
    };
    const addCategory = (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const slug = toSlugSegment(trimmed);
        if (categories.some((c) => c.slug === slug)) return;
        setCategories((prev) => [...prev, { name: trimmed, slug, items: [], editable: true }]);
        setNewCategoryName('');
    };

    return {
        categories,
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
    };
}
