'use client';

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
import type { MediaItem } from '../types';
import { ImageCard } from './ImageCard';

type SortableGridProps = {
  items: MediaItem[];
  onReorder: (ids: string[]) => void;
  onSetPrimary: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onUpdateMeta: (item: MediaItem, payload: { altText?: string; sortOrder?: number }) => void;
  disabled?: boolean;
};

const SortableItem = ({
  item,
  disabled,
  onDelete,
  onSetPrimary,
  onUpdateMeta,
}: {
  item: MediaItem;
  disabled?: boolean;
  onDelete: (item: MediaItem) => void;
  onSetPrimary: (item: MediaItem) => void;
  onUpdateMeta: (item: MediaItem, payload: { altText?: string; sortOrder?: number }) => void;
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
      <ImageCard
        item={item}
        disabled={disabled}
        onDelete={onDelete}
        onSetPrimary={onSetPrimary}
        onUpdateMeta={onUpdateMeta}
      />
    </div>
  );
};

export function SortableGrid({
  items,
  onReorder,
  onDelete,
  onSetPrimary,
  onUpdateMeta,
  disabled,
}: SortableGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
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
        Sin imagenes en esta carpeta.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              disabled={disabled}
              onDelete={onDelete}
              onSetPrimary={onSetPrimary}
              onUpdateMeta={onUpdateMeta}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
