import { MediaImage } from '../../types/media';

const defaultCabinImage: MediaImage = {
  src: '/images/common/cabin-placeholder.svg',
  alt: 'Cabaña Tres Morros',
};

const cabinGalleryMap = {
  'los-morros': [
    { src: '/images/cabins/los-morros/perfil/perfilLosMorros.png', alt: 'Cabaña Los Morros' },
    { src: '/images/cabins/los-morros/IMG_3908.jpeg', alt: 'Vista de Cabaña Los Morros' },
    { src: '/images/cabins/los-morros/IMG_3957.jpeg', alt: 'Interior de Cabaña Los Morros' },
    { src: '/images/cabins/los-morros/IMG_3964.jpeg', alt: 'Detalle de Cabaña Los Morros' },
    { src: '/images/cabins/los-morros/IMG_8002.jpeg', alt: 'Espacio exterior de Los Morros' },
    { src: '/images/cabins/los-morros/IMG_8005.jpeg', alt: 'Ambiente de Los Morros' },
    { src: '/images/cabins/los-morros/IMG_8014.jpeg', alt: 'Zona de descanso de Los Morros' },
    { src: '/images/cabins/los-morros/IMG_8016.jpeg', alt: 'Vista nocturna de Los Morros' },
    { src: '/images/cabins/los-morros/IMG_8018.jpeg', alt: 'Terraza de Los Morros' },
    { src: '/images/cabins/los-morros/IMG_8024.jpeg', alt: 'Los Morros al atardecer' },
  ],
  'caleta-del-medio': [
    { src: '/images/cabins/caleta-del-medio/perfil/perfilCaletaDelMedio.png', alt: 'Cabaña Caleta del Medio' },
    { src: '/images/cabins/caleta-del-medio/FullSizeRender.jpeg', alt: 'Vista de Cabaña Caleta del Medio' },
    { src: '/images/cabins/caleta-del-medio/FullSizeRender_1.jpeg', alt: 'Interior de Caleta del Medio' },
    { src: '/images/cabins/caleta-del-medio/IMG_3909.jpeg', alt: 'Detalle de Caleta del Medio' },
    { src: '/images/cabins/caleta-del-medio/IMG_3957.jpeg', alt: 'Espacio de Caleta del Medio' },
    { src: '/images/cabins/caleta-del-medio/IMG_3964.jpeg', alt: 'Ambiente de Caleta del Medio' },
    { src: '/images/cabins/caleta-del-medio/IMG_8014.jpeg', alt: 'Zona de descanso de Caleta del Medio' },
    { src: '/images/cabins/caleta-del-medio/IMG_8016.jpeg', alt: 'Vista nocturna de Caleta del Medio' },
    { src: '/images/cabins/caleta-del-medio/IMG_8018.jpeg', alt: 'Terraza de Caleta del Medio' },
    { src: '/images/cabins/caleta-del-medio/IMG_8047.jpeg', alt: 'Caleta del Medio al atardecer' },
  ],
  'vegas-del-coliumo': [
    { src: '/images/cabins/vegas-del-coliumo/IMG_1210.jpeg', alt: 'Cabaña Vegas de Coliumo' },
    { src: '/images/cabins/vegas-del-coliumo/FullSizeRender.jpeg', alt: 'Vista de Cabaña Vegas de Coliumo' },
    { src: '/images/cabins/vegas-del-coliumo/IMG_3911.jpeg', alt: 'Interior de Vegas de Coliumo' },
    { src: '/images/cabins/vegas-del-coliumo/IMG_3957.jpeg', alt: 'Detalle de Vegas de Coliumo' },
    { src: '/images/cabins/vegas-del-coliumo/IMG_3964.jpeg', alt: 'Espacio de Vegas de Coliumo' },
    { src: '/images/cabins/vegas-del-coliumo/IMG_8014.jpeg', alt: 'Zona de descanso de Vegas de Coliumo' },
    { src: '/images/cabins/vegas-del-coliumo/IMG_8016.jpeg', alt: 'Vista nocturna de Vegas de Coliumo' },
    { src: '/images/cabins/vegas-del-coliumo/IMG_8050.jpeg', alt: 'Terraza de Vegas de Coliumo' },
    { src: '/images/cabins/vegas-del-coliumo/IMG_8054.jpeg', alt: 'Vegas de Coliumo al atardecer' },
  ],
} as const;

export const cabinDisplayOrder = ['los-morros', 'caleta-del-medio', 'vegas-del-coliumo'] as const;

type CabinSlug = keyof typeof cabinGalleryMap;

export function getCabinGalleryImages(slug: string | null): MediaImage[] {
  if (!slug) {
    return [defaultCabinImage];
  }

  return [...(cabinGalleryMap[slug as CabinSlug] ?? [defaultCabinImage])];
}

export function getCabinCoverImage(slug: string | null): MediaImage {
  const gallery = getCabinGalleryImages(slug);
  return gallery[0] ?? defaultCabinImage;
}

