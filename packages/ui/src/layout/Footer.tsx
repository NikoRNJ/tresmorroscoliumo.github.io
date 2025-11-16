import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';

/**
 * Footer del sitio con información de contacto y enlaces
 * Adaptado al tema oscuro del proyecto
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-900 border-t border-dark-800">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Columna 1: Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">
              Tres Morros de Coliumo
            </h3>
            <p className="text-sm text-gray-400">
              Arrienda cabañas frente al mar en Coliumo, Región del Bío-Bío.
              Disfruta de la naturaleza y la tranquilidad.
            </p>
          </div>

          {/* Columna 2: Contacto */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Contacto</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                <span>Coliumo, Región del Bío-Bío, Chile</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary-500" />
                <a href="tel:+56912345678" className="hover:text-primary-500 transition-colors">
                  +56 9 1234 5678
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary-500" />
                <a
                  href="mailto:contacto@tresmorroscoliumo.cl"
                  className="hover:text-primary-500 transition-colors"
                >
                  contacto@tresmorroscoliumo.cl
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
