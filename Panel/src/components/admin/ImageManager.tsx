'use client';

import { useState } from 'react';
import { useRealtimeImages } from '@/hooks/useRealtimeImages';
import { useImages } from '@/hooks/useImages';
import type { Image, Cabin } from '@/lib/types';

interface ImageManagerProps {
  cabin: Cabin | null;
}

export default function ImageManager({ cabin }: ImageManagerProps) {
  const { images, loading, error } = useRealtimeImages({
    cabinId: cabin?.id,
  });

  const { deleteImage, updateImage } = useImages({ autoFetch: false });

  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [editingImage, setEditingImage] = useState<Image | null>(null);
  const [editAlt, setEditAlt] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleSelectImage = (id: string) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map((img) => img.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.size === 0) return;
    if (!confirm(`Eliminar ${selectedImages.size} imagen(es)?`)) return;
    setDeleting(true);
    try {
      for (const id of selectedImages) {
        await deleteImage(id);
      }
      setSelectedImages(new Set());
    } catch (err) {
      console.error('Error deleting images:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    if (!confirm('Eliminar esta imagen?')) return;
    try {
      await deleteImage(id);
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  };

  const handleEditImage = (image: Image) => {
    setEditingImage(image);
    setEditAlt(image.alt || '');
  };

  const handleSaveEdit = async () => {
    if (!editingImage) return;
    try {
      await updateImage(editingImage.id, { alt: editAlt });
      setEditingImage(null);
    } catch (err) {
      console.error('Error updating image:', err);
    }
  };

  const markAsPrimary = async (image: Image) => {
    try {
      await updateImage(image.id, { is_primary: true });
    } catch (err) {
      console.error('Error setting primary image:', err);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-50 rounded-lg">
        Error cargando imagenes: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedImages.size === images.length && images.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-600">
              {selectedImages.size > 0 ? `${selectedImages.size} seleccionada(s)` : 'Seleccionar todas'}
            </span>
          </label>
        </div>

        {selectedImages.size > 0 && (
          <button
            onClick={handleDeleteSelected}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        )}
      </div>

      {/* Image Grid */}
      {images.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 text-gray-300 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500">
            {cabin ? 'No hay imagenes en esta cabana' : 'Selecciona una cabana para ver sus imagenes'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                selectedImages.has(image.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img src={image.url} alt={image.alt || image.name} className="w-full h-full object-cover" />

              {/* Badge primary */}
              {image.is_primary && (
                <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full shadow">
                  Principal
                </span>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all">
                {/* Checkbox */}
                <div className="absolute top-2 right-2">
                  <input
                    type="checkbox"
                    checked={selectedImages.has(image.id)}
                    onChange={() => handleSelectImage(image.id)}
                    className="w-5 h-5 rounded opacity-0 group-hover:opacity-100 checked:opacity-100 transition-opacity cursor-pointer"
                  />
                </div>

                {/* Actions */}
                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => copyUrl(image.url)} className="p-2 bg-white rounded-lg hover:bg-gray-100" title="Copiar URL">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                  <button onClick={() => handleEditImage(image)} className="p-2 bg-white rounded-lg hover:bg-gray-100" title="Editar">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteSingle(image.id)}
                    className="p-2 bg-white rounded-lg hover:bg-red-100 text-red-600"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Primary toggle */}
                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!image.is_primary && (
                    <button
                      onClick={() => markAsPrimary(image)}
                      className="px-2 py-1 bg-white text-xs rounded hover:bg-gray-100"
                    >
                      Marcar principal
                    </button>
                  )}
                </div>

                {/* Name badge */}
                <div className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs truncate block bg-black bg-opacity-50 px-2 py-1 rounded">{image.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Editar imagen</h3>

            <div className="aspect-video mb-4 rounded-lg overflow-hidden bg-gray-100">
              <img src={editingImage.url} alt={editingImage.alt || editingImage.name} className="w-full h-full object-contain" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texto alternativo (alt)</label>
                <input
                  type="text"
                  value={editAlt}
                  onChange={(e) => setEditAlt(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripcion de la imagen"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={() => setEditingImage(null)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={handleSaveEdit} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
