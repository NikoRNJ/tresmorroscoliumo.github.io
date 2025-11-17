import type { Metadata, Viewport } from "next";
import "./globals.css";
import "../sentry.client.config";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Tres Morros de Coliumo - Cabañas en Coliumo",
    template: "%s | Tres Morros de Coliumo",
  },
  description: "Arrienda cabañas frente al mar en Coliumo, Región del Bío-Bío. Vegas del Coliumo, Caleta del Medio y Los Morros. Reserva online con pago seguro. Desconéctate en la naturaleza.",
  keywords: [
    "cabañas coliumo",
    "arriendo cabañas",
    "cabañas playa",
    "tres morros",
    "coliumo",
    "bío bío",
    "chile",
    "vacaciones playa",
    "turismo rural",
    "naturaleza",
  ],
  authors: [{ name: "Tres Morros de Coliumo" }],
  creator: "NikoRNJ",
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "Tres Morros de Coliumo",
    title: "Tres Morros de Coliumo - Cabañas en Coliumo",
    description: "Arrienda cabañas frente al mar en Coliumo. Reserva online. Desconéctate de la ciudad y disfruta la naturaleza.",
    images: [
      {
        url: "/images/common/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Tres Morros de Coliumo - Cabañas frente al mar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tres Morros de Coliumo - Cabañas en Coliumo",
    description: "Arrienda cabañas frente al mar en Coliumo. Reserva online.",
    images: ["/images/common/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL" className="scroll-smooth">
      <body className="flex min-h-screen flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
