import type { Cabin } from "@/types/cabins";

export const CABINS: Cabin[] = [
  {
    id: "laguna-norte",
    slug: "laguna-norte",
    name: "Laguna Norte",
    headline: "Vista al volcán y lago Riñihue",
    description:
      "Una cabaña inmersa entre lengas con terrazas amplias y hot tub exterior privado. Diseñada para desconectar, con cocina equipada, chimenea a leña y domótica para el clima sureño.",
    amenities: [
      "Hot tub exterior",
      "Chimenea a leña",
      "Cocina equipada",
      "Workstation con fibra óptica",
      "Fogón privado",
    ],
    heroImage:
      "https://images.unsplash.com/photo-1523419409543-0c1df022bddb?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1498612753354-772a3062990d?auto=format&fit=crop&w=1200&q=80",
    ],
    nightlyRate: 165000,
    basePricePerNight: 165000,
    jacuzziRate: 20000,
    maxGuests: 4,
    capacity: 4,
    bedrooms: 2,
    area: 78,
    seo: {
      title: "Laguna Norte | Tres Morros",
      description:
        "Cabaña boutique con vista al volcán Rukapillán, hot tub y chimenea. Ideal para dos parejas o familia pequeña.",
      images: [
        "https://images.unsplash.com/photo-1523419409543-0c1df022bddb?auto=format&fit=crop&w=1800&q=80",
      ],
    },
  },
  {
    id: "bosque-sur",
    slug: "bosque-sur",
    name: "Bosque Sur",
    headline: "Arquitectura en madera nativa",
    description:
      "Cabaña familiar con doble altura, ventanales piso a techo y quincho cerrado. Perfecta para grupos que buscan naturaleza sin sacrificar comodidad.",
    amenities: [
      "Jacuzzi interior",
      "Cava de vinos",
      "Cocina profesional",
      "Parrilla argentina",
      "Climatización geotérmica",
    ],
    heroImage:
      "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1460472178825-e5240623afd5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505691939190-c19fbe0896fd?auto=format&fit=crop&w=1200&q=80",
    ],
    nightlyRate: 210000,
    basePricePerNight: 210000,
    jacuzziRate: 25000,
    maxGuests: 6,
    capacity: 6,
    bedrooms: 3,
    area: 112,
    seo: {
      title: "Bosque Sur | Tres Morros",
      description:
        "Experiencia premium entre araucarias con jacuzzi interior, cava y quincho para compartir.",
      images: [
        "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1800&q=80",
      ],
    },
  },
  {
    id: "andino-lodge",
    slug: "andino-lodge",
    name: "Andino Lodge",
    headline: "Refugio para escapadas largas",
    description:
      "El lodge más amplio del proyecto: dos alas privadas, sala multimedia y terrazas que miran al valle. Incluye sauna seco y acceso directo a senderos.",
    amenities: [
      "Sauna seco",
      "Sala multimedia 7.1",
      "Senderos privados",
      "Estación de carga EV",
      "Desayuno campesino",
    ],
    heroImage:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505692794400-0d38a09e1c47?auto=format&fit=crop&w=1200&q=80",
    ],
    nightlyRate: 285000,
    basePricePerNight: 285000,
    jacuzziRate: 32000,
    maxGuests: 8,
    capacity: 8,
    bedrooms: 4,
    area: 150,
    seo: {
      title: "Andino Lodge | Tres Morros",
      description:
        "Lodge full-service con sauna seco, sala multimedia y servicio de anfitrión 24/7.",
      images: [
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1800&q=80",
      ],
    },
  },
];
