'use client';

import { useState } from 'react';
import { Instagram, Facebook, X, Share2 } from 'lucide-react';

/**
 * Botones flotantes de redes sociales
 * Posicionados en la esquina inferior izquierda para no interferir con el scroll
 * Se colapsan en un botón único que se expande al hacer clic
 */
export function SocialFloatingButtons() {
  const [isExpanded, setIsExpanded] = useState(false);

  const socialLinks = [
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/cabanastresmorrosdecoliumo',
      icon: Instagram,
      bgColor: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
      hoverScale: 'hover:scale-110',
    },
    {
      name: 'Facebook',
      href: 'https://web.facebook.com/profile.php?id=61583396638851',
      icon: Facebook,
      bgColor: 'bg-blue-600',
      hoverScale: 'hover:scale-110',
    },
  ];

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col-reverse items-center gap-3">
      {/* Botones de redes sociales (aparecen cuando está expandido) */}
      <div
        className={`flex flex-col-reverse gap-3 transition-all duration-300 ${
          isExpanded
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {socialLinks.map((social, index) => (
          <a
            key={social.name}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Síguenos en ${social.name}`}
            className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 ${social.bgColor} ${social.hoverScale} hover:shadow-xl`}
            style={{
              transitionDelay: isExpanded ? `${index * 75}ms` : '0ms',
            }}
          >
            <social.icon className="h-5 w-5" />
          </a>
        ))}
      </div>

      {/* Botón principal para expandir/colapsar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? 'Cerrar redes sociales' : 'Ver redes sociales'}
        className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
          isExpanded
            ? 'bg-dark-800 text-gray-300 rotate-0'
            : 'bg-primary-600 text-white rotate-0 hover:bg-primary-700'
        } hover:scale-105 hover:shadow-xl`}
      >
        {isExpanded ? (
          <X className="h-6 w-6" />
        ) : (
          <Share2 className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}
