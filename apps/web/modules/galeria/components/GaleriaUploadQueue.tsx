'use client';

import type { GaleriaUploadJob } from '../types';
import { CheckCircle, Loader2, XCircle, Upload } from 'lucide-react';

type GaleriaUploadQueueProps = {
    jobs: GaleriaUploadJob[];
};

export function GaleriaUploadQueue({ jobs }: GaleriaUploadQueueProps) {
    const activeJobs = jobs.filter((job) => job.status !== 'done' || Date.now() - 5000 < 0);

    if (activeJobs.length === 0) return null;

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Subiendo imágenes</h3>
            <div className="space-y-2">
                {jobs.slice(0, 5).map((job) => (
                    <div
                        key={job.id}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
                    >
                        {job.previewUrl ? (
                            <img
                                src={job.previewUrl}
                                alt={job.fileName}
                                className="h-10 w-10 rounded object-cover"
                            />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                                <Upload className="h-4 w-4 text-gray-400" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{job.fileName}</p>
                            <p className="text-xs text-gray-500">{job.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {job.status === 'uploading' && (
                                <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                            )}
                            {job.status === 'done' && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {job.status === 'error' && (
                                <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            {job.status === 'pending' && (
                                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
