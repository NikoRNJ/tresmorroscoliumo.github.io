/**
 * Página 404 personalizada
 */
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-white mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-white mb-4">
          Página No Encontrada
        </h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <Link href="/">
          <Button size="lg">
            <Home className="mr-2 h-5 w-5" />
            Volver al Inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}
