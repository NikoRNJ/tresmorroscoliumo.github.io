# 🎨 ITERACIÓN 2: Frontend Básico - Home y Páginas de Cabañas

**OBJETIVO:** Crear la estructura visual del sitio, página principal con catálogo de cabañas y páginas de detalle.

**DURACIÓN ESTIMADA:** 3-4 horas

**ESTADO:** 🔴 Pendiente

**DEPENDENCIAS:** Iteración 1 completada ✅

---

## **📋 PRE-REQUISITOS**

Antes de comenzar, verifica que:

- [ ] Iteración 1 está 100% completada
- [ ] `npm run dev` funciona sin errores
- [ ] Base de datos tiene las 3 cabañas
- [ ] Health check devuelve `status: ok`
- [ ] No hay errores de TypeScript (`npx tsc --noEmit`)

---

## **🎯 OBJETIVOS DE ESTA ITERACIÓN**

Al finalizar, deberás tener:

1. ✅ Layout principal con header y footer
2. ✅ Página de inicio (home) con grid de 3 cabañas
3. ✅ Páginas individuales para cada cabaña (`/cabanas/[slug]`)
4. ✅ Componentes reutilizables (CabinCard, Button, etc)
5. ✅ Navegación funcional entre páginas
6. ✅ Diseño responsive (móvil, tablet, desktop)
7. ✅ SEO básico configurado

---

## **PASO 1: Crear Layout Principal**

