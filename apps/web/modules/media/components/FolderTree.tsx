'use client';

import type { MediaFolder } from '../types';
import { cn } from '@core/lib/utils/cn';

type FolderTreeProps = {
  folders: MediaFolder[];
  selected: string | null;
  onSelect: (slug: string) => void;
};

export function FolderTree({ folders, selected, onSelect }: FolderTreeProps) {
  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900">Carpetas</h2>
        <p className="text-xs text-gray-500">Una carpeta por cabana</p>
      </div>
      <div className="space-y-1 p-3">
        {folders.map((folder) => {
          const isActive = folder.cabinSlug === selected;
          return (
            <button
              key={folder.cabinSlug}
              onClick={() => onSelect(folder.cabinSlug)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors',
                isActive ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-100 text-gray-700'
              )}
            >
              <div className="flex flex-col">
                <span className="font-medium">{folder.cabinTitle}</span>
                <span className="text-xs text-gray-500">{folder.cabinSlug}</span>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {folder.items.length}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
