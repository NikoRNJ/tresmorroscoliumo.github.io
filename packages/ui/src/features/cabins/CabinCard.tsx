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

export function CabinCard({ cabin }: CabinCardProps) {
  const coverImage = getCabinCoverImage(cabin.slug);
  const amenities = Array.isArray(cabin.amenities) ? cabin.amenities : [];

  return (
    <Card>
      <CardImage src={coverImage.src} alt={coverImage.alt} />
      <CardContent>
        <CardTitle>{cabin.title}</CardTitle>
        <CardDescription className="mb-4 line-clamp-2">
          {cabin.description || 'Cabaña acogedora en Coliumo'}
        </CardDescription>

        <div className="mb-4 flex flex-wrap gap-2">
          {amenities.slice(0, 3).map((amenity, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-500/10 text-primary-500"
            >
              {String(amenity)}
            </span>
          ))}
          {amenities.length > 3 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-dark-800 text-gray-400">
              +{amenities.length - 3} más
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
                <div>Jacuzzi opcional</div>
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

