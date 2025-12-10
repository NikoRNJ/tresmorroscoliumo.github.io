'use client';

import { useState } from 'react';
import CabinSelector from '@/components/admin/CabinSelector';
import ImageUploader from '@/components/admin/ImageUploader';
import ImageManager from '@/components/admin/ImageManager';
import { useImages } from '@/hooks/useImages';
import type { Cabin } from '@/lib/types';

export default function ImagenesPage() {
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(null);
  const { uploadImage } = useImages({ autoFetch: false });

  const handleUpload = async (file: File, cabinId: string, alt?: string) => {
    await uploadImage(file, undefined, alt, { cabinId });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Imagenes</h1>
          <p className="text-gray-600 mt-1">Gestiona las imagenes de tu sitio web por cabaña</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Cabins */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <CabinSelector selectedCabinId={selectedCabin?.id || null} onSelect={setSelectedCabin} />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Uploader */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Subir Imagenes</h2>
              <ImageUploader cabin={selectedCabin} onUpload={handleUpload} />
            </div>

            {/* Image Manager */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedCabin ? `Imagenes de "${selectedCabin.title}"` : 'Todas las Imagenes'}
                </h2>
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Actualizacion en tiempo real
                </span>
              </div>
              <ImageManager cabin={selectedCabin} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
