import { createClient } from '@/lib/supabase/server';
import Carousel from '@/components/ui/Carousel';
import Gallery from '@/components/ui/Gallery';

interface ProductoPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getProduct(slug: string) {
  const supabase = await createClient();
  
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('slug', slug)
    .single();

  if (error) return null;
  return product;
}

async function getProductImages(categoryId: string) {
  const supabase = await createClient();
  
  const { data: images } = await supabase
    .from('images')
    .select('*')
    .eq('category_id', categoryId)
    .order('order_index', { ascending: true });

  return images || [];
}

export default async function ProductoPage({ params }: ProductoPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Producto no encontrado
          </h1>
          <p className="text-gray-600">
            El producto que buscas no existe o ha sido eliminado.
          </p>
        </div>
      </div>
    );
  }

  const images = await getProductImages(product.category_id);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section - Con actualización en tiempo real */}
          <div className="space-y-4">
            {/* Carousel principal con realtime */}
            <Carousel
              categoryId={product.category_id}
              autoPlay={false}
              showIndicators={true}
              showArrows={true}
              className="aspect-square"
            />

            {/* Galería de miniaturas con realtime */}
            <div className="mt-4">
              <Gallery
                categoryId={product.category_id}
                columns={4}
                gap="sm"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <span className="text-sm text-blue-600 font-medium">
                {product.category?.name}
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">
                {product.name}
              </h1>
            </div>

            <div className="text-3xl font-bold text-gray-900">
              ${product.price?.toLocaleString('es-CL')}
            </div>

            <div className="prose prose-gray">
              <p>{product.description}</p>
            </div>

            <div className="pt-6 border-t">
              <button className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Agregar al carrito
              </button>
            </div>

            {/* Realtime indicator */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Las imágenes se actualizan en tiempo real
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
