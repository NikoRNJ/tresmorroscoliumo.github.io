import Image from 'next/image';
import { Container, Section } from '../../ui/Container';

const cabinStories = [
  {
    name: 'Vegas de Coliumo',

    description:
      'Un sector encantador dentro de la localidad de Coliumo, en la comuna de Tomé, Región del Biobío. Reconocido por su humedal costero, este lugar destaca por su belleza natural, su tranquilidad y su enorme valor ecológico. Es un entorno ideal para quienes buscan conectar con la naturaleza, disfrutar del paisaje y vivir momentos de calma en un ambiente único.',
    image: '/images/proposito/vegasColiumo.jpg',
  },
  {
    name: 'Caleta del Medio',

    description:
      'Caleta del Medio es un lugar acogedor y lleno de vida local. Aquí puedes disfrutar de hermosas vistas, ver las embarcaciones artesanales y sentir la esencia tradicional de Coliumo. Un destino perfecto para pasear en familia y descubrir la auténtica cultura costera de la zona.',
    image: '/images/proposito/caletaMedio.jpg',
  },
  {
    name: 'Los Morros',

    description:
      'Los Morros es uno de los paisajes más emblemáticos de Coliumo. Con sus formaciones rocosas y vistas panorámicas, es un lugar ideal para pasear en familia, tomar fotografías y disfrutar de la naturaleza. Un punto imperdible para quienes visitan la zona y buscan momentos tranquilos y memorables.',
    image: '/images/proposito/losmorros.jpg',
  },
] as const;

const highlights = [
  {
    title: '🏖️ Playas y Naturaleza',
    description:
      'Playas ideales para relajarte, senderos y miradores para conectar con la naturaleza y capturar fotos increíbles.',
  },
  {
    title: '🍽️ Gastronomía Local',
    description:
      'Restaurantes locales y almacenes cercanos, perfectos para conocer el sabor auténtico de la zona.',
  },
  {
    title: '📍 Rincones Únicos',
    description:
      'Rincones poco conocidos que hacen de Coliumo un destino especial. Te compartimos nuestras recomendaciones favoritas.',
  },
  {
    title: '❤️ Atención Cercana',
    description:
      'Siempre encontrarás a alguien dispuesto a ayudarte, responder tus dudas y guiarte para que descubras lo mejor.',
  },
] as const;

export function PurposeSection() {
  return (
    <Section
      id="proposito"
      padding="lg"
      dark
      className="relative overflow-hidden bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950"
    >
      <div className="pointer-events-none absolute inset-y-0 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary-500/20 blur-[150px]" />

      <Container className="relative">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] items-center">
          <div>
            <p className="text-primary-300 uppercase tracking-[0.4em] text-sm mb-4">🌿 Nuestro propósito</p>
            <h2 className="heading-secondary mb-6 text-balance">
              Misma estructura, distintas historias. Cada cabaña tiene un propósito propio que le da un encanto especial.
            </h2>
            <p className="text-lg text-gray-300 mb-4">
              En Cabañas Tres Morros queremos que vivas la mejor experiencia en Coliumo, disfrutando cada momento con tranquilidad, comodidad y el cariño de una atención cercana. Nuestro equipo estará disponible en todo momento para ayudarte y acompañarte durante tu estadía.
            </p>
            <p className="text-lg text-gray-300 mb-4">
              Te entregamos información turística clara y actualizada para que aproveches cada día al máximo. Tu descanso y bienestar son lo más importante. <strong className="text-primary-400">Déjanos acompañarte en una estadía que recordarás con cariño.</strong>
            </p>

            <p className="text-primary-300 uppercase tracking-[0.2em] text-sm mb-4 mt-8">⭐ Descubre Coliumo con Nuestra Guía Local</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm"
                >
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-300 text-base">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {cabinStories.map((story, index) => (
              <div
                key={story.name}
                className="relative overflow-hidden rounded-3xl shadow-2xl min-h-[280px]"
              >
                {/* Imagen de fondo */}
                <Image
                  src={story.image}
                  alt={story.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  quality={90}
                  priority={index === 0}
                />

                {/* Overlay gradiente para legibilidad */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/70 to-dark-950/30" />

                {/* Contenido */}
                <div className="relative z-10 p-6 pt-[25%] h-full flex flex-col justify-end">
                  <div className="absolute inset-x-6 top-0 h-1 rounded-b-full bg-gradient-to-r from-primary-400 via-primary-300 to-primary-500" />
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm uppercase tracking-[0.3em] text-primary-200 font-medium">{String(index + 1).padStart(2, '0')}</span>

                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3 drop-shadow-lg">{story.name}</h3>
                  <p className="text-gray-200 drop-shadow-md">{story.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

