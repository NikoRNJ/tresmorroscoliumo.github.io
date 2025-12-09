'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Star, Trash2 } from 'lucide-react';
import type { MediaItem } from '../types';
import { cn } from '@core/lib/utils/cn';

type ImageCardProps = {
  item: MediaItem;
  onSetPrimary: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onUpdateMeta: (item: MediaItem, payload: { altText?: string; sortOrder?: number }) => void;
  disabled?: boolean;
};

export function ImageCard({
  item,
  onSetPrimary,
  onDelete,
  onUpdateMeta,
  disabled,
}: ImageCardProps) {
  const [localAlt, setLocalAlt] = useState(item.altText ?? '');
  const [localOrder, setLocalOrder] = useState(item.sortOrder ?? 0);

  useEffect(() => {
    setLocalAlt(item.altText ?? '');
    setLocalOrder(item.sortOrder ?? 0);
  }, [item.altText, item.sortOrder]);

  return (
    <div className="group relative space-y-3 rounded-md border border-gray-100 bg-white p-3 shadow-sm">
      <div className="relative h-40 w-full overflow-hidden rounded-md">
        <Image
          src={item.url}
          alt={item.altText ?? item.id}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform group-hover:scale-[1.02]"
        />
        {item.isPrimary && (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-green-700 shadow">
            Principal
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => onSetPrimary(item)}
          disabled={item.isPrimary || disabled}
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors',
            item.isPrimary
              ? 'bg-green-50 text-green-700'
              : 'bg-primary-50 text-primary-700 hover:bg-primary-100',
            disabled && 'pointer-events-none opacity-60'
          )}
        >
          <Star className="h-4 w-4" />
          {item.isPrimary ? 'Destacada' : 'Marcar principal'}
        </button>
        <button
          onClick={() => onDelete(item)}
          disabled={disabled}
          className="rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="mr-1 inline h-4 w-4" />
          Eliminar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600">Orden</span>
          <input
            type="number"
            value={localOrder}
            onChange={(event) => setLocalOrder(Number(event.target.value))}
            onBlur={() => onUpdateMeta(item, { sortOrder: Number(localOrder) })}
            className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm"
            disabled={disabled}
          />
        </label>
        <label className="flex flex-col gap-1 col-span-1">
          <span className="text-xs font-medium text-gray-600">Alt text</span>
          <input
            type="text"
            value={localAlt}
            onChange={(event) => setLocalAlt(event.target.value)}
            onBlur={() => onUpdateMeta(item, { altText: localAlt })}
            className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm"
            disabled={disabled}
          />
        </label>
      </div>
    </div>
  );
}
