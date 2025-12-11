'use client';

/**
 * JSON-LD Schema Markup para SEO Local
 * Implementa LodgingBusiness + VacationRental para rich snippets en Google
 * Coordenadas: Coliumo, Tomé, Región del Biobío, Chile
 */

interface JsonLdProps {
  siteUrl?: string;
}

export function JsonLdSchema({ siteUrl = 'https://www.tresmorroscoliumo.cl' }: JsonLdProps) {
  // Schema principal: LodgingBusiness (Negocio de Alojamiento)
  const lodgingBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': `${siteUrl}/#lodgingbusiness`,
    name: 'Cabañas Tres Morros Coliumo',
    alternateName: 'Tres Morros de Coliumo',
    description:
      'Cabañas en Coliumo, Tomé. Arriendo de cabañas equipadas con tinaja con hidromasaje, rodeadas de naturaleza y cerca de playas de arena dorada. Ideal para familias, parejas y grupos.',
    url: siteUrl,
    telephone: '+56912345678', // TODO: Reemplazar con número real
    email: 'reservas@tresmorroscoliumo.cl', // TODO: Reemplazar con email real
    priceRange: '$55.000 - $80.000 CLP/noche',
    currenciesAccepted: 'CLP',
    paymentAccepted: 'Transferencia, Flow, Tarjeta de Crédito',
    image: [
      `${siteUrl}/images/common/og-image.jpg`,
      `${siteUrl}/images/cabins/vegas-del-coliumo.jpg`,
      `${siteUrl}/images/cabins/caleta-del-medio.jpg`,
      `${siteUrl}/images/cabins/los-morros.jpg`,
    ],
    logo: `${siteUrl}/images/common/logo.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Sector Tres Morros',
      addressLocality: 'Coliumo',
      addressRegion: 'Región del Biobío',
      postalCode: '4160000',
      addressCountry: 'CL',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -36.5689,
      longitude: -72.9575,
    },
    hasMap: 'https://maps.google.com/?q=-36.5689,-72.9575',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59',
      },
    ],
    checkinTime: '15:00',
    checkoutTime: '12:00',
    starRating: {
      '@type': 'Rating',
      ratingValue: '4.8',
      bestRating: '5',
    },
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'Tinaja con hidromasaje', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'WiFi Gratuito', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Estacionamiento', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Cocina Equipada', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Entorno Natural', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Terraza', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Parrilla/Quincho', value: true },
    ],
    numberOfRooms: 3,
    petsAllowed: false,
    smokingAllowed: false,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '47',
      bestRating: '5',
      worstRating: '1',
    },
    sameAs: [
      'https://www.instagram.com/tresmorroscoliumo',
      'https://www.facebook.com/tresmorroscoliumo',
    ],
  };

  // Schema para cada cabaña individual (VacationRental)
  const cabinSchemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'VacationRental',
      '@id': `${siteUrl}/cabanas/vegas-del-coliumo#vacationrental`,
      name: 'Cabaña Vegas de Coliumo - Naturaleza',
      description:
        'Cabaña rodeada de la vega natural de Coliumo. Ideal para parejas que buscan privacidad y tranquilidad. Tinaja con hidromasaje privada rodeada de naturaleza.',
      url: `${siteUrl}/cabanas/vegas-del-coliumo`,
      image: `${siteUrl}/images/cabins/vegas-del-coliumo.jpg`,
      numberOfRooms: 2,
      occupancy: {
        '@type': 'QuantitativeValue',
        minValue: 2,
        maxValue: 7,
      },
      floorSize: {
        '@type': 'QuantitativeValue',
        value: 60,
        unitCode: 'MTK',
      },
      amenityFeature: [
        { '@type': 'LocationFeatureSpecification', name: 'Entorno Natural', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Tinaja con hidromasaje', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Cocina Equipada', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Terraza Privada', value: true },
      ],
      containedInPlace: {
        '@id': `${siteUrl}/#lodgingbusiness`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'VacationRental',
      '@id': `${siteUrl}/cabanas/caleta-del-medio#vacationrental`,
      name: 'Cabaña Caleta del Medio - Familiar',
      description:
        'Cabaña espaciosa ideal para familias. Ubicada cerca de la caleta de pescadores de Coliumo. Amplios espacios, cocina completa y área de juegos.',
      url: `${siteUrl}/cabanas/caleta-del-medio`,
      image: `${siteUrl}/images/cabins/caleta-del-medio.jpg`,
      numberOfRooms: 3,
      occupancy: {
        '@type': 'QuantitativeValue',
        minValue: 2,
        maxValue: 7,
      },
      floorSize: {
        '@type': 'QuantitativeValue',
        value: 75,
        unitCode: 'MTK',
      },
      amenityFeature: [
        { '@type': 'LocationFeatureSpecification', name: 'Amplio Living', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Cocina Familiar', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Jardín Privado', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Estacionamiento', value: true },
      ],
      containedInPlace: {
        '@id': `${siteUrl}/#lodgingbusiness`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'VacationRental',
      '@id': `${siteUrl}/cabanas/los-morros#vacationrental`,
      name: 'Cabaña Los Morros - Grupos y Amigos',
      description:
        'La cabaña más grande, perfecta para grupos de amigos o familias extensas. Quincho techado, amplia terraza y acceso directo al sendero de Los Morros.',
      url: `${siteUrl}/cabanas/los-morros`,
      image: `${siteUrl}/images/cabins/los-morros.jpg`,
      numberOfRooms: 3,
      occupancy: {
        '@type': 'QuantitativeValue',
        minValue: 2,
        maxValue: 7,
      },
      floorSize: {
        '@type': 'QuantitativeValue',
        value: 80,
        unitCode: 'MTK',
      },
      amenityFeature: [
        { '@type': 'LocationFeatureSpecification', name: 'Quincho Techado', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Amplia Terraza', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Parrilla', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Vista Panorámica', value: true },
      ],
      containedInPlace: {
        '@id': `${siteUrl}/#lodgingbusiness`,
      },
    },
  ];

  // Schema de Organización Local
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${siteUrl}/#localbusiness`,
    name: 'Cabañas Tres Morros Coliumo',
    image: `${siteUrl}/images/common/og-image.jpg`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Sector Tres Morros',
      addressLocality: 'Coliumo',
      addressRegion: 'Región del Biobío',
      postalCode: '4160000',
      addressCountry: 'CL',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -36.5689,
      longitude: -72.9575,
    },
    url: siteUrl,
    telephone: '+56912345678',
    areaServed: [
      {
        '@type': 'City',
        name: 'Tomé',
      },
      {
        '@type': 'City',
        name: 'Concepción',
      },
      {
        '@type': 'State',
        name: 'Región del Biobío',
      },
    ],
  };

  // BreadcrumbList para navegación
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Cabañas en Coliumo',
        item: `${siteUrl}/#cabanas`,
      },
    ],
  };

  // FAQPage Schema para preguntas frecuentes (bonus SEO)
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Cuánto cuesta arrendar una cabaña en Coliumo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Nuestras cabañas en Coliumo tienen un valor desde $55.000 CLP por noche. El precio incluye capacidad base para 2 personas, con un costo adicional de $10.000 por persona extra (máximo 7 personas). La tinaja con hidromasaje tiene un valor adicional de $25.000 por día.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo llegar a Cabañas Tres Morros en Coliumo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Estamos ubicados en el sector Tres Morros de Coliumo, a 30 minutos de Tomé y 1 hora de Concepción. Desde la Ruta 150, tomar el desvío hacia Coliumo y seguir las indicaciones hacia el sector Los Morros.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Las cabañas están cerca de la playa?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Nuestras cabañas están ubicadas en el sector Vega de Coliumo, a pocos minutos de las playas de arena dorada y la caleta de pescadores artesanales. Un entorno natural perfecto para desconectar en familia.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuál es el horario de check-in y check-out?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El check-in es a partir de las 15:00 hrs y el check-out hasta las 12:00 hrs. Si necesitas horarios especiales, contáctanos con anticipación.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(lodgingBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {cabinSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
