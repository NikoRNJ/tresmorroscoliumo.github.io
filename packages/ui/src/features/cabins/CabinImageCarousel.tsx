'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@core/lib/utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MediaImage } from '../../types/media';

interface CabinImageCarouselProps {
  images: MediaImage[];
  intervalMs?: number;
  title: string;
}

export function CabinImageCarousel({ images, intervalMs = 3500, title }: CabinImageCarouselProps) {
  const safeImages = useMemo(
    () => (images.length > 0 ? images : [{ src: '/images/common/cabin-placeholder.svg', alt: title }]),
    [images, title]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % safeImages.length);
  }, [safeImages.length]);

  const goToPrevious = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  }, [safeImages.length]);

  useEffect(() => {
    if (safeImages.length <= 1 || isPaused) {
      return;
    }

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % safeImages.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, safeImages.length, isPaused]);

  return (
    <div 
      className="relative mb-8 aspect-[16/10] overflow-hidden rounded-lg bg-dark-800 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {safeImages.map((image, index) => (
        <Image
          key={image.src}
          src={image.src}
          alt={`${title} - ${image.alt}`}
          fill
          className={cn(
            'object-cover transition-opacity duration-700 ease-in-out',
            index === activeIndex ? 'opacity-100' : 'opacity-0'
          )}
          sizes="(max-width: 1024px) 100vw, 66vw"
          priority={index === 0}
        />
      ))}

      {/* Botones de navegación */}
      {safeImages.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70"
            aria-label={`Imagen anterior de ${title}`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70"
            aria-label={`Siguiente imagen de ${title}`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Indicadores de puntos */}
      {safeImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {safeImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'h-2 w-2 rounded-full transition-all duration-300',
                index === activeIndex ? 'bg-primary-500 w-6' : 'bg-white/40 hover:bg-white/80'
              )}
              aria-label={`Mostrar imagen ${index + 1} de ${title}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

