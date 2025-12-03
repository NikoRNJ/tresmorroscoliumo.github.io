import { Container, Section } from '../../ui/Container';

const cabinStories = [
  {
    name: 'Vega del Coliumo',
    tagline: 'La abundancia del valle verde',
    description:
      'Inspirada en las vegas fértiles donde nacen los mercados locales. Invita a reconectar con los sabores de la huerta, los frutos recolectados a mano y el ritmo pausado de la vida de campo.',
  },
  {
    name: 'Caleta del Medio',
    tagline: 'Memorias de pescadores artesanales',
    description:
      'Honramos a las familias que resguardaron la bahía y compartieron su pesca. Esta cabaña abraza el murmullo del mar y es perfecta para quienes buscan amanecer con olor a sal y relatos del puerto.',
  },
  {
    name: 'Los Morros',
    tagline: 'Guardianes de roca y espuma',
    description:
      'Su nombre proviene de los acantilados que vigilan la costa. Es el refugio ideal para contemplar atardeceres naranjos, sentir el viento y entender cómo el océano esculpe cada rincón de Coliumo.',
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
              Una Experiencia Cercana y Familiar en Cabañas Tres Morros
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
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-dark-950/70 p-6 shadow-2xl backdrop-blur"
              >
                <div className="absolute inset-x-6 top-0 h-1 rounded-b-full bg-gradient-to-r from-primary-400 via-primary-300 to-primary-500" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm uppercase tracking-[0.3em] text-primary-200">{String(index + 1).padStart(2, '0')}</span>
                  <span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs text-primary-300">{story.tagline}</span>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">{story.name}</h3>
                <p className="text-gray-300">{story.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

