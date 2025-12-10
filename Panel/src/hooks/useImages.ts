'use client';

import { useState, useEffect, useCallback } from 'react';
import { imageService } from '@/services/imageService';
import type { Image, Category, Cabin } from '@/lib/types';

interface UseImagesOptions {
  categoryId?: string;
  cabinId?: string;
  autoFetch?: boolean;
}

interface UseImagesReturn {
  images: Image[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  uploadImage: (file: File, categoryId?: string, alt?: string, opts?: { cabinId?: string; isPrimary?: boolean }) => Promise<Image>;
  deleteImage: (id: string) => Promise<void>;
  updateImage: (id: string, updates: { alt?: string; order_index?: number; is_primary?: boolean }) => Promise<void>;
  reorderImages: (imageId: string, newIndex: number, categoryId: string) => Promise<void>;
}

export function useImages(options: UseImagesOptions = {}): UseImagesReturn {
  const { categoryId, cabinId, autoFetch = true } = options;
  
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: Image[] = [];
      if (cabinId) {
        data = await imageService.getByCabin(cabinId);
      } else if (categoryId) {
        data = await imageService.getByCategory(categoryId);
      } else {
        data = await imageService.getAll();
      }

      setImages(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching images'));
    } finally {
      setLoading(false);
    }
  }, [categoryId, cabinId]);

  useEffect(() => {
    if (autoFetch) {
      fetchImages();
    }
  }, [fetchImages, autoFetch]);

  const uploadImage = useCallback(async (file: File, catId?: string, alt?: string, opts?: { cabinId?: string; isPrimary?: boolean }) => {
    const newImage = await imageService.upload(file, catId, alt, opts);
    setImages(prev => [...prev, newImage]);
    return newImage;
  }, []);

  const deleteImage = useCallback(async (id: string) => {
    await imageService.delete(id);
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const updateImage = useCallback(async (id: string, updates: { alt?: string; order_index?: number; is_primary?: boolean }) => {
    const updated = await imageService.update(id, updates);
    setImages(prev => prev.map(img => img.id === id ? updated : img));
  }, []);

  const reorderImages = useCallback(async (imageId: string, newIndex: number, catId: string) => {
    await imageService.reorder(imageId, newIndex, catId);
    await fetchImages(); // Refetch to get updated order
  }, [fetchImages]);

  return {
    images,
    loading,
    error,
    refetch: fetchImages,
    uploadImage,
    deleteImage,
    updateImage,
    reorderImages,
  };
}

// Hook para categorías
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await imageService.getCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching categories'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = useCallback(async (name: string, slug: string, description?: string) => {
    const newCategory = await imageService.createCategory(name, slug, description);
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await imageService.deleteCategory(id);
    setCategories(prev => prev.filter(cat => cat.id !== id));
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    createCategory,
    deleteCategory,
  };
}

// Hook para cabañas
export function useCabins() {
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCabins = useCallback(async () => {
    try {
      setLoading(true);
      const data = await imageService.getCabins();
      setCabins(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching cabins'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCabins();
  }, [fetchCabins]);

  return {
    cabins,
    loading,
    error,
    refetch: fetchCabins,
  };
}
