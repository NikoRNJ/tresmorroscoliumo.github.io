export interface MediaImage {
  src: string;
  alt: string;
}

export interface GalleryCollection {
  id: string;
  label: string;
  images: MediaImage[];
}

