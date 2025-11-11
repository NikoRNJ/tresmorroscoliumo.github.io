import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SeoProvider } from "@/components/seo/SeoProvider";
import { publicEnv } from "@/lib/public-env";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: "Tres Morros",
  description:
    "Cabañas Tres Morros de la Octava Región con jacuzzis y una experiencia única.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} bg-background text-foreground`}>
        <SeoProvider />
        <script
          defer
          data-domain={publicEnv.plausibleDomain}
          src="https://plausible.io/js/script.js"
        />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1 bg-brand-muted/30">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
