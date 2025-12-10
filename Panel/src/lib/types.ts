// Types for the application

export interface Image {
  id: string;
  url: string;
  name: string;
  alt?: string;
  category_id?: string | null;
  cabin_id?: string | null;
  category?: Category;
  cabin?: Cabin;
  is_primary: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export interface Cabin {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category_id: string;
  images: Image[];
  created_at: string;
  updated_at: string;
}

export type ImageInsert = Omit<Image, 'id' | 'created_at' | 'updated_at' | 'category' | 'cabin'>;
export type ImageUpdate = Partial<ImageInsert>;

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export type RealtimePayload<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
};
