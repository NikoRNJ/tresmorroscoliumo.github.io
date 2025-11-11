/**
 * Datos de galería de imágenes
 */
import type { GalleryImage } from '@/types';

export const galleryImages: GalleryImage[] = [
  {
    id: 'ext-1',
    src: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1920&q=80',
    alt: 'Vista exterior nocturna de cabaña modular en el bosque',
    category: 'exterior',
    width: 1920,
    height: 1280,
  },
  {
    id: 'ext-2',
    src: 'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=1920&q=80',
    alt: 'Fachada principal con terraza perimetral y fogón central',
    category: 'exterior',
    width: 1920,
    height: 1280,
  },
  {
    id: 'ext-3',
    src: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=1920&q=80',
    alt: 'Cabaña tipo A-Frame iluminada al atardecer',
    category: 'exterior',
    width: 1920,
    height: 1280,
  },
  {
    id: 'ext-4',
    src: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1920&q=80',
    alt: 'Modelo modular con deck elevado y celosías de madera',
    category: 'exterior',
    width: 1920,
    height: 1280,
  },
  {
    id: 'int-1',
    src: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=1920&q=80',
    alt: 'Sala de estar con doble altura y ventanales panorámicos',
    category: 'interior',
    width: 1920,
    height: 1280,
  },
  {
    id: 'int-2',
    src: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=1920&q=80',
    alt: 'Cocina minimalista con isla central y acabados en madera',
    category: 'interior',
    width: 1920,
    height: 1280,
  },
  {
    id: 'int-3',
    src: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1920&q=80',
    alt: 'Dormitorio principal con textiles cálidos y vista al bosque',
    category: 'interior',
    width: 1920,
    height: 1280,
  },
  {
    id: 'int-4',
    src: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=80',
    alt: 'Baño completo con revestimientos pétreos y luz natural',
    category: 'interior',
    width: 1920,
    height: 1280,
  },
  {
    id: 'ame-1',
    src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&q=80',
    alt: 'Terraza exterior con mobiliario y pérgola de madera',
    category: 'amenities',
    width: 1920,
    height: 1280,
  },
  {
    id: 'ame-2',
    src: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1920&q=80',
    alt: 'Zona de fogata con horizonte montañoso',
    category: 'amenities',
    width: 1920,
    height: 1280,
  },
  {
    id: 'lan-1',
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80',
    alt: 'Entorno natural con laguna frente a las cabañas',
    category: 'landscape',
    width: 1920,
    height: 1280,
  },
  {
    id: 'lan-2',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    alt: 'Vista panorámica de complejo modular en la montaña',
    category: 'landscape',
    width: 1920,
    height: 1280,
  },
];

export const getImagesByCategory = (category: GalleryImage['category']): GalleryImage[] => {
  return galleryImages.filter((img) => img.category === category);
};
