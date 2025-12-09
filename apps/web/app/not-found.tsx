import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Home, Search } from 'lucide-react';

/**
 * Página 404 personalizada
 * Diseño coherente con el tema oscuro del sitio
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center bg-dark-950">
      <Container className="text-center">
        {/* Número 404 grande */}
        <div className="mb-8">
          <h1 className="mb-2 text-9xl font-bold text-primary-400">404</h1>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-primary-500 to-transparent"></div>
        </div>

        {/* Mensaje */}
        <h2 className="mb-4 text-3xl font-semibold text-white">
          Página no encontrada
        </h2>
        <p className="mb-8 text-lg text-gray-400 max-w-2xl mx-auto">
          Lo sentimos, la página que buscas no existe o ha sido movida.
          Puedes volver al inicio o explorar nuestras cabañas.
        </p>

        {/* Botones de acción */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button variant="primary" size="lg" className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Volver al Inicio
            </Button>
          </Link>
          <Link href="/#cabanas">
            <Button variant="secondary" size="lg" className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Ver Cabañas
            </Button>
          </Link>
        </div>

        {/* Decoración adicional */}
        <div className="mt-16 text-sm text-gray-500">
          <p>¿Necesitas ayuda? <Link href="/#contacto" className="text-primary-400 hover:text-primary-300 transition-colors">Contáctanos</Link></p>
        </div>
      </Container>
    </div>
  );
}
