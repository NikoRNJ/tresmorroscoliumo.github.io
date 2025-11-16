'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Lock, AlertCircle } from 'lucide-react';

/**
 * Página de login del panel de administración
 * Iteración 7: Panel de Administración
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Contraseña incorrecta');
        return;
      }

      // Redirigir al dashboard
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError('Error al iniciar sesión');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Container size="sm">
        <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <Lock className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="mt-2 text-sm text-gray-600">
              Tres Morros de Coliumo
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Ingresa tu contraseña"
                required
                autoFocus
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <div className="mt-6 rounded-md bg-blue-50 p-4 text-xs text-blue-800">
            <p className="font-semibold">🔒 Acceso Seguro</p>
            <p className="mt-1">
              Solo personal autorizado puede acceder a este panel.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
