import Link from 'next/link';
import { MapPin, Phone, Mail, Instagram, Facebook, MessageCircle } from 'lucide-react';

/**
 * Footer del sitio con información de contacto y enlaces
 * Adaptado al tema oscuro del proyecto
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/cabanastresmorrosdecoliumo',
      icon: Instagram,
      hoverColor: 'hover:text-pink-500 hover:bg-pink-500/10',
    },
    {
      name: 'Facebook',
      href: 'https://web.facebook.com/profile.php?id=61583396638851',
      icon: Facebook,
      hoverColor: 'hover:text-blue-500 hover:bg-blue-500/10',
    },
    {
      name: 'WhatsApp',
      href: 'https://wa.me/56966576206',
      icon: MessageCircle,
      hoverColor: 'hover:text-green-500 hover:bg-green-500/10',
    },
    {
      name: 'Gmail',
      href: 'mailto:cabanastresmorrosdecoliumo@gmail.com',
      icon: Mail,
      hoverColor: 'hover:text-red-500 hover:bg-red-500/10',
    },
  ];

  return (
    <footer className="bg-dark-900 border-t border-dark-800">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Columna 1: Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">
              Cabañas Tres Morros de Coliumo
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Cabañas familiares en Coliumo, cerca del mar y rodeadas de naturaleza.
              Un ambiente tranquilo y seguro para descansar, disfrutar en familia y explorar la belleza de la costa del Biobío.
            </p>
            {/* Redes sociales */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Síguenos en ${social.name}`}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border border-dark-700 bg-dark-800/50 text-gray-400 transition-all duration-300 ${social.hoverColor}`}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Columna 2: Contacto */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Contacto</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                <span>Avenida Los Morros 992, Coliumo, Región del Bío-Bío, Chile</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary-500" />
                <a href="tel:+56988661405" className="hover:text-primary-500 transition-colors">
                  +56 9 8866 1405
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary-500" />
                <a href="tel:+56984161963" className="hover:text-primary-500 transition-colors">
                  +56 9 8416 1963
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary-500" />
                <a
                  href="mailto:cabanastresmorrosdecoliumo@gmail.com"
                  className="hover:text-primary-500 transition-colors"
                >
                  cabanastresmorrosdecoliumo@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3: Enlaces */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Enlaces</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/" className="hover:text-primary-500 transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/#cabanas" className="hover:text-primary-500 transition-colors">
                  Nuestras Cabañas
                </Link>
              </li>
              <li>
                <Link href="/#contacto" className="hover:text-primary-500 transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-dark-800 pt-8 text-center text-sm text-gray-500">
          <p>
            © {currentYear} Tres Morros de Coliumo. Todos los derechos reservados.
          </p>
          <p className="mt-1">
            Desarrollado por{' '}
            <a
              href="https://nikoder.lat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-400 transition-colors"
            >
              NikoRNJ
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
