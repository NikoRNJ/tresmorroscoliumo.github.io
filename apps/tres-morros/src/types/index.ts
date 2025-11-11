/**
 * Sistema de tipos TypeScript para la aplicación de Cabañas
 * Definiciones centralizadas para mantener type-safety en toda la app
 */

// Tipos para modelos de cabañas
export interface CabanaModel {
  id: string;
  name: string;
  slug: string;
  description: string;
  dimensions: {
    area: number; // m²
    bedrooms: number;
    bathrooms: number;
    floors: number;
  };
  features: string[];
  price: {
    amount: number;
    currency: string;
    period?: string;
  };
  images: {
    main: string;
    gallery: string[];
    thumbnail: string;
  };
  specifications: {
    label: string;
    value: string;
  }[];
  available: boolean;
}

// Tipos para características de la empresa
export interface CompanyFeature {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}

// Tipos para ventajas/beneficios
export interface Benefit {
  id: string;
  title: string;
  description: string;
  icon: string;
  details?: string;
}

// Tipos para formulario de contacto
export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  preferredModel?: string;
  privacyAccepted: boolean;
}

// Tipos para validación del formulario con Zod
export interface ContactFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  privacyAccepted?: string;
}

// Tipos para respuesta de API
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
}

// Tipos para galería de imágenes
export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category: 'exterior' | 'interior' | 'amenities' | 'landscape';
  width: number;
  height: number;
  thumbnail?: string;
}

// Tipos para ubicación
export interface Location {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description?: string;
}

// Tipos para redes sociales
export interface SocialLink {
  id: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'youtube' | 'whatsapp' | 'email';
  url: string;
  label: string;
  icon: string;
}

// Tipos para configuración del sitio
export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  keywords: string[];
  author: {
    name: string;
    email: string;
  };
  social: SocialLink[];
}

// Tipos para animaciones
export interface AnimationVariant {
  hidden: {
    opacity: number;
    y?: number;
    x?: number;
    scale?: number;
  };
  visible: {
    opacity: number;
    y?: number;
    x?: number;
    scale?: number;
    transition?: {
      duration: number;
      delay?: number;
      ease?: string | number[];
    };
  };
}

// Tipos para testimonios (opcional para futuras expansiones)
export interface Testimonial {
  id: string;
  author: string;
  role?: string;
  content: string;
  rating: number;
  date: string;
  avatar?: string;
}

// Tipos para navegación
export interface NavItem {
  id: string;
  label: string;
  href: string;
  external?: boolean;
}

// Tipos para secciones de la página
export type SectionId = 
  | 'hero'
  | 'about'
  | 'benefits'
  | 'models'
  | 'gallery'
  | 'location'
  | 'contact'
  | 'footer';

// Tipo utilitario para props de sección
export interface SectionProps {
  id?: SectionId;
  className?: string;
  children?: React.ReactNode;
}

// Export de tipos de estado
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = unknown> {
  status: LoadingState;
  data?: T;
  error?: Error | null;
}
