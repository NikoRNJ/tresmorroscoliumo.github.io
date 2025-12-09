export type MediaItemStatus = 'synced' | 'uploading' | 'processing' | 'error' | 'orphaned';

export type MediaItem = {
  id: string;
  cabinId: string;
  cabinSlug: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  filename?: string;
  status?: MediaItemStatus;
};

export type MediaFolder = {
  cabinId: string;
  cabinSlug: string;
  cabinTitle: string;
  items: MediaItem[];
  type?: 'cabin' | 'static';
  editable?: boolean;
};

export type UploadJob = {
  id: string;
  cabinId: string;
  cabinSlug: string;
  fileName: string;
  size: number;
  type: string;
  previewUrl?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
  error?: string;
};

export type SyncReport = {
  created: number;
  updated: number;
  missingInDb: string[];
  missingInStorage: string[];
};

export type UploadConstraints = {
  maxSizeMb: number;
  allowedTypes: string[];
};
