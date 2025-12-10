// Image Service - Usa APIs server-side (service role) para evitar fallos de RLS
import type { Image, Category } from '@/lib/types';

type JsonResponse<T> = { success: boolean; data?: T; error?: string };

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  let payload: JsonResponse<T>;

  try {
    payload = (await response.json()) as JsonResponse<T>;
  } catch (err) {
    throw new Error('No se pudo leer la respuesta del servidor');
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || `Error ${response.status}`);
  }

  return payload.data as T;
}

export const imageService = {
  // ==================== IMAGES ====================
  async getAll(): Promise<Image[]> {
    return requestJson<Image[]>('/api/images');
  },

  async getById(id: string): Promise<Image | null> {
    if (!id) return null;
    return requestJson<Image | null>(`/api/images?id=${encodeURIComponent(id)}`);
  },

  async getByCategory(categoryId: string): Promise<Image[]> {
    return requestJson<Image[]>(`/api/images?categoryId=${encodeURIComponent(categoryId)}`);
  },

  async getByCabin(cabinId: string): Promise<Image[]> {
    return requestJson<Image[]>(`/api/images?cabinId=${encodeURIComponent(cabinId)}`);
  },

  async upload(
    file: File,
    categoryId?: string,
    alt?: string,
    options?: { cabinId?: string; isPrimary?: boolean }
  ): Promise<Image> {
    const formData = new FormData();
    formData.append('file', file);
    if (categoryId) formData.append('categoryId', categoryId);
    if (options?.cabinId) formData.append('cabinId', options.cabinId);
    if (alt) formData.append('alt', alt);
    if (options?.isPrimary) formData.append('isPrimary', 'true');

    return requestJson<Image>('/api/images', { method: 'POST', body: formData });
  },

  async update(
    id: string,
    updates: { alt?: string; order_index?: number; is_primary?: boolean }
  ): Promise<Image> {
    return requestJson<Image>('/api/images', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
  },

  async delete(id: string): Promise<void> {
    await requestJson<null>(`/api/images?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async reorder(imageId: string, newIndex: number, _categoryId?: string, _cabinId?: string): Promise<void> {
    await this.update(imageId, { order_index: newIndex });
  },

  // ==================== CATEGORIES ====================
  async getCategories(): Promise<Category[]> {
    return requestJson<Category[]>('/api/categories');
  },

  async createCategory(name: string, slug: string, description?: string): Promise<Category> {
    return requestJson<Category>('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, description }),
    });
  },

  async deleteCategory(id: string): Promise<void> {
    await requestJson<null>(`/api/categories?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // ==================== CABINS ====================
  async getCabins(): Promise<import('@/lib/types').Cabin[]> {
    return requestJson<import('@/lib/types').Cabin[]>('/api/cabins');
  },
};
