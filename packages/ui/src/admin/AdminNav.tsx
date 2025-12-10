'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Home,
  Settings,
  LogOut,
  FileText,
  Images
} from 'lucide-react';
import { cn } from '@core/lib/utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Métricas', href: '/admin/dashboard', icon: Home },
  { name: 'Reservas', href: '/admin/reservas', icon: Calendar },
  { name: 'Media', href: '/admin/media', icon: FileText },
  { name: 'Galería', href: '/admin/galeria', icon: Images },
  { name: 'Bloqueos', href: '/admin/bloqueos', icon: FileText },
  { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
];

/**
 * Navegación lateral del panel de admin
 * Iteración 7: Panel de Administración
 */
export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="border-b border-gray-200 p-6">
        <h1 className="text-xl font-bold text-primary-700">
          Tres Morros
        </h1>
        <p className="text-sm text-gray-600">Panel de Admin</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
