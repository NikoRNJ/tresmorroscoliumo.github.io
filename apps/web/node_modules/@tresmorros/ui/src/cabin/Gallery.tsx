'use client';

import { useState } from 'react';
import { Container, Section } from '../ui/Container';
import { cn } from '@core/lib/utils/cn';
import Image from 'next/image';
import { galleryCollections } from './media';

export function Gallery() {
  const [activeTab, setActiveTab] = useState(galleryCollections[0]?.id ?? '');

  const currentImages = galleryCollections.find((tab) => tab.id === activeTab)?.images || [];

  return (
    <Section padding="lg" className="bg-dark-950">
      <Container>
        <div className="text-center mb-12">
          <h2 className="heading-secondary mb-4">
            <span className="text-primary-500">Galería</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Disfruta visual para conocerte el espacio y tener un vistazo que te imagines
            tus próximas vacaciones con tus allegados.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {galleryCollections.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-6 py-3 rounded-lg font-semibold transition-all duration-300',
                activeTab === tab.id
                  ? 'bg-primary-500 text-dark-950'
                  : 'bg-dark-900 text-gray-400 hover:bg-dark-800 hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentImages.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square overflow-hidden rounded-lg group cursor-pointer"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 1024px) 50vw, 25vw"
                priority={index < 4}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
