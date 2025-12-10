import { Cabin } from '@core/types/database';
import { Container, Section } from '../../ui/Container';
import { CabinCard } from './CabinCard';
import { cabinDisplayOrder } from './media';
import { Instagram, Facebook, MessageCircle, Mail } from 'lucide-react';

interface CabinsSectionProps {
  cabins: Cabin[];
}

export function CabinsSection({ cabins }: CabinsSectionProps) {
  const getSortIndex = (slug: string | null) => {
    const index = cabinDisplayOrder.indexOf(slug as (typeof cabinDisplayOrder)[number]);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };

  const sortedCabins = [...cabins].sort((a, b) => getSortIndex(a.slug) - getSortIndex(b.slug));

  return (
    <Section id="cabanas" padding="lg" dark>
      <Container>
        {/* ============================================
            CONTENIDO SEO OPTIMIZADO - Sección Cabañas
            H2 principal con keyword "Cabañas en Coliumo"
            ============================================ */}
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.4em] text-primary-300 mb-3">
            Tu Refugio en la Costa
          </p>
          <h2 className="heading-secondary mb-6">
            Vive la Experiencia <span className="text-primary-500">Frente al Mar</span>
          </h2>

          {/* Párrafo SEO optimizado con tono natural y amigable */}
          <div className="text-lg text-gray-300 max-w-4xl mx-auto space-y-4">
            <p>
              Queremos que tu visita a <strong>Coliumo</strong> sea inolvidable. Nuestras tres cabañas están pensadas para conectarte con la magia de la costa del <strong>Biobío</strong>: despierta con el suave murmullo de las olas, maravíllate con los atardeceres desde tu terraza y encuentra el relax total en nuestro <strong>jacuzzi con vista al océano</strong>.
            </p>
            <p className="text-gray-400">
              Ya sea una escapada romántica, unas vacaciones en <strong>familia</strong> o un viaje con <strong>amigos</strong>, tenemos el espacio perfecto para ti. Cabañas acogedoras y totalmente equipadas para hasta 7 personas, con cocina completa, WiFi y estacionamiento, listas para ser tu hogar junto al mar.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedCabins.map((cabin) => (
            <CabinCard key={cabin.id} cabin={cabin} />
          ))}
        </div>

        {sortedCabins.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No hay cabañas disponibles en este momento.</p>
          </div>
        )}

        {/* Sección de Redes Sociales y WhatsApp */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-6">
            Síguenos en redes sociales y contáctanos directamente
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/cabanastresmorrosdecoliumo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              <Instagram className="h-5 w-5" />
              <span>Instagram</span>
            </a>

            {/* Facebook */}
            <a
              href="https://web.facebook.com/profile.php?id=61583396638851"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
              <Facebook className="h-5 w-5" />
              <span>Facebook</span>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/56988661405?text=Hola%2C%20me%20interesa%20reservar%20una%20caba%C3%B1a"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span>WhatsApp</span>
            </a>

            {/* Gmail */}
            <a
              href="mailto:cabanastresmorrosdecoliumo@gmail.com"
              className="flex items-center gap-2 px-5 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors"
            >
              <Mail className="h-5 w-5" />
              <span>Gmail</span>
            </a>
          </div>
        </div>

        {/* CTA secundario para conversión */}
        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">
            ¿No encuentras disponibilidad? Contáctanos para fechas especiales o estadías prolongadas.
          </p>
        </div>
      </Container>
    </Section>
  );
}

