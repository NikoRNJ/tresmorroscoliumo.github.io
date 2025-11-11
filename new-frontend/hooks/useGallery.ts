/**
 * Hook para manejar el estado de la galería con lightbox
 */
'use client';

import { useState, useCallback } from 'react';
import type { GalleryImage } from '@/types';

interface UseGalleryReturn {
  selectedImage: GalleryImage | null;
  selectedIndex: number;
  isOpen: boolean;
  openLightbox: (image: GalleryImage, index: number) => void;
  closeLightbox: () => void;
  goToNext: (images: GalleryImage[]) => void;
  goToPrevious: (images: GalleryImage[]) => void;
}

export const useGallery = (): UseGalleryReturn => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);

  const openLightbox = useCallback((image: GalleryImage, index: number) => {
    setSelectedImage(image);
    setSelectedIndex(index);
    setIsOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setSelectedImage(null);
      setSelectedIndex(0);
    }, 300);
  }, []);

  const goToNext = useCallback((images: GalleryImage[]) => {
    setSelectedIndex((prevIndex) => {
      const nextIndex = prevIndex === images.length - 1 ? 0 : prevIndex + 1;
      setSelectedImage(images[nextIndex]);
      return nextIndex;
    });
  }, []);

  const goToPrevious = useCallback((images: GalleryImage[]) => {
    setSelectedIndex((prevIndex) => {
      const prevIdx = prevIndex === 0 ? images.length - 1 : prevIndex - 1;
      setSelectedImage(images[prevIdx]);
      return prevIdx;
    });
  }, []);

  return {
    selectedImage,
    selectedIndex,
    isOpen,
    openLightbox,
    closeLightbox,
    goToNext,
    goToPrevious,
  };
};
