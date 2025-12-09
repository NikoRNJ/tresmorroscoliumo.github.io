'use client';

import { useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import type { UploadConstraints } from '../types';
import { cn } from '@core/lib/utils/cn';

type UploadDropzoneProps = {
  constraints: UploadConstraints;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  onError?: (message: string) => void;
};

export function UploadDropzone({ constraints, disabled, onFiles, onError }: UploadDropzoneProps) {
  const accept = useMemo(() => {
    if (!constraints.allowedTypes.length) return undefined;
    return constraints.allowedTypes.reduce(
      (acc, type) => ({ ...acc, [type]: [] as string[] }),
      {} as Record<string, string[]>
    );
  }, [constraints.allowedTypes]);

  const maxSize = constraints.maxSizeMb * 1024 * 1024;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxSize,
    disabled,
    onDropAccepted: (accepted) => onFiles(accepted),
    onDropRejected: (rejections) => {
      if (!onError) return;
      const first = rejections[0];
      if (!first) return;
      if (first.errors[0]?.code === 'file-too-large') {
        onError(`Archivo supera el limite de ${constraints.maxSizeMb}MB.`);
        return;
      }
      onError('Tipo de archivo no permitido.');
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex cursor-pointer items-center justify-between rounded-lg border-2 border-dashed px-4 py-3 transition-colors',
        isDragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-200 bg-white',
        disabled && 'pointer-events-none opacity-60'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary-50 p-2 text-primary-700">
          <UploadCloud className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">Arrastra imagenes o haz click</span>
          <span className="text-xs text-gray-500">
            Max. {constraints.maxSizeMb}MB -{' '}
            {constraints.allowedTypes.length ? constraints.allowedTypes.join(', ') : 'cualquier'}
          </span>
        </div>
      </div>
      <input {...getInputProps()} />
      <div className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">Drag & Drop</div>
    </div>
  );
}
