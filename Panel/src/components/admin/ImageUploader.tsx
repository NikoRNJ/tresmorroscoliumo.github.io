'use client';

import { useState, useCallback, useRef } from 'react';
import type { Cabin } from '@/lib/types';

interface ImageUploaderProps {
  cabin: Cabin | null;
  onUpload: (file: File, cabinId: string, alt?: string, opts?: { isPrimary?: boolean }) => Promise<void>;
  disabled?: boolean;
}

export default function ImageUploader({ cabin, onUpload, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);
  const [markPrimary, setMarkPrimary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = async (files: FileList | File[]) => {
    if (!cabin) {
      setError('Selecciona una cabana primero');
      return;
    }

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setError('Solo se permiten archivos de imagen');
      return;
    }

    setUploading(true);
    setError(null);

    for (const file of imageFiles) {
      try {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        // Simular progreso (en produccion usarias XHR o fetch con reportProgress)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: Math.min((prev[file.name] || 0) + 10, 90),
          }));
        }, 100);

        await onUpload(file, cabin.id, undefined, { isPrimary: markPrimary });

        clearInterval(progressInterval);
        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));

        // Limpiar progreso despues de un momento
        setTimeout(() => {
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }, 1000);
      } catch (err) {
        setError(`Error subiendo ${file.name}: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    }

    setUploading(false);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [cabin, onUpload]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = ''; // Reset para permitir subir el mismo archivo
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
          ${!cabin ? 'opacity-50' : ''}
        `}
      >
        <div className="space-y-2">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          {!cabin ? (
            <p className="text-gray-500">Selecciona una cabana primero</p>
          ) : uploading ? (
            <p className="text-blue-600">Subiendo imagenes...</p>
          ) : (
            <>
              <p className="text-gray-600 font-medium">Arrastra imagenes aqui o haz clic para seleccionar</p>
              <p className="text-gray-400 text-sm">PNG, JPG, WEBP, AVIF hasta 10MB</p>
              {cabin && (
                <p className="text-blue-600 text-sm">
                  Cabana: {cabin.title}
                  {markPrimary && ' (principal)'}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="w-4 h-4"
          checked={markPrimary}
          onChange={(e) => setMarkPrimary(e.target.checked)}
          disabled={!cabin}
        />
        Marcar como imagen principal de esta cabana
      </label>

      {/* Progress bars */}
      {Object.entries(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 truncate">{fileName}</span>
                <span className="text-gray-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 text-xs hover:underline mt-1">
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
