'use client';

import { useMediaLibrary } from '../hooks/useMediaLibrary';
import type { MediaFolder, UploadConstraints } from '../types';
import { FolderTree } from './FolderTree';
import { Toolbar } from './Toolbar';
import { UploadDropzone } from './UploadDropzone';
import { UploadQueue } from './UploadQueue';
import { SortableGrid } from './SortableGrid';

type MediaDashboardProps = {
  folders: MediaFolder[];
  constraints: UploadConstraints;
};

export function MediaDashboard({ folders, constraints }: MediaDashboardProps) {
  const {
    folders: stateFolders,
    currentFolder,
    selectFolder,
    setPrimary,
    updateMeta,
    reorder,
    remove,
    upload,
    sync,
    uploadQueue,
    isSyncing,
    isPending,
    message,
    error,
    clearFeedback,
    setError,
  } = useMediaLibrary({ initialFolders: folders, constraints });

  const isReadOnly = currentFolder?.editable === false || currentFolder?.type === 'static';

  return (
    <div className="flex gap-4">
      <FolderTree
        folders={stateFolders}
        selected={currentFolder?.cabinSlug ?? null}
        onSelect={(slug) => {
          clearFeedback();
          selectFolder(slug);
        }}
      />
      <div className="flex-1 space-y-4">
        <Toolbar
          folder={currentFolder}
          readOnly={isReadOnly}
          onSync={() => {
            clearFeedback();
            void sync();
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
        <UploadDropzone
          constraints={constraints}
          onFiles={(files) => {
            void upload(files);
          }}
          onError={(msg) => {
            clearFeedback();
            setError(msg);
          }}
          disabled={!currentFolder || isPending || isSyncing || isReadOnly}
        />
        <UploadQueue jobs={uploadQueue} />
        <SortableGrid
          items={currentFolder?.items ?? []}
          onReorder={reorder}
          onDelete={remove}
          onSetPrimary={setPrimary}
          onUpdateMeta={updateMeta}
          disabled={isPending || isSyncing || isReadOnly}
        />
      </div>
    </div>
  );
}
