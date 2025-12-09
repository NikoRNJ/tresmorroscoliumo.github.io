'use client';

import { AlertCircle, CheckCircle2, Clock3, Loader2 } from 'lucide-react';
import type { UploadJob } from '../types';
import { cn } from '@core/lib/utils/cn';

type UploadQueueProps = {
  jobs: UploadJob[];
};

const StatusIcon = ({ status }: { status: UploadJob['status'] }) => {
  if (status === 'done') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === 'error') return <AlertCircle className="h-4 w-4 text-red-600" />;
  if (status === 'uploading') return <Loader2 className="h-4 w-4 animate-spin text-primary-600" />;
  return <Clock3 className="h-4 w-4 text-gray-500" />;
};

export function UploadQueue({ jobs }: UploadQueueProps) {
  if (!jobs.length) return null;

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">Cola de carga</span>
        <span className="text-xs text-gray-500">{jobs.length} archivos</span>
      </div>
      <div className="space-y-2">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <StatusIcon status={job.status} />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">{job.fileName}</span>
                <span className="text-xs text-gray-500">
                  {(job.size / (1024 * 1024)).toFixed(2)} MB - {job.type}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-24 rounded-full bg-gray-200">
                <div
                  className={cn(
                    'h-2 rounded-full',
                    job.status === 'error'
                      ? 'bg-red-500'
                      : job.status === 'done'
                        ? 'bg-green-500'
                        : 'bg-primary-500'
                  )}
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-600">{job.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
