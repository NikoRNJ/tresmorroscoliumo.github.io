'use client';

import { useState } from 'react';
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GaleriaItem } from '../types';
import { GaleriaImageCard } from './GaleriaImageCard';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

// Resolve URL helper (duplicado pero necesario o importado si estuviera en utils)
function resolveImageUrl(imageUrl: string, storagePath?: string | null): string {
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/images/galeria/') && storagePath?.startsWith('supabase://')) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const relativePath = storagePath.replace('supabase://', '');
        return `${supabaseUrl}/storage/v1/object/public/galeria/${relativePath}`;
    }
    return imageUrl;
}

type GaleriaSortableGridProps = {
    items: GaleriaItem[];
    onReorder: (ids: string[]) => void;
    onDelete: (item: GaleriaItem) => void;
    onUpdateMeta: (item: GaleriaItem, payload: { altText?: string }) => void;
    disabled?: boolean;
};

const SortableItem = ({
    item,
    disabled,
    onDelete,
    onUpdateMeta,
    onPreview,
}: {
    item: GaleriaItem;
    disabled?: boolean;
    onDelete: (item: GaleriaItem) => void;
    onUpdateMeta: (item: GaleriaItem, payload: { altText?: string }) => void;
    onPreview: (item: GaleriaItem) => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: item.id,
        disabled,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <GaleriaImageCard
                item={item}
                disabled={disabled}
                onDelete={onDelete}
                onUpdateMeta={onUpdateMeta}
                onPreview={onPreview}
            />
        </div>
    );
};

export function GaleriaSortableGrid({
    items,
    onReorder,
    onDelete,
    onUpdateMeta,
    disabled,
}: GaleriaSortableGridProps) {
    const [lightboxIndex, setLightboxIndex] = useState(-1);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 }, // Aumentado ligeramente para evitar conflictos con clic
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const newOrder = arrayMove(items, oldIndex, newIndex).map((item) => item.id);
        onReorder(newOrder);
    };

    if (!items.length) {
        return (
            <div className="rounded-md border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                Sin imágenes en esta categoría. Sube imágenes usando la zona de arrastre.
            </div>
        );
    }

    // Preparar slides para el lightbox
    const slides = items.map(item => ({
        src: resolveImageUrl(item.imageUrl, item.storagePath),
        alt: item.altText,
        title: item.altText,
    }));

    return (
        <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {items.map((item, index) => (
                            <SortableItem
                                key={item.id}
                                item={item}
                                disabled={disabled}
                                onDelete={onDelete}
                                onUpdateMeta={onUpdateMeta}
                                onPreview={() => setLightboxIndex(index)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <Lightbox
                open={lightboxIndex >= 0}
                index={lightboxIndex}
                close={() => setLightboxIndex(-1)}
                slides={slides}
                controller={{ closeOnBackdropClick: true }}
                styles={{ container: { backgroundColor: "rgba(0, 0, 0, .9)" } }}
            />
        </>
    );
}
