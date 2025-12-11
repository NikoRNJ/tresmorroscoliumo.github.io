'use client';

import Link from 'next/link';
import { formatPrice } from '@core/lib/utils/format';
import { Cabin } from '@core/types/database';
import { Card, CardContent, CardDescription, CardImage, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { getCabinCoverImage } from './media';

interface CabinCardProps {
  cabin: Cabin;
}

/** Formatear nombre de cabaña para UI */
function formatCabinTitle(title: string, slug: string): string {
  if (slug === 'los-morros') {
    return 'Cabaña Los Morros';
  }
  if (slug === 'vegas-del-coliumo') {
    return 'Cabaña Vegas de Coliumo';
  }
  if (slug === 'caleta-del-medio') {
    return 'Cabaña Caleta del Medio';
  }
  return title;
}

/** Override de descripción para UI */
function getCabinDescription(description: string | null, slug: string): string {
  if (slug === 'los-morros') {
    return 'Nuestra cabaña honra el encanto de los Morros. Es un espacio amplio y luminoso, con tinaja opcional y rodeado de naturaleza. El lugar perfecto para desconectarte de la rutina y conectar con lo esencial.';
  }
  if (slug === 'caleta-del-medio') {
    return 'Acogedora cabaña inspirada en la caleta de pescadores artesanales. Un espacio ideal para descansar, relajarte y conectar con la naturaleza en un ambiente tranquilo y auténtico.';
  }
  if (slug === 'vegas-del-coliumo') {
    return 'Cabaña rodeada de la vega natural de Coliumo. Un refugio tranquilo donde podrás disfrutar de la brisa marina y el sonido de las aves en un entorno único y acogedor.';
  }
  return description || 'Cabaña acogedora en Coliumo';
}

/** Override de amenidades para UI */
function getCabinAmenities(amenities: string[], slug: string): string[] {
  if (slug === 'los-morros') {
    return [
      'Tinaja con hidromasaje (opcional)',
      'Amplio living',
      'Cocina full equipada',
      'Parrilla',
      'Estacionamiento privado',
      'Terraza privada',
      'Juegos de mesa',
    ];
  }
  if (slug === 'caleta-del-medio') {
    return [
      'Tinaja con hidromasaje (opcional)',
      'Cocina full equipada',
      'Parrilla',
      'Estacionamiento privado',
      'Terraza privada',
      'Juegos de mesa',
      'TV',
    ];
  }
  if (slug === 'vegas-del-coliumo') {
    return [
      'Tinaja con hidromasaje (opcional)',
      'Cocina full equipada',
      'Parrilla',
      'Estacionamiento privado',
      'Terraza privada',
      'Juegos de mesa',
    ];
  }
  return amenities;
}

export function CabinCard({ cabin }: CabinCardProps) {
  const coverImage = getCabinCoverImage(cabin.slug);
  const rawAmenities = Array.isArray(cabin.amenities) ? cabin.amenities : [];
  const amenities = getCabinAmenities(rawAmenities as string[], cabin.slug);
  const displayTitle = formatCabinTitle(cabin.title, cabin.slug);
  const description = getCabinDescription(cabin.description, cabin.slug);

  return (
    <Card>
      <CardImage src={coverImage.src} alt={coverImage.alt} />
      <CardContent>
        <CardTitle>{displayTitle}</CardTitle>
        <CardDescription className="mb-4 line-clamp-3">
          {description}
        </CardDescription>

        <div className="mb-4 flex flex-wrap gap-2">
          {amenities.slice(0, 4).map((amenity, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-500/10 text-primary-500"
            >
              {String(amenity)}
            </span>
          ))}
          {amenities.length > 4 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-dark-800 text-gray-400">
              +{amenities.length - 4} más
            </span>
          )}
        </div>

        <div className="mb-4 flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span>Hasta {cabin.capacity_max} personas</span>
          </div>
        </div>

        <div className="mb-6 border-t border-dark-800 pt-4">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-bold text-primary-500">
                {formatPrice(cabin.base_price)}
              </span>
              <span className="text-gray-400 ml-2">/ noche</span>
            </div>
            {cabin.jacuzzi_price > 0 && (
              <div className="text-right text-sm text-gray-400">
                <div>Tinaja opcional</div>
                <div className="text-primary-500 font-semibold">
                  +{formatPrice(cabin.jacuzzi_price)}/día
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Link href={`/cabanas/${cabin.slug}`} className="flex-1">
            <Button className="w-full" size="md">
              Ver Detalles
            </Button>
          </Link>
          <Link href={`/cabanas/${cabin.slug}#reservar`}>
            <Button variant="secondary" size="md">
              Reservar
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

