import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';
import { AdminNav } from '@/components/admin/AdminNav';

/**
 * Layout para las páginas protegidas del panel de administración
 * Requiere autenticación para acceder
 * 
 * Iteración 7: Panel de Administración
 */
export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = await requireAdmin();

  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminNav />

      {/* Main content */}
      <div className="flex-1">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
