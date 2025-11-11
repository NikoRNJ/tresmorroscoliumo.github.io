/**
 * Gallery Section - Galería interactiva con lightbox
 */
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { Section, SectionHeader, Modal } from '@/components/ui';
import { galleryImages } from '@/lib/data';
import { staggerContainer, staggerItem } from '@/lib/utils';
import { useGallery } from '@/hooks';

const categories = [
  { id: 'all', label: 'Todas' },
  { id: 'exterior', label: 'Exteriores' },
  { id: 'interior', label: 'Interiores' },
  { id: 'amenities', label: 'Amenidades' },
  { id: 'landscape', label: 'Paisajes' },
] as const;

export const GallerySection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { selectedImage, selectedIndex, isOpen, openLightbox, closeLightbox, goToNext, goToPrevious } = useGallery();

  const filteredImages = useMemo(() => {
    return activeCategory === 'all'
      ? galleryImages
      : galleryImages.filter((img) => img.category === activeCategory);
  }, [activeCategory]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight') goToNext(filteredImages);
      if (e.key === 'ArrowLeft') goToPrevious(filteredImages);
    },
    [filteredImages, goToNext, goToPrevious, isOpen]
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Section id="gallery" background="dark" width="wide">
      <SectionHeader
        title="GALERÍA"
        subtitle="Imágenes de ejemplo"
        description="Galería visual para conocer el diseño y formato del sitio. Imágenes representativas de cabañas y entorno natural."
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16 flex w-full max-w-4xl flex-wrap justify-center gap-4 self-center"
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`rounded-full border px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-all ${
              activeCategory === category.id
                ? 'border-white bg-white text-black'
                : 'border-white/20 text-white hover:border-white/60'
            }`}
          >
            {category.label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 self-center sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filteredImages.map((image, index) => (
            <motion.div
              key={image.id}
              variants={staggerItem}
              layoutId={image.id}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-white/5"
              onClick={() => openLightbox(image, index)}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/50">
                <ZoomIn className="text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" size={40} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <Modal
        isOpen={isOpen}
        onClose={closeLightbox}
        className="max-w-7xl w-full bg-transparent border-0"
        showCloseButton={false}
      >
        {selectedImage && (
          <div className="relative">
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 rounded-full bg-black/60 p-2 transition-colors hover:bg-black/80"
              aria-label="Cerrar galería"
            >
              <X className="text-white" size={24} />
            </button>

            <div className="relative w-full h-[60vh] md:h-[70vh] rounded-3xl border border-white/10 bg-black/80">
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </div>

            <button
              onClick={() => goToPrevious(filteredImages)}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 transition-colors hover:bg-black/80"
              aria-label="Anterior"
            >
              <ChevronLeft className="text-white" size={24} />
            </button>

            <button
              onClick={() => goToNext(filteredImages)}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 transition-colors hover:bg-black/80"
              aria-label="Siguiente"
            >
              <ChevronRight className="text-white" size={24} />
            </button>

            <div className="mt-4 text-center">
              <p className="text-white text-sm">
                {selectedIndex + 1} / {filteredImages.length}
              </p>
              <p className="text-gray-400 text-xs mt-1">{selectedImage.alt}</p>
            </div>
          </div>
        )}
      </Modal>
    </Section>
  );
};
