'use client';

import { useMemo, useState, useTransition } from 'react';
import { nanoid } from 'nanoid';
import type {
  MediaFolder,
  MediaItem,
  UploadConstraints,
  UploadJob,
} from '../types';

const parseError = async (response: Response) => {
  try {
    const payload = await response.json();
    return payload?.error || 'No se pudo completar la accion.';
  } catch {
    return 'No se pudo completar la accion.';
  }
};

type UseMediaLibraryProps = {
  initialFolders: MediaFolder[];
  constraints: UploadConstraints;
};

export function useMediaLibrary({ initialFolders, constraints }: UseMediaLibraryProps) {
  const [folders, setFolders] = useState<MediaFolder[]>(initialFolders);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(
    initialFolders[0]?.cabinSlug ?? null
  );
  const [uploadQueue, setUploadQueue] = useState<UploadJob[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentFolder = useMemo(
    () =>
      folders.find((folder) => folder.cabinSlug === selectedFolder) ?? folders[0] ?? null,
    [folders, selectedFolder]
  );

  const isEditableFolder = (folder: MediaFolder | null) =>
    !!folder && folder.editable !== false && folder.type !== 'static';

  const updateItems = (cabinSlug: string, updater: (items: MediaItem[]) => MediaItem[]) =>
    setFolders((prev) =>
      prev.map((folder) =>
        folder.cabinSlug === cabinSlug ? { ...folder, items: updater(folder.items) } : folder
      )
    );

  const setPrimary = (image: MediaItem) => {
    setMessage(null);
    setError(null);
    if (!isEditableFolder(currentFolder)) return;
    startTransition(async () => {
      const response = await fetch('/api/admin/media/set-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: image.id }),
      });

      if (!response.ok) {
        setError(await parseError(response));
        return;
      }

      updateItems(image.cabinSlug, (items) =>
        items.map((item) => ({ ...item, isPrimary: item.id === image.id }))
      );
      setMessage('Imagen marcada como principal.');
    });
  };

  const updateMeta = (image: MediaItem, payload: { altText?: string; sortOrder?: number }) => {
    setMessage(null);
    setError(null);
    if (!isEditableFolder(currentFolder)) return;
    startTransition(async () => {
      const response = await fetch('/api/admin/media/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: image.id,
          altText: payload.altText ?? image.altText,
          sortOrder: payload.sortOrder ?? image.sortOrder,
        }),
      });

      if (!response.ok) {
        setError(await parseError(response));
        return;
      }

      updateItems(image.cabinSlug, (items) =>
        items.map((item) =>
          item.id === image.id
            ? {
                ...item,
                altText: payload.altText ?? image.altText,
                sortOrder: payload.sortOrder ?? image.sortOrder,
              }
            : item
        )
      );
      setMessage('Metadatos actualizados.');
    });
  };

  const reorder = (orderedIds: string[]) => {
    if (!currentFolder || !isEditableFolder(currentFolder)) return;

    const reordered = orderedIds
      .map((id) => currentFolder.items.find((item) => item.id === id))
      .filter(Boolean) as MediaItem[];

    updateItems(currentFolder.cabinSlug, () =>
      reordered.map((item, index) => ({ ...item, sortOrder: index + 1 }))
    );

    fetch('/api/admin/media/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cabinId: currentFolder.cabinId, orderedIds }),
    }).then(async (response) => {
      if (!response.ok) {
        setError(await parseError(response));
      }
    });
  };

  const remove = (image: MediaItem) => {
    setMessage(null);
    setError(null);
    if (!isEditableFolder(currentFolder)) return;
    startTransition(async () => {
      const response = await fetch('/api/admin/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: image.id }),
      });

      if (!response.ok) {
        setError(await parseError(response));
        return;
      }

      updateItems(image.cabinSlug, (items) => items.filter((item) => item.id !== image.id));
      setMessage('Imagen eliminada.');
    });
  };

  const validateFile = (file: File) => {
    const { maxSizeMb, allowedTypes } = constraints;
    if (file.size > maxSizeMb * 1024 * 1024) {
      return `El archivo ${file.name} supera el limite de ${maxSizeMb}MB.`;
    }
    if (allowedTypes.length && !allowedTypes.includes(file.type)) {
      return `El tipo de archivo ${file.type} no esta permitido.`;
    }
    return null;
  };

  const upload = async (files: File[]) => {
    if (!currentFolder || !isEditableFolder(currentFolder)) return;

    setMessage(null);
    setError(null);

    const validFiles = files.filter((file) => {
      const validation = validateFile(file);
      if (validation) {
        setError(validation);
      }
      return !validation;
    });

    const newJobs: UploadJob[] = validFiles.map((file) => ({
      id: nanoid(),
      cabinId: currentFolder.cabinId,
      cabinSlug: currentFolder.cabinSlug,
      fileName: file.name,
      size: file.size,
      type: file.type,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: 'pending',
    }));

    setUploadQueue((prev) => [...newJobs, ...prev]);

    for (let index = 0; index < newJobs.length; index++) {
      const job = newJobs[index];
      const file = validFiles[index];
      if (!file) continue;

      setUploadQueue((prev) =>
        prev.map((item) => (item.id === job.id ? { ...item, status: 'uploading' } : item))
      );

      const formData = new FormData();
      formData.append('file', file);
      formData.append('cabinId', currentFolder.cabinId);
      formData.append('cabinSlug', currentFolder.cabinSlug);

      try {
        const response = await fetch('/api/admin/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const msg = await parseError(response);
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === job.id ? { ...item, status: 'error', error: msg, progress: 100 } : item
            )
          );
          setError(msg);
          continue;
        }

        const payload = await response.json();
        const image = payload?.image as {
          id: string;
          cabin_id: string;
          image_url: string;
          alt_text: string | null;
          sort_order: number;
          is_primary: boolean;
        };

        const newItem: MediaItem = {
          id: image.id,
          cabinId: image.cabin_id,
          cabinSlug: currentFolder.cabinSlug,
          url: image.image_url,
          altText: image.alt_text,
          sortOrder: image.sort_order,
          isPrimary: image.is_primary,
          status: 'synced',
        };

        updateItems(currentFolder.cabinSlug, (items) => [...items, newItem]);

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === job.id ? { ...item, status: 'done', progress: 100 } : item
          )
        );
      } catch (uploadError) {
        console.error(uploadError);
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === job.id
              ? { ...item, status: 'error', error: 'Error subiendo el archivo', progress: 100 }
              : item
          )
        );
        setError('Error subiendo el archivo.');
      }
    }
  };

  const sync = async () => {
    if (!currentFolder || !isEditableFolder(currentFolder)) return;

    setIsSyncing(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/media/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cabinId: currentFolder.cabinId }),
      });

      if (!response.ok) {
        setError(await parseError(response));
        return;
      }

      const payload = await response.json();
      const items = (payload?.items || []) as any[];

      updateItems(currentFolder.cabinSlug, () =>
        items.map((item) => ({
          id: item.id,
          cabinId: item.cabin_id,
          cabinSlug: currentFolder.cabinSlug,
          url: item.image_url,
          altText: item.alt_text,
          sortOrder: item.sort_order,
          isPrimary: item.is_primary,
          status: 'synced',
        }))
      );

      setMessage('Carpeta sincronizada.');
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    folders,
    currentFolder,
    selectFolder: setSelectedFolder,
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
    clearFeedback: () => {
      setError(null);
      setMessage(null);
    },
    setError,
  };
}
