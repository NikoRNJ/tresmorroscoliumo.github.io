'use client';

import { useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import type { GaleriaConstraints } from '../types';
import { UploadCloud, Image, FileImage } from 'lucide-react';

type GaleriaDropzoneProps = {
    constraints: GaleriaConstraints;
    disabled?: boolean;
    onFiles: (files: File[]) => void;
    onError: (message: string) => void;
};

export function GaleriaDropzone({ constraints, disabled, onFiles, onError }: GaleriaDropzoneProps) {
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
        onDropRejected: (rejected) => {
            const first = rejected[0]?.errors[0];
            if (first?.code === 'file-too-large') {
                onError(`El archivo supera el límite de ${constraints.maxSizeMb}MB`);
            } else if (first?.code === 'file-invalid-type') {
                onError('Tipo de archivo no permitido');
            } else {
                onError('No se pudo aceptar el archivo');
            }
        },
    });

    // Format allowed types for display
    const allowedTypesDisplay = constraints.allowedTypes
        .map(t => t.replace('image/', '').toUpperCase())
        .join(', ');

    return (
        <div
            {...getRootProps()}
            className={`
                group relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200
                ${disabled
                    ? 'cursor-not-allowed bg-gray-50 border-gray-200 opacity-60'
                    : ''
                }
                ${isDragActive
                    ? 'border-primary-400 bg-gradient-to-br from-primary-50 to-primary-100 scale-[1.02] shadow-lg'
                    : 'border-gray-300 hover:border-primary-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-primary-50/30'
                }
            `}
        >
            <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                    {/* Icon container with animation */}
                    <div className={`
                        relative flex h-14 w-14 items-center justify-center rounded-xl shadow-inner transition-all duration-200
                        ${isDragActive
                            ? 'bg-primary-200 scale-110'
                            : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-primary-100 group-hover:to-primary-200'
                        }
                    `}>
                        <UploadCloud
                            className={`
                                h-7 w-7 transition-all duration-200
                                ${isDragActive
                                    ? 'text-primary-600 animate-bounce'
                                    : 'text-gray-500 group-hover:text-primary-600'
                                }
                            `}
                        />
                        {/* Decorative floating icons */}
                        <FileImage className={`
                            absolute -right-1 -top-1 h-4 w-4 text-primary-400 transition-opacity
                            ${isDragActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}
                        `} />
                        <Image className={`
                            absolute -bottom-1 -left-1 h-3 w-3 text-primary-300 transition-opacity
                            ${isDragActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}
                        `} />
                    </div>

                    <div className="flex flex-col">
                        <span className={`
                            text-sm font-semibold transition-colors
                            ${isDragActive ? 'text-primary-700' : 'text-gray-800'}
                        `}>
                            {isDragActive
                                ? '¡Suelta las imágenes aquí!'
                                : 'Arrastra imágenes o haz click para seleccionar'
                            }
                        </span>
                        <span className="mt-0.5 text-xs text-gray-500">
                            Formatos: {allowedTypesDisplay || 'Cualquier imagen'} • Máximo {constraints.maxSizeMb}MB por archivo
                        </span>
                    </div>
                </div>

                <input {...getInputProps()} />

                <div className={`
                    flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all
                    ${isDragActive
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-700'
                    }
                `}>
                    <UploadCloud className="h-4 w-4" />
                    {isDragActive ? 'Soltar' : 'Subir'}
                </div>
            </div>

            {/* Progress indicator line when active */}
            {isDragActive && (
                <div className="absolute bottom-0 left-0 h-1 w-full overflow-hidden rounded-b-xl">
                    <div className="h-full w-full bg-gradient-to-r from-primary-400 via-primary-500 to-primary-400 animate-pulse" />
                </div>
            )}
        </div>
    );
}

