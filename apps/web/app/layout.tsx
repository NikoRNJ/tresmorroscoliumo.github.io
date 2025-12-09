import type { Metadata, Viewport } from "next";
import "./globals.css";
import "../sentry.client.config";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { JsonLdSchema } from "@/components/layout/JsonLd";
import { SocialFloatingButtons } from "@/components/layout/SocialFloatingButtons";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0a",
};

// ============================================
// METADATA SEO OPTIMIZADA - Senior SEO Strategy
// Target: "cabañas coliumo", "arriendo cabañas coliumo"
// ============================================
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.tresmorroscoliumo.cl"),
  
  // Title Tag optimizado (59 caracteres - dentro del límite)
  title: {
    default: "Cabañas en Coliumo | Arriendo Frente al Mar - Tres Morros",
    template: "%s | Cabañas Tres Morros Coliumo",
  },
  
  // Meta Description con CTA (154 caracteres)
  description: "Arrienda cabañas en Coliumo con vista al mar y jacuzzi. A 30 min de Tomé. Reserva online tu escape perfecto en la costa del Biobío. ¡Consulta disponibilidad!",
  
  // Keywords ampliadas para SEO local
  keywords: [
    // Money Keywords principales
    "cabañas en coliumo",
    "arriendo cabañas coliumo",
    "cabañas coliumo frente al mar",
    "alojamiento coliumo tomé",
    "cabañas tomé región del biobío",
    // Keywords con modificadores
    "cabañas con jacuzzi coliumo",
    "donde alojar en coliumo",
    "cabañas cerca de los tres morros",
    "arriendo cabaña playa coliumo",
    "cabañas para familias tomé",
    // Keywords long-tail
    "cabañas baratas coliumo",
    "alojamiento cerca de dichato",
    "turismo coliumo chile",
    "vacaciones playa biobío",
    // Brand keywords
    "tres morros coliumo",
    "cabañas tres morros",
  ],
  
  authors: [{ name: "Cabañas Tres Morros Coliumo" }],
  creator: "Cabañas Tres Morros Coliumo",
  publisher: "Cabañas Tres Morros Coliumo",
  
  // Open Graph optimizado para compartir
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.tresmorroscoliumo.cl",
    siteName: "Cabañas Tres Morros Coliumo",
    title: "Cabañas en Coliumo | Arrienda Frente al Mar con Jacuzzi",
    description: "Escápate a Coliumo. Cabañas equipadas con vista al Pacífico, jacuzzi y acceso a la playa. Reserva online con pago seguro.",
    images: [
      {
        url: "/images/common/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Cabañas Tres Morros Coliumo - Vista aérea frente al mar",
        type: "image/jpeg",
      },
    ],
  },
  
  // Twitter Card optimizada
  twitter: {
    card: "summary_large_image",
    site: "@tresmorroscoliumo",
    creator: "@tresmorroscoliumo",
    title: "Cabañas en Coliumo | Frente al Mar con Jacuzzi",
    description: "Tu escape perfecto en la costa del Biobío. Reserva online.",
    images: ["/images/common/og-image.jpg"],
  },
  
  // Robots optimizado para indexación
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
      noimageindex: false,
    },
  },
  
  // Verificación de herramientas (agregar IDs reales)
  verification: {
    google: "tu-codigo-google-search-console", // TODO: Agregar código real
    // yandex: "tu-codigo-yandex",
    // bing: "tu-codigo-bing",
  },
  
  // Canonical y alternates
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://www.tresmorroscoliumo.cl",
    languages: {
      "es-CL": process.env.NEXT_PUBLIC_SITE_URL || "https://www.tresmorroscoliumo.cl",
    },
  },
  
  // Categoría del sitio
  category: "travel",
  
  // Información adicional
  other: {
    "geo.region": "CL-BI",
    "geo.placename": "Coliumo, Tomé",
    "geo.position": "-36.5689;-72.9575",
    "ICBM": "-36.5689, -72.9575",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL" className="scroll-smooth">
      <head>
        {/* JSON-LD Schema Markup para SEO Local y Rich Snippets */}
        <JsonLdSchema siteUrl={process.env.NEXT_PUBLIC_SITE_URL || "https://www.tresmorroscoliumo.cl"} />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <SocialFloatingButtons />
      </body>
    </html>
  );
}
