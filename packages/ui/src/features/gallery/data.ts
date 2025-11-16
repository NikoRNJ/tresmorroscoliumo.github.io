import { GalleryCollection } from '../../types/media';

export const galleryCollections: GalleryCollection[] = [
  {
    id: 'exteriores',
    label: 'EXTERIORES',
    images: [
      { src: '/images/galeria/exterior/1.jpg', alt: 'Pasarela entre bosques y mar' },
      { src: '/images/galeria/exterior/2.jpg', alt: 'Fachada iluminada al atardecer' },
      { src: '/images/galeria/exterior/3.jpg', alt: 'Área común exterior con iluminación cálida' },
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

