import { supabaseAdmin } from '@/lib/supabase/server';
import MediaManager from './MediaManager';

type CabinImage = {
  id: string;
  cabin_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number | null;
  is_primary: boolean;
};

type CabinWithImages = {
  id: string;
  title: string;
  images: CabinImage[];
};

export default async function MediaPage() {
  const { data, error } = await supabaseAdmin
    .from('cabins')
    .select('id, title, cabin_images(id, cabin_id, image_url, alt_text, sort_order, is_primary)')
    .order('title', { ascending: true });

  if (error) {
    throw error;
  }

  const cabins: CabinWithImages[] =
    data?.map((cabin: any) => ({
      id: cabin.id,
      title: cabin.title,
      images: (cabin.cabin_images || []).sort(
        (a: CabinImage, b: CabinImage) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    })) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de media</h1>
        <p className="text-sm text-gray-600">
          Actualiza las imágenes destacadas y el orden de las galerías de cada cabaña.
        </p>
      </div>

      <MediaManager cabins={cabins} />
    </div>
  );
}

