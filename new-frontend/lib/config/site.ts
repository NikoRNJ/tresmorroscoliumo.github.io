/**
 * Configuración global del sitio
 * Centraliza metadata, SEO y configuraciones generales
 */
import type { SiteConfig } from '@/types';

export const siteConfig: SiteConfig = {
  name: 'Cabañas Coliumo - Tomé',
  description:
    'Sitio de ejemplo para visualización de diseño. Cabañas ubicadas en Coliumo, sector costero de la comuna de Tomé. Tres modelos disponibles para conocer el formato del sitio.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://ejemplo-cabanas.cl',
  ogImage: '/images/og-image.jpg',
  keywords: [
    'cabañas tomé',
    'cabañas coliumo',
    'arriendo cabañas',
    'turismo tomé',
    'coliumo',
    'cabañas costa',
    'ejemplo sitio web',
    'demo cabañas',
  ],
  author: {
    name: 'Cabañas Coliumo',
    email: 'contacto@ejemplo.cl',
  },
  social: [
    {
      id: 'facebook',
      platform: 'facebook',
      url: 'https://facebook.com/ejemplo',
      label: 'Síguenos en Facebook',
      icon: 'facebook',
    },
    {
      id: 'instagram',
      platform: 'instagram',
      url: 'https://instagram.com/ejemplo',
      label: 'Síguenos en Instagram',
      icon: 'instagram',
    },
    {
      id: 'whatsapp',
      platform: 'whatsapp',
      url: 'https://wa.me/56900000000',
      label: 'Escríbenos por WhatsApp',
      icon: 'message-circle',
    },
    {
      id: 'email',
      platform: 'email',
      url: 'mailto:contacto@ejemplo.cl',
      label: 'Envíanos un email',
      icon: 'mail',
    },
  ],
};

export const navItems = [
  { id: 'inicio', label: 'Inicio', href: '#hero' },
  { id: 'nosotros', label: 'Nosotros', href: '#about' },
  { id: 'modelos', label: 'Modelos', href: '#models' },
  { id: 'galeria', label: 'Galería', href: '#gallery' },
  { id: 'ubicacion', label: 'Ubicación', href: '#location' },
  { id: 'contacto', label: 'Contacto', href: '#contact' },
];

export const emailConfig = {
  from: process.env.EMAIL_FROM || 'noreply@ejemplo.cl',
  to: process.env.EMAIL_TO || 'contacto@ejemplo.cl',
  subject: 'Nueva consulta - Cabañas Coliumo',
};

export const rateLimitConfig = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000,
};
