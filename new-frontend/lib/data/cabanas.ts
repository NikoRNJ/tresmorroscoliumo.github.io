/**
 * Datos de cabañas disponibles para arriendo
 * Contenido de ejemplo para visualización de diseño
 */
import type { CabanaModel } from '@/types';

export const cabanaModels: CabanaModel[] = [
  {
    id: 'modelo-uno',
    name: 'Modelo Uno',
    slug: 'modelo-uno',
    description:
      'Cabaña de ejemplo con espacio amplio y confortable. Diseño pensado para familias que buscan descanso cerca de la naturaleza.',
    dimensions: {
      area: 0,
      bedrooms: 0,
      bathrooms: 0,
      floors: 0,
    },
    features: [
      'Piscina',
      'Cocina equipada',
      'Vista panorámica',
      'Zona de fogata',
      'Estacionamiento',
    ],
    price: {
      amount: 0,
      currency: 'CLP',
      period: 'noche',
    },
    images: {
      main: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&q=80',
        'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=1600&q=80',
      ],
      thumbnail: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&q=80',
    },
    specifications: [
      { label: 'Características', value: 'Piscina' },
      { label: 'Espacios', value: 'Cocina equipada' },
      { label: 'Vistas', value: 'Vista al mar' },
      { label: 'Servicios', value: 'Estacionamiento' },
      { label: 'Ubicación', value: 'Coliumo, Tomé' },
    ],
    available: true,
  },
  {
    id: 'modelo-dos',
    name: 'Modelo Dos',
    slug: 'modelo-dos',
    description:
      'Cabaña de ejemplo ideal para parejas o grupos pequeños. Ambiente acogedor con todas las comodidades básicas.',
    dimensions: {
      area: 0,
      bedrooms: 0,
      bathrooms: 0,
      floors: 0,
    },
    features: [
      'Jacuzzi',
      'Cocina equipada',
      'Vista al bosque',
      'Terraza privada',
      'WiFi',
    ],
    price: {
      amount: 0,
      currency: 'CLP',
      period: 'noche',
    },
    images: {
      main: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=1600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=1600&q=80',
        'https://images.unsplash.com/photo-1464146072230-91cabc968266?w=1600&q=80',
        'https://images.unsplash.com/photo-1501127122-f385ca6ddd3c?w=1600&q=80',
      ],
      thumbnail: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=600&q=80',
    },
    specifications: [
      { label: 'Características', value: 'Jacuzzi' },
      { label: 'Espacios', value: 'Terraza privada' },
      { label: 'Vistas', value: 'Vista al bosque' },
      { label: 'Servicios', value: 'WiFi incluido' },
      { label: 'Ubicación', value: 'Coliumo, Tomé' },
    ],
    available: true,
  },
  {
    id: 'modelo-tres',
    name: 'Modelo Tres',
    slug: 'modelo-tres',
    description:
      'Cabaña de ejemplo rodeada de naturaleza. Perfecta para quienes buscan tranquilidad y conexión con el entorno.',
    dimensions: {
      area: 0,
      bedrooms: 0,
      bathrooms: 0,
      floors: 0,
    },
    features: [
      'Chimenea',
      'Cocina equipada',
      'Vista panorámica',
      'Zona exterior',
      'Estacionamiento',
    ],
    price: {
      amount: 0,
      currency: 'CLP',
      period: 'noche',
    },
    images: {
      main: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=1600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=1600&q=80',
        'https://images.unsplash.com/photo-1505692989983-2e8d8fc7b3c1?w=1600&q=80',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&q=80',
      ],
      thumbnail: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&q=80',
    },
    specifications: [
      { label: 'Características', value: 'Chimenea' },
      { label: 'Espacios', value: 'Zona exterior' },
      { label: 'Vistas', value: 'Vista panorámica' },
      { label: 'Servicios', value: 'Estacionamiento' },
      { label: 'Ubicación', value: 'Coliumo, Tomé' },
    ],
    available: true,
  },
];

export const getCabanaById = (id: string): CabanaModel | undefined => {
  return cabanaModels.find((model) => model.id === id);
};

export const getCabanaBySlug = (slug: string): CabanaModel | undefined => {
  return cabanaModels.find((model) => model.slug === slug);
};
