import { Container, Section } from '../ui/Container';

type IconName = 'wave' | 'boat' | 'compass' | 'store' | 'leaf' | 'basket';

const iconClasses = 'w-6 h-6 text-primary-300';

const iconMap: Record<IconName, JSX.Element> = {
  wave: (
    <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 7s2 2 5 2 5-2 8-2 5 2 5 2v10s-2-2-5-2-5 2-8 2-5-2-5-2V7z"
      />
    </svg>
  ),
  boat: (
    <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 13l2 6h14l2-6M5 13h14M5 10l7-7 7 7M12 3v10"
      />
    </svg>
  ),
  compass: (
    <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 20a8 8 0 100-16 8 8 0 000 16z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 8l-2.5 5.5L8 16l2.5-5.5L16 8z"
      />
    </svg>
  ),
  store: (
    <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 9l1-5h16l1 5M4 9h16v11H4z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6v7H9z" />
    </svg>
  ),
  leaf: (
    <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 12c0-7 7-9 14-9 0 7-2 14-9 14S5 19 5 12z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13l6-6" />
    </svg>
  ),
  basket: (
    <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 11h14l1 8H4l1-8zm2-4l5-4 5 4M7 11l2 8m6-8l-2 8"
      />
    </svg>
  ),
};

const nearbySpots: { name: string; description: string; distance: string; icon: IconName }[] = [
  {
    name: 'Playa Los Morros',
    description: 'Arena dorada y oleaje suave para caminar descalzo al amanecer o ver el atardecer frente al Pacífico.',
    distance: '4 min caminando',
    icon: 'wave',
  },
  {
    name: 'Caleta del Medio',
    description: 'Punto ideal para conversar con pescadores, probar ceviche recién hecho y reservar paseos en lancha.',
    distance: '6 min en auto',
    icon: 'boat',
  },
  {
    name: 'Mirador Punta de Parra',
    description: 'Un balcón natural con vista panorámica a Tomé y la bahía; perfecto para fotografía y contemplación.',
    distance: '15 min en auto',
    icon: 'compass',
  },
  {
    name: 'Almacén La Vega',
    description: 'Abierto todo el año con pan fresco, abarrotes y productos locales para abastecerse sin salir del sector.',
    distance: '3 min caminando',
    icon: 'store',
  },
  {
    name: 'Sendero Bosque Húmedo',
    description: 'Ruta interpretativa entre helechos y árboles nativos que desemboca en pequeñas pozas de agua.',
    distance: '12 min en auto',
    icon: 'leaf',
  },
  {
    name: 'Mercado de Tomé',
    description: 'Artesanías, tejidos y sabores tradicionales para llevarse un recuerdo auténtico del litoral.',
    distance: '25 min en auto',
    icon: 'basket',
  },
];

export function LocationSection() {
  return (
    <Section padding="lg" dark>
      <Container>
        <div className="text-center mb-12">
          <h2 className="heading-secondary mb-4">
            <span className="text-primary-500">Ubicación</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Coliumo, Región del Bío-Bío, Chile. Un paraíso natural entre el mar y la montaña.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Map */}
          <div className="rounded-xl overflow-hidden shadow-2xl h-[400px] bg-dark-900">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d51094.77269237779!2d-72.97753384863282!3d-36.56899600000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9669c5b1b1b1b1b1%3A0x1b1b1b1b1b1b1b1b!2sColiumo%2C%20Regi%C3%B3n%20del%20B%C3%ADo-B%C3%ADo!5e0!3m2!1ses!2scl!4v1699999999999!5m2!1ses!2scl"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-primary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Dirección</h3>
                <p className="text-gray-400">
                  Coliumo, Región del Bío-Bío<br />
                  Chile
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-primary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Acceso</h3>
                <p className="text-gray-400">
                  A 30 minutos de Tomé<br />
                  A 1 hora de Concepción
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-primary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Entorno</h3>
                <p className="text-gray-400">
                  Playas vírgenes<br />
                  Caleta de pescadores<br />
                  Senderos naturales
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="text-center mb-10">
            <p className="text-sm uppercase tracking-[0.4em] text-primary-300 mb-3">Alrededores</p>
            <h3 className="text-3xl font-semibold text-white mb-3">Puntos cercanos para disfrutar</h3>
            <p className="text-lg text-gray-400">
              Playas, almacenes y rutas turísticas que completan la experiencia tres morros.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {nearbySpots.map((spot) => (
              <div
                key={spot.name}
                className="rounded-3xl border border-white/10 bg-dark-950/60 p-6 shadow-xl backdrop-blur-sm"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/10">
                    {iconMap[spot.icon]}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-primary-300">{spot.distance}</p>
                    <h4 className="text-xl font-semibold text-white">{spot.name}</h4>
                  </div>
                </div>
                <p className="text-gray-300">{spot.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
