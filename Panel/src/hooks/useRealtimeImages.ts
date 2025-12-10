'use client';

import { useState, useEffect, useCallback } from 'react';
import { getClient } from '@/lib/supabase/client';
import { imageService } from '@/services/imageService';
import type { Image } from '@/lib/types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface UseRealtimeImagesOptions {
  categoryId?: string;
  cabinId?: string;
  enabled?: boolean;
}

interface UseRealtimeImagesReturn {
  images: Image[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook para suscripción en tiempo real a cambios en imágenes
 * Actualiza automáticamente cuando hay INSERT, UPDATE o DELETE
 */
export function useRealtimeImages(options: UseRealtimeImagesOptions = {}): UseRealtimeImagesReturn {
  const { categoryId, cabinId, enabled = true } = options;
  
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch inicial
  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = cabinId
        ? await imageService.getByCabin(cabinId)
        : categoryId
          ? await imageService.getByCategory(categoryId)
          : await imageService.getAll();
      
      setImages(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching images'));
    } finally {
      setLoading(false);
    }
  }, [categoryId, cabinId]);

  useEffect(() => {
    if (!enabled) return;

    // Fetch inicial
    fetchImages();

    // Configurar suscripción realtime
    const supabase = getClient();
    
    const channel = supabase
      .channel('images-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'images',
          ...(categoryId && { filter: `category_id=eq.${categoryId}` }),
          ...(cabinId && { filter: `cabin_id=eq.${cabinId}` }),
        },
        async (payload: RealtimePostgresChangesPayload<Image>) => {
          console.log('Realtime event:', payload.eventType, payload);

          switch (payload.eventType) {
            case 'INSERT':
              // Obtener la imagen completa con su categoría
              if (payload.new && 'id' in payload.new) {
                const newImage = await imageService.getById(payload.new.id);
                if (newImage) {
                  setImages(prev => {
                    // Evitar duplicados
                    if (prev.some(img => img.id === newImage.id)) {
                      return prev;
                    }
                    return [...prev, newImage].sort((a, b) => a.order_index - b.order_index);
                  });
                }
              }
              break;

            case 'UPDATE':
              if (payload.new && 'id' in payload.new) {
                const updatedImage = await imageService.getById(payload.new.id);
                if (updatedImage) {
                  setImages(prev =>
                    prev
                      .map(img => img.id === updatedImage.id ? updatedImage : img)
                      .sort((a, b) => a.order_index - b.order_index)
                  );
                }
              }
              break;

            case 'DELETE':
              if (payload.old && 'id' in payload.old) {
                setImages(prev => prev.filter(img => img.id !== payload.old.id));
              }
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [categoryId, cabinId, enabled, fetchImages]);

  return { images, loading, error };
}

/**
 * Hook para suscripción en tiempo real a cambios en categorías
 */
export function useRealtimeCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await imageService.getCategories();
        setCategories(data);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();

    const supabase = getClient();
    
    const channel = supabase
      .channel('categories-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
        },
        () => {
          // Refetch on any change
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { categories, loading };
}
