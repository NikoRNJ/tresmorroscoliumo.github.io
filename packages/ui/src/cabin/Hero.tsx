'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import Image from 'next/image';
import { cn } from '@core/lib/utils/cn';
import { heroImages } from './media';

export function Hero() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const scrollToCabins = () => {
    const element = document.getElementById('cabanas');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-950/80 via-dark-950/60 to-dark-950 z-10" />
        {heroImages.map((image, index) => (
          <Image
            key={image.src}
            src={image.src}
            alt={image.alt}
            fill
            priority={index === 0}
            className={cn(
              'object-cover transition-opacity duration-1000 ease-in-out',
              index === currentImage ? 'opacity-100' : 'opacity-0'
            )}
          />
        ))}
      </div>

      {/* Content */}
      <Container className="relative z-20 text-center">
        <h1 className="heading-primary mb-6 text-balance">
          Cabañas en Coliumo
          <span className="block text-primary-500 mt-2">para disfrutar de la naturaleza y el mar</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
          Vive momentos inolvidables en nuestras cabañas frente al mar en Coliumo, Región del Bío-Bío.
          Perfectas para desconectar y reconectar con la naturaleza.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={scrollToCabins}>
            Ver Cabañas
          </Button>
          <Button variant="secondary" size="lg" onClick={() => (window.location.href = '#contacto')}>
            Contactar
          </Button>
        </div>
      </Container>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary-500 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-primary-500 rounded-full" />
        </div>
      </div>
    </div>
  );
}