### **Archivo: `app/layout.tsx`**

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: 'Tres Morros de Coliumo - Cabañas en Coliumo',
    template: '%s | Tres Morros de Coliumo',
  },
  description:
    'Arrienda cabañas frente al mar en Coliumo, Región del Bío-Bío. Vegas del Coliumo, Caleta del Medio y Los Morros. Reserva online con pago seguro.',
  keywords: [
    'cabañas coliumo',
    'arriendo cabañas',
    'cabañas playa',
    'tres morros',
    'coliumo',
    'bío bío',
    'chile',
  ],
  authors: [{ name: 'Tres Morros de Coliumo' }],
  creator: 'NikoRNJ',
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: 'https://tresmorroscoliumo.cl',
    siteName: 'Tres Morros de Coliumo',
    title: 'Tres Morros de Coliumo - Cabañas en Coliumo',
    description: 'Arrienda cabañas frente al mar en Coliumo. Reserva online.',
    images: [
      {
        url: '/images/common/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Tres Morros de Coliumo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tres Morros de Coliumo',
    description: 'Arrienda cabañas frente al mar en Coliumo. Reserva online.',
    images: ['/images/common/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CL" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

---

## **PASO 2: Crear Header**

### **Archivo: `components/layout/Header.tsx`**

```typescript
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

/**
 * Header principal del sitio
 * - Logo y nombre
 * - Navegación principal
 * - Menú móvil responsivo
 */
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Inicio', href: '/' },
    { name: 'Cabañas', href: '/#cabanas' },
    { name: 'Contacto', href: '/contacto' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="text-xl font-bold text-primary-700">
              Tres Morros de Coliumo
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-semibold leading-6 text-gray-900 transition-colors hover:text-primary-600"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <Link
            href="/#cabanas"
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            Reservar ahora
          </Link>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="space-y-2 px-4 pb-4 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/#cabanas"
              className="block rounded-lg bg-primary-600 px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-primary-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Reservar ahora
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
```

---

## **PASO 3: Crear Footer**

### **Archivo: `components/layout/Footer.tsx`**

```typescript
import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';

/**
 * Footer del sitio con información de contacto y enlaces
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Columna 1: Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Tres Morros de Coliumo
            </h3>
            <p className="text-sm text-gray-600">
              Arrienda cabañas frente al mar en Coliumo, Región del Bío-Bío.
              Disfruta de la naturaleza y la tranquilidad.
            </p>
          </div>

          {/* Columna 2: Contacto */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Contacto</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />
                <span>Coliumo, Región del Bío-Bío, Chile</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary-600" />
                <a href="tel:+56912345678" className="hover:text-primary-600">
                  +56 9 1234 5678
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary-600" />
                <a
                  href="mailto:contacto@tresmorroscoliumo.cl"
                  className="hover:text-primary-600"
                >
                  contacto@tresmorroscoliumo.cl
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3: Enlaces */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Enlaces</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/" className="hover:text-primary-600">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/#cabanas" className="hover:text-primary-600">
                  Nuestras Cabañas
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-primary-600">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          <p>
            © {currentYear} Tres Morros de Coliumo. Todos los derechos reservados.
          </p>
          <p className="mt-1">
            Desarrollado por{' '}
            <a
              href="https://nikoder.lat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700"
            >
              NikoRNJ
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
```

---

## **PASO 4: Crear Componentes de UI Base**

### **Archivo: `components/ui/Button.tsx`**

```typescript
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

/**
 * Botón reutilizable con variantes y tamaños
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-md font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variants = {
      primary:
        'bg-primary-600 text-white hover:bg-primary-700 focus-visible:outline-primary-600',
      secondary:
        'bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:outline-secondary-600',
      outline:
        'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus-visible:outline-primary-600',
      ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:outline-gray-600',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="-ml-1 mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### **Archivo: `components/ui/Container.tsx`**

```typescript
import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Contenedor responsive con ancho máximo
 */
export function Container({ className, size = 'lg', children, ...props }: ContainerProps) {
  const sizes = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[1400px]',
  };

  return (
    <div className={cn('mx-auto px-4 lg:px-8', sizes[size], className)} {...props}>
      {children}
    </div>
  );
}
```

---

## **PASO 5: Crear Componente CabinCard**

### **Archivo: `components/cabin/CabinCard.tsx`**

```typescript
import Link from 'next/link';
import Image from 'next/image';
import { Users, DollarSign } from 'lucide-react';
import { formatPrice } from '@/lib/utils/format';
import type { Cabin } from '@/types/database';

interface CabinCardProps {
  cabin: Cabin;
  imageUrl?: string;
}

/**
 * Tarjeta de cabaña para mostrar en el listado
 * Muestra imagen, título, descripción y precio
 */
export function CabinCard({ cabin, imageUrl }: CabinCardProps) {
  // Imagen placeholder si no hay imagen real
  const displayImage = imageUrl || '/images/common/placeholder-cabin.jpg';

  return (
    <Link
      href={`/cabanas/${cabin.slug}`}
      className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg"
    >
      {/* Imagen */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Image
          src={displayImage}
          alt={cabin.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      {/* Contenido */}
      <div className="p-6">
        <h3 className="mb-2 text-xl font-bold text-gray-900 group-hover:text-primary-600">
          {cabin.title}
        </h3>

        <p className="mb-4 line-clamp-2 text-sm text-gray-600">{cabin.description}</p>

        {/* Info de capacidad y precio */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <Users className="h-4 w-4" />
            <span>
              {cabin.capacity_base}-{cabin.capacity_max} personas
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-lg font-bold text-primary-600">
            <DollarSign className="h-5 w-5" />
            <span>{formatPrice(cabin.base_price)}</span>
            <span className="text-sm font-normal text-gray-500">/noche</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

---

## **PASO 6: Crear Página Principal (Home)**

### **Archivo: `app/page.tsx`**

```typescript
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { CabinCard } from '@/components/cabin/CabinCard';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowRight, MapPin, Wifi, Coffee } from 'lucide-react';

/**
 * Página principal del sitio
 * - Hero section
 * - Grid de cabañas
 * - Características
 * - CTA
 */
export default async function HomePage() {
  // Fetch de cabañas activas desde Supabase
  const { data: cabins, error } = await supabase
    .from('cabins')
    .select('*')
    .eq('active', true)
    .order('base_price', { ascending: true });

  if (error) {
    console.error('Error fetching cabins:', error);
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 py-20 text-white lg:py-32">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-6xl">
              Tres Morros de Coliumo
            </h1>
            <p className="mb-8 text-lg text-primary-50 lg:text-xl">
              Disfruta de cabañas frente al mar en Coliumo, Región del Bío-Bío.
              Naturaleza, tranquilidad y confort en un solo lugar.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-primary-700 hover:bg-gray-50"
              >
                <Link href="#cabanas" className="flex items-center gap-2">
                  Ver Cabañas
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Link href="/contacto">Contactar</Link>
              </Button>
            </div>
          </div>
        </Container>

        {/* Decoración de fondo */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <svg className="absolute -bottom-10 -left-10 h-96 w-96" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="100" fill="currentColor" />
          </svg>
          <svg className="absolute -right-10 -top-10 h-96 w-96" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="100" fill="currentColor" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-b border-gray-200 bg-white py-12">
        <Container>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary-100 p-3">
                <MapPin className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-gray-900">Ubicación Privilegiada</h3>
                <p className="text-sm text-gray-600">
                  Frente al mar en Coliumo, con vistas espectaculares
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary-100 p-3">
                <Wifi className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-gray-900">Totalmente Equipadas</h3>
                <p className="text-sm text-gray-600">
                  WiFi, cocina completa, parrilla y todas las comodidades
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary-100 p-3">
                <Coffee className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-gray-900">Reserva Fácil</h3>
                <p className="text-sm text-gray-600">
                  Sistema de reserva online con pago seguro
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Cabins Grid */}
      <section id="cabanas" className="scroll-mt-20 bg-gray-50 py-16 lg:py-24">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">
              Nuestras Cabañas
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Tres opciones para disfrutar de Coliumo. Elige la cabaña que mejor se adapte a tus
              necesidades.
            </p>
          </div>

          {error && (
            <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-800">
              Error al cargar las cabañas. Por favor, intenta nuevamente.
            </div>
          )}

          {!cabins || cabins.length === 0 ? (
            <div className="text-center text-gray-600">
              No hay cabañas disponibles en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {cabins.map((cabin) => (
                <CabinCard key={cabin.id} cabin={cabin} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-16 text-white">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold">¿Listo para reservar?</h2>
            <p className="mb-8 text-lg text-primary-50">
              Elige tu cabaña favorita y disfruta de unas vacaciones inolvidables en Coliumo.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-primary-700 hover:bg-gray-50"
            >
              <Link href="#cabanas">Ver Cabañas Disponibles</Link>
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
```

---

## **PASO 7: Crear Página de Detalle de Cabaña**

### **Archivo: `app/cabanas/[slug]/page.tsx`**

```typescript
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase/client';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils/format';
import { Users, DollarSign, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CabinPageProps {
  params: {
    slug: string;
  };
}

/**
 * Generar metadata dinámica para SEO
 */
export async function generateMetadata({ params }: CabinPageProps): Promise<Metadata> {
  const { data: cabin } = await supabase
    .from('cabins')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!cabin) {
    return {
      title: 'Cabaña no encontrada',
    };
  }

  return {
    title: cabin.title,
    description: cabin.description || `Arrienda ${cabin.title} en Coliumo`,
    openGraph: {
      title: cabin.title,
      description: cabin.description || '',
      type: 'website',
    },
  };
}

/**
 * Generar rutas estáticas en build time
 */
export async function generateStaticParams() {
  const { data: cabins } = await supabase.from('cabins').select('slug');

  return (
    cabins?.map((cabin) => ({
      slug: cabin.slug,
    })) || []
  );
}

/**
 * Página de detalle de una cabaña específica
 */
export default async function CabinPage({ params }: CabinPageProps) {
  // Fetch de cabaña y sus imágenes
  const { data: cabin, error } = await supabase
    .from('cabins')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !cabin) {
    notFound();
  }

  // Parsear amenidades desde JSON
  const amenities = (cabin.amenities as string[]) || [];

  return (
    <div className="pb-16">
      {/* Header con breadcrumb */}
      <div className="border-b border-gray-200 bg-gray-50 py-6">
        <Container>
          <Link
            href="/#cabanas"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a cabañas
          </Link>
        </Container>
      </div>

      <Container className="pt-8">
        {/* Título y precio */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">{cabin.title}</h1>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary-600">
              {formatPrice(cabin.base_price)}
            </span>
            <span className="text-gray-600">por noche</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Columna principal (2/3) */}
          <div className="lg:col-span-2">
            {/* Imagen principal (placeholder por ahora) */}
            <div className="relative mb-8 aspect-[16/10] overflow-hidden rounded-lg bg-gray-200">
              <Image
                src="/images/common/placeholder-cabin.jpg"
                alt={cabin.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Descripción */}
            <div className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Descripción</h2>
              <p className="text-gray-700 leading-relaxed">{cabin.description}</p>
            </div>

            {/* Detalles adicionales */}
            {cabin.location_details && (
              <div className="mb-8">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">Ubicación</h2>
                <p className="text-gray-700 leading-relaxed">{cabin.location_details}</p>
              </div>
            )}

            {/* Amenidades */}
            {amenities.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">Amenidades</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary-600" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar (1/3) - Card de reserva */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-xl font-bold text-gray-900">Información de Reserva</h3>

              {/* Capacidad */}
              <div className="mb-4 flex items-center gap-2 text-gray-700">
                <Users className="h-5 w-5 text-primary-600" />
                <span>
                  Capacidad: {cabin.capacity_base} - {cabin.capacity_max} personas
                </span>
              </div>

              {/* Precios */}
              <div className="mb-6 space-y-2 border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Precio base</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(cabin.base_price)}/noche
                  </span>
                </div>
                {cabin.jacuzzi_price > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Jacuzzi (opcional)</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(cabin.jacuzzi_price)}/día
                    </span>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <Button className="w-full" size="lg">
                Reservar Ahora
              </Button>

              <p className="mt-4 text-center text-xs text-gray-500">
                Al reservar aceptas nuestros términos y condiciones
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
```

---

## **PASO 8: Crear Página 404 Personalizada**

### **Archivo: `app/not-found.tsx`**

```typescript
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Home, ArrowLeft } from 'lucide-react';

/**
 * Página 404 personalizada
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center">
      <Container className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-gray-900">404</h1>
        <h2 className="mb-6 text-2xl font-semibold text-gray-700">Página no encontrada</h2>
        <p className="mb-8 text-gray-600">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button variant="primary" size="lg">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Volver al inicio
            </Link>
          </Button>
          <Button variant="outline" size="lg">
            <Link href="/#cabanas" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Ver cabañas
            </Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}
```

---

## **PASO 9: Agregar Placeholder de Imágenes**

### **Crear imagen placeholder temporal:**

```bash
# Crear directorio de imágenes
mkdir -p public/images/common

# Descargar una imagen placeholder (o crear una simple)
# Por ahora, el proyecto mostrará el alt text si no hay imagen
```

### **Archivo: `public/images/common/.gitkeep`**

```
# Este archivo mantiene la carpeta en git
# Las imágenes reales se agregarán en la Iteración 3
```

---

## **PASO 10: Actualizar Globals CSS**

### **Archivo: `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply font-bold;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  /* Smooth scroll */
  html {
    @apply scroll-smooth;
  }

  /* Focus visible styles */
  *:focus-visible {
    @apply outline-2 outline-offset-2 outline-primary-600;
  }
}
```

---

## **✅ VALIDACIÓN DE LA ITERACIÓN 2**

### **Checklist de Validación:**

```bash
# 1. Compilar sin errores
npm run build

# 2. Iniciar servidor
npm run dev

# 3. Verificar páginas
# Abrir navegador en:
# - http://localhost:3000 (Home con grid de 3 cabañas)
# - http://localhost:3000/cabanas/vegas-del-coliumo
# - http://localhost:3000/cabanas/caleta-del-medio
# - http://localhost:3000/cabanas/los-morros
# - http://localhost:3000/no-existe (debe mostrar 404)

# 4. Verificar responsive
# - Abrir DevTools (F12)
# - Cambiar a vista móvil (Ctrl+Shift+M)
# - Verificar que el menú móvil funciona
# - Verificar que el grid se adapta

# 5. Verificar tipos
npx tsc --noEmit

# No debe mostrar errores
```

---

## **📝 CHECKLIST FINAL ITERACIÓN 2**

- [ ] Layout con Header y Footer creado
- [ ] Header con menú responsive funciona
- [ ] Footer con info de contacto visible
- [ ] Componentes UI base creados (Button, Container)
- [ ] CabinCard muestra info correcta
- [ ] Home page muestra las 3 cabañas
- [ ] Páginas de cabañas individuales funcionan
- [ ] Navegación entre páginas funciona
- [ ] Página 404 personalizada funciona
- [ ] Diseño responsive en móvil
- [ ] `npm run build` compila sin errores
- [ ] No hay errores de TypeScript
- [ ] No hay errores de consola en el navegador

---

## **🎯 PRÓXIMOS PASOS**

Si TODOS los checks están ✅:

```bash
git add .
git commit -m "feat: iteration 2 - frontend básico con home y páginas de cabañas"
git push origin main
```

**SIGUIENTE:** 03-ITERATION-3.md (Sistema de Calendario y Disponibilidad)

---

**ESTADO:** 🔴 Pendiente → 🟢 Completada  
**PRÓXIMO ARCHIVO:** AI-INSTRUCTIONS/03-ITERATION-3.md

---

**FIN DE LA ITERACIÓN 2**