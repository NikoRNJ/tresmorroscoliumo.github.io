'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@core/lib/utils/cn';
import { Container, Section } from '../../ui/Container';
import { galleryCollections as staticCollections } from './data';

interface GalleryImage {
  src: string;
  alt: string;
}

interface GalleryCollection {
  id: string;
  label: string;
  images: GalleryImage[];
}

export function Gallery() {
  const [activeTab, setActiveTab] = useState('');
  const [collections, setCollections] = useState<GalleryCollection[]>(staticCollections);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch gallery data from API on mount
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await fetch(`/api/galeria?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.collections && data.collections.length > 0) {
            setCollections(data.collections);
            if (!activeTab && data.collections[0]) {
              setActiveTab(data.collections[0].id);
            }
          } else {
            // Fallback to static data if no DB data
            setCollections(staticCollections);
            if (!activeTab && staticCollections[0]) {
              setActiveTab(staticCollections[0].id);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching gallery:', error);
        // Keep using static data on error
        if (!activeTab && staticCollections[0]) {
          setActiveTab(staticCollections[0].id);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, []);

  // Validate and set active tab when collections change
  useEffect(() => {
    if (collections.length === 0) return;

    const isValidTab = collections.some((c) => c.id === activeTab);

    if (!activeTab || !isValidTab) {
      if (collections[0]) {
        setActiveTab(collections[0].id);
      }
    }
  }, [collections, activeTab]);

  const currentImages = collections.find((tab) => tab.id === activeTab)?.images || [];

  return (
    <Section id="galeria" padding="lg" className="bg-dark-950">
      <Container>
        <div className="text-center mb-12">
          <h2 className="heading-secondary mb-4">
            <span className="text-primary-500">Galería</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Disfruta visual para conocerte el espacio y tener un vistazo que te imagines tus próximas
            vacaciones con tus allegados.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {collections.map((tab) => (
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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-lg bg-dark-800 animate-pulse"
                style={{ aspectRatio: '5/4' }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentImages.map((image, index) => (
              <div
                key={`${activeTab}-${index}`}
                className="relative overflow-hidden rounded-lg group cursor-pointer"
                style={{ aspectRatio: '5/4' }}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  priority={index < 4}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
