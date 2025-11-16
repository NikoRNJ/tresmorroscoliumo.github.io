export interface MediaImage {
  src: string;
  alt: string;
}

export interface GalleryCollection {
  id: string;
  label: string;
  images: MediaImage[];
}

export const heroImages: MediaImage[] = [
  { src: '/images/hero/hero-1.jpg', alt: 'Amanecer en las playas de Coliumo' },
  { src: '/images/hero/hero-2.jpg', alt: 'Senderos y vegetación en Coliumo' },
  { src: '/images/hero/hero-3.jpg', alt: 'Atardecer sobre el océano' },
];

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

export const galleryCollections: GalleryCollection[] = [
  {
    id: 'exteriores',
    label: 'EXTERIORES',
    images: [
      { src: '/images/galeria/exterior/1.jpg', alt: 'Pasarela entre bosques y mar' },
      { src: '/images/galeria/exterior/2.jpg', alt: 'Fachada iluminada al atardecer' },
      { src: '/images/galeria/exterior/3.jpg', alt: 'Area común exterior con iluminación cálida' },
      { src: '/images/galeria/exterior/4.jpg', alt: 'Vista aérea de las cabañas y el mar' },
    ],
  },
  {
    id: 'interiores',
    label: 'INTERIORES',
    images: [
      { src: '/images/galeria/interior/1.jpg', alt: 'Sala de estar con luz natural' },
      { src: '/images/galeria/interior/2.jpg', alt: 'Comedor familiar acogedor' },
      { src: '/images/galeria/interior/3.jpg', alt: 'Dormitorio principal con detalles en madera' },
      { src: '/images/galeria/interior/4.jpg', alt: 'Ambiente interior iluminado con calidez' },
    ],
  },
  {
    id: 'puntos-turisticos',
    label: 'PUNTOS TURÍSTICOS',
    images: [
      { src: '/images/galeria/puntos-turisticos/1.jpg', alt: 'Mirador natural de Coliumo' },
      { src: '/images/galeria/puntos-turisticos/2.jpg', alt: 'Senderos costeros para caminar' },
      { src: '/images/galeria/puntos-turisticos/3.jpg', alt: 'Vista panorámica del océano Pacífico' },
      { src: '/images/galeria/puntos-turisticos/4.jpg', alt: 'Atardecer desde los miradores' },
    ],
  },
  {
    id: 'playas',
    label: 'PLAYAS',
    images: [
      { src: '/images/galeria/playas/1.jpg', alt: 'Playa amplia con arena dorada' },
      { src: '/images/galeria/playas/2.jpg', alt: 'Acantilados y mar turquesa' },
      { src: '/images/galeria/playas/3.jpg', alt: 'Olas rompiendo al atardecer' },
      { src: '/images/galeria/playas/4.jpg', alt: 'Sendero costero junto a la playa' },
    ],
  },
];

