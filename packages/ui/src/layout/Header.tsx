'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

/**
 * Header principal del sitio con navegación sticky
 * Adaptado al tema oscuro existente del proyecto
 */
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Inicio', href: '/' },
    { name: 'Cabañas', href: '/#cabanas' },
    { name: 'Galería', href: '/#galeria' },
    { name: 'Ubicación', href: '/#ubicacion' },
    { name: 'Contacto', href: '/#contacto' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-dark-800/50 bg-dark-950/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 transition-opacity hover:opacity-80">
            <span className="text-xl font-bold text-primary-400">
              Cabañas Tres Morros de Coliumo
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-300 transition-colors hover:text-primary-400"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
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
              className="text-sm font-medium text-gray-300 transition-colors hover:text-primary-400"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <Link
            href="/#cabanas"
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md hover:shadow-primary-500/20"
          >
            Reservar Ahora
          </Link>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="space-y-1 border-t border-dark-800/50 bg-dark-900/50 px-4 pb-4 pt-2 backdrop-blur-sm">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-gray-300 transition-colors hover:bg-dark-800/50 hover:text-primary-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/#cabanas"
              className="block rounded-lg bg-primary-600 px-3 py-2.5 text-base font-semibold text-white transition-all hover:bg-primary-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Reservar Ahora
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
