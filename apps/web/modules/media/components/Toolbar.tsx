'use client';

import { RefreshCw } from 'lucide-react';
import type { MediaFolder } from '../types';
import { cn } from '@core/lib/utils/cn';

type ToolbarProps = {
  folder: MediaFolder | null;
  onSync: () => void;
  syncing: boolean;
};

export function Toolbar({ folder, onSync, syncing }: ToolbarProps) {
  if (!folder) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-gray-900">{folder.cabinTitle}</span>
        <span className="text-xs text-gray-500">
          {folder.items.length} imagen{folder.items.length === 1 ? '' : 'es'} - {folder.cabinSlug}
        </span>
      </div>
      <button
        onClick={onSync}
        disabled={syncing}
        className={cn(
          'flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors',
          syncing ? 'bg-gray-100 text-gray-500' : 'hover:bg-gray-50'
        )}
      >
        <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
        {syncing ? 'Sincronizando...' : 'Sync carpeta'}
      </button>
    </div>
  );
}
