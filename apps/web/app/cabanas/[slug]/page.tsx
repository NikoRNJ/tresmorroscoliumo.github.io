import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { formatPrice } from '@/lib/utils/format';
import { getCabinBySlug } from '@/lib/data/cabins';
import { CabinImageCarousel } from '@/components/features/cabins/CabinImageCarousel';
import { getCabinCoverImage, getCabinGalleryImages } from '@/components/features/cabins/media';

interface CabinPageProps {
  params: {
    slug: string;
  };
}

/**
 * Generar metadata dinámica para SEO
 * OPTIMIZACIÓN: Revalidar cada 1 hora para reducir queries
 */
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateMetadata({ params }: CabinPageProps): Promise<Metadata> {
  const cabin = await getCabinBySlug(params.slug);

  if (!cabin) {
    return {
      title: 'Cabaña no encontrada',
    };
  }

  return {
    title: `${cabin.title} - Tres Morros de Coliumo`,
    description: cabin.description || `Arrienda ${cabin.title} en Coliumo, Región del Bío-Bío`,
    openGraph: {
      title: cabin.title,
      description: cabin.description || '',
      type: 'website',
      images: [
        {
          url: getCabinCoverImage(cabin.slug).src,
          alt: getCabinCoverImage(cabin.slug).alt,
        },
      ],
    },
  };
}

/**
 * Generar rutas estáticas en build time
 */
// Render dinámico: no generamos rutas estáticas para evitar fallos cuando no hay datos en build

/**
 * Página de detalle de una cabaña específica
 * Adaptada al tema oscuro del proyecto
 */
export default async function CabinPage({ params }: CabinPageProps) {
  const cabinData = await getCabinBySlug(params.slug);

  if (!cabinData) {
    notFound();
  }

  // Parsear amenidades desde JSON
  const amenities = (cabinData.amenities as string[]) || [];
  const cabinImages = getCabinGalleryImages(cabinData.slug);

  return (
    <div className="min-h-screen bg-dark-950 pb-16">
      {/* Header con breadcrumb */}
      <div className="border-b border-dark-800 bg-dark-900/50 py-6">
        <Container>
          <Link
            href="/#cabanas"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a cabañas
          </Link>
        </Container>
      </div>

      <Container className="pt-8">
        {/* Título y precio */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-white">{cabinData.title}</h1>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary-500">
              {formatPrice(cabinData.base_price)}
            </span>
            <span className="text-gray-400">por noche</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Columna principal (2/3) */}
          <div className="lg:col-span-2">
            {/* Imagen principal */}
            <CabinImageCarousel images={cabinImages} title={cabinData.title} />

            {/* Descripción */}
            <div className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-white">Descripción</h2>
              <p className="text-gray-300 leading-relaxed">{cabinData.description}</p>
            </div>

            {/* Detalles adicionales */}
            {cabinData.location_details && (
              <div className="mb-8">
                <h2 className="mb-4 text-2xl font-bold text-white">Ubicación</h2>
                <p className="text-gray-300 leading-relaxed">{cabinData.location_details}</p>
              </div>
            )}

            {/* Amenidades */}
            {amenities.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-2xl font-bold text-white">Amenidades</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary-500" />
                      <span className="text-gray-300">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar (1/3) - Wizard de reserva */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <BookingWizard cabin={cabinData} />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
