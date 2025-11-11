/**
 * Datos de características y beneficios orientados al arriendo
 * Contenido de ejemplo para visualización de diseño
 */
import type { CompanyFeature, Benefit } from '@/types';

export const companyFeatures: CompanyFeature[] = [
  {
    id: 'hospitalidad',
    title: 'HOSPITALIDAD',
    subtitle: 'ANFITRIÓN 24/7',
    description: 'Equipo en Coliumo que coordina check-in asistido, traslados, experiencias y soporte durante toda tu estadía.',
    icon: 'heart',
  },
  {
    id: 'wellness',
    title: 'WELLNESS',
    subtitle: 'PISCINA & SPA',
    description: 'Piscinas temperadas, jacuzzis privados y sauna escandinavo con mantenciones diarias para un descanso perfecto.',
    icon: 'zap',
  },
  {
    id: 'conectividad',
    title: 'CONECTIVIDAD',
    subtitle: 'WORKATION READY',
    description: 'WiFi 500 Mbps, escritorios ergonómicos y streaming premium para combinar teletrabajo con descanso frente al mar.',
    icon: 'dollar-sign',
  },
];

export const benefits: Benefit[] = [
  {
    id: 'atencion',
    title: 'ATENCIÓN AL CLIENTE',
    description: 'Soporte disponible para coordinar tu estadía y resolver consultas durante tu visita.',
    icon: 'home',
    details: 'Servicio de atención básico.',
  },
  {
    id: 'piscina',
    title: 'PISCINA',
    description: 'Acceso a piscina para disfrutar durante los días de verano y clima favorable.',
    icon: 'shield-check',
    details: 'Disponible según temporada.',
  },
  {
    id: 'cocina',
    title: 'COCINA EQUIPADA',
    description: 'Espacios de cocina con implementos básicos para preparar tus propias comidas.',
    icon: 'tag',
    details: 'Equipamiento estándar incluido.',
  },
  {
    id: 'exterior',
    title: 'ESPACIOS EXTERIORES',
    description: 'Áreas al aire libre para disfrutar del entorno natural y compartir con familia o amigos.',
    icon: 'pencil-ruler',
    details: 'Terrazas y jardines disponibles.',
  },
  {
    id: 'estacionamiento',
    title: 'ESTACIONAMIENTO',
    description: 'Espacio designado para estacionar tu vehículo de forma segura durante tu estadía.',
    icon: 'shield-check',
    details: 'Incluido en la reserva.',
  },
  {
    id: 'ubicacion',
    title: 'UBICACIÓN PRIVILEGIADA',
    description: 'Situadas en Coliumo, sector costero de Tomé, con fácil acceso desde la ruta principal.',
    icon: 'calendar-check',
    details: 'A minutos de playas locales.',
  },
];
