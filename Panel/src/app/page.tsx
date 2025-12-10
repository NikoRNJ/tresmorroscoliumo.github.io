import Link from 'next/link';
import Carousel from '@/components/ui/Carousel';
import Gallery from '@/components/ui/Gallery';
import { createClient } from '@/lib/supabase/server';

async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });
  return data || [];
}

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Mi Tienda</h1>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Inicio
            </Link>
            <Link href="/productos" className="text-gray-600 hover:text-gray-900">
              Productos
            </Link>
            <Link 
              href="/admin/imagenes" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Admin Panel
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Carousel - Con actualización en tiempo real */}
      {categories.length > 0 && (
        <section className="relative">
          <Carousel
            categoryId={categories[0].id}
            autoPlay={true}
            interval={5000}
            className="aspect-[21/9] max-h-[500px]"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="text-center text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Bienvenido a Nuestra Tienda
              </h2>
              <p className="text-xl mb-6">
                Las imágenes se actualizan en tiempo real
              </p>
              <span className="inline-flex items-center gap-2 text-sm bg-white/20 px-4 py-2 rounded-full">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Actualización instantánea activa
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Categories with Galleries */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Nuestras Categorías
        </h2>
        
        <div className="space-y-16">
          {categories.map((category) => (
            <div key={category.id}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">
                  {category.name}
                </h3>
                <span className="flex items-center gap-2 text-sm text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  En tiempo real
                </span>
              </div>
              
              {/* Gallery con realtime por categoría */}
              <Gallery
                categoryId={category.id}
                columns={4}
                gap="md"
              />
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                No hay categorías creadas aún.
              </p>
              <Link
                href="/admin/imagenes"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ir al Panel Admin
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-600">
          <p>
            Panel de imágenes con actualización en tiempo real usando Supabase
          </p>
        </div>
      </footer>
    </div>
  );
}
