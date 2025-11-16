import { MediaImage } from '../../types/media';

const defaultCabinImage: MediaImage = {
  src: '/images/common/cabin-placeholder.svg',
  alt: 'Cabaña Tres Morros',
};

const cabinGalleryMap = {
  'los-morros': [
    { src: '/images/cabins/los-morros/1.jpg', alt: 'Fachada principal de Los Morros' },
    { src: '/images/cabins/los-morros/2.jpg', alt: 'Vista lateral de Los Morros' },
    { src: '/images/cabins/los-morros/3.jpg', alt: 'Detalle arquitectónico de Los Morros' },
    { src: '/images/cabins/los-morros/4.jpg', alt: 'Los Morros al atardecer' },
  ],
  'caleta-del-medio': [
    { src: '/images/cabins/caleta-del-medio/1.jpg', alt: 'Vista panorámica de Caleta del Medio' },
    { src: '/images/cabins/caleta-del-medio/2.jpg', alt: 'Interior iluminado de Caleta del Medio' },
    { src: '/images/cabins/caleta-del-medio/3.jpg', alt: 'Cocina equipada de Caleta del Medio' },
    { src: '/images/cabins/caleta-del-medio/4.jpg', alt: 'Terraza de Caleta del Medio' },
  ],
  'vegas-del-coliumo': [
    { src: '/images/cabins/vegas-del-coliumo/1.jpg', alt: 'Entrada a Vegas del Coliumo' },
    { src: '/images/cabins/vegas-del-coliumo/2.jpg', alt: 'Zona de estar de Vegas del Coliumo' },
    { src: '/images/cabins/vegas-del-coliumo/3.jpg', alt: 'Ambiente nocturno en Vegas del Coliumo' },
    { src: '/images/cabins/vegas-del-coliumo/4.jpg', alt: 'Terraza con vista al mar en Vegas del Coliumo' },
  ],
} as const;

export const cabinDisplayOrder = ['los-morros', 'caleta-del-medio', 'vegas-del-coliumo'] as const;

type CabinSlug = keyof typeof cabinGalleryMap;

export function getCabinGalleryImages(slug: string | null): MediaImage[] {
  if (!slug) {
    return [defaultCabinImage];
  }

  return cabinGalleryMap[slug as CabinSlug] ?? [defaultCabinImage];
}

export function getCabinCoverImage(slug: string | null): MediaImage {
  const gallery = getCabinGalleryImages(slug);
  return gallery[0] ?? defaultCabinImage;
}

