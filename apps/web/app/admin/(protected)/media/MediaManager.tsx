'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';

type CabinImage = {
  id: string;
  cabin_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number | null;
  is_primary: boolean;
};

type CabinWithImages = {
  id: string;
  title: string;
  images: CabinImage[];
};

type MediaManagerProps = {
  cabins: CabinWithImages[];
};

export default function MediaManager({ cabins: initialCabins }: MediaManagerProps) {
  const [cabins, setCabins] = useState(initialCabins);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateImage = (cabinId: string, imageId: string, patch: Partial<CabinImage>) => {
    setCabins((prev) =>
      prev.map((cabin) =>
        cabin.id === cabinId
          ? {
              ...cabin,
              images: cabin.images.map((img) =>
                img.id === imageId ? { ...img, ...patch } : img
              ),
            }
          : cabin
      )
    );
  };

  const handleSetPrimary = (image: CabinImage) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch('/api/admin/media/set-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: image.id }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.error || 'No se pudo actualizar la imagen.');
        return;
      }
      setMessage('Imagen destacada actualizada.');
      setCabins((prev) =>
        prev.map((cabin) =>
          cabin.id === image.cabin_id
            ? {
                ...cabin,
                images: cabin.images.map((img) => ({
                  ...img,
                  is_primary: img.id === image.id,
                })),
              }
            : cabin
        )
      );
    });
  };

  const handleMetaChange = (
    image: CabinImage,
    field: 'alt_text' | 'sort_order',
    value: string
  ) => {
    if (field === 'sort_order') {
      const numeric = Number(value);
      if (!Number.isNaN(numeric)) {
        updateImage(image.cabin_id, image.id, { sort_order: numeric });
      }
    } else {
      updateImage(image.cabin_id, image.id, { alt_text: value });
    }
  };

  const handleSaveMetadata = (image: CabinImage) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch('/api/admin/media/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: image.id,
          sortOrder: image.sort_order ?? 0,
          altText: image.alt_text ?? '',
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.error || 'No se pudo guardar la información.');
        return;
      }
      setMessage('Metadatos guardados.');
    });
  };

  return (
    <div className="space-y-6">
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

      {cabins.map((cabin) => (
        <section key={cabin.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{cabin.title}</h2>
              <p className="text-sm text-gray-500">
                {cabin.images.length} imagen{cabin.images.length === 1 ? '' : 'es'}
              </p>
            </div>
          </header>

          {cabin.images.length === 0 ? (
            <p className="text-sm text-gray-500">Sin imágenes registradas.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cabin.images.map((image) => (
                <article
                  key={image.id}
                  className="space-y-3 rounded-md border border-gray-100 p-3"
                >
                  <div className="relative h-40 w-full overflow-hidden rounded-md">
                    <Image
                      src={image.image_url}
                      alt={image.alt_text ?? image.id}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        image.is_primary ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {image.is_primary ? 'Destacada' : 'Secundaria'}
                    </span>
                    <button
                      disabled={image.is_primary || isPending}
                      onClick={() => handleSetPrimary(image)}
                      className="text-xs font-medium text-primary-700 disabled:opacity-50"
                    >
                      Marcar como principal
                    </button>
                  </div>
                  <label className="block text-xs font-medium text-gray-600">
                    Orden
                    <input
                      type="number"
                      value={image.sort_order ?? 0}
                      onChange={(event) =>
                        handleMetaChange(image, 'sort_order', event.target.value)
                      }
                      className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="block text-xs font-medium text-gray-600">
                    Alt text
                    <input
                      type="text"
                      value={image.alt_text ?? ''}
                      onChange={(event) =>
                        handleMetaChange(image, 'alt_text', event.target.value)
                      }
                      className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1 text-sm"
                    />
                  </label>
                  <button
                    onClick={() => handleSaveMetadata(image)}
                    disabled={isPending}
                    className="w-full rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Guardar cambios
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

