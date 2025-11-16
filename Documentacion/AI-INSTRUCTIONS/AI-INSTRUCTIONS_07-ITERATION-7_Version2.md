# 🔐 ITERACIÓN 7: Panel de Administración

**OBJETIVO:** Crear un panel de administración completo para gestionar reservas, cabañas, bloqueos y visualizar estadísticas del negocio.

**DURACIÓN ESTIMADA:** 6-7 horas

**ESTADO:** 🔴 Pendiente

**DEPENDENCIAS:** Iteración 6 completada ✅

---

## **📋 PRE-REQUISITOS**

Antes de comenzar, verifica que:

- [ ] Iteración 6 está 100% completada
- [ ] Sistema de emails funciona correctamente
- [ ] Base de datos tiene reservas de prueba
- [ ] No hay errores de TypeScript

---

## **🎯 OBJETIVOS DE ESTA ITERACIÓN**

Al finalizar, deberás tener:

1. ✅ Sistema de autenticación básico con contraseña
2. ✅ Dashboard con KPIs (ingresos, ocupación, próximas reservas)
3. ✅ Listado completo de reservas con filtros
4. ✅ Vista de detalle de cada reserva
5. ✅ Gestión de cabañas (editar precios, descripción, amenidades)
6. ✅ Upload de imágenes a Supabase Storage
7. ✅ Creación de bloqueos administrativos
8. ✅ Calendario de ocupación general
9. ✅ Exportación de datos (CSV)

---

## **PASO 1: Crear Sistema de Autenticación Simple**

### **Archivo: `lib/auth/admin.ts`**

```typescript
/**
 * Sistema de autenticación simple para el admin
 * 
 * IMPORTANTE: Este es un sistema básico. En producción se recomienda
 * usar un sistema más robusto como NextAuth.js o Supabase Auth.
 */

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas

if (!ADMIN_PASSWORD) {
  console.warn('⚠️ ADMIN_PASSWORD not set. Admin panel will not be accessible.');
}

/**
 * Hash de la contraseña con SHA256
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verificar si la contraseña es correcta
 */
export function verifyAdminPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  return hashPassword(password) === hashPassword(ADMIN_PASSWORD);
}

/**
 * Crear sesión de admin
 */
export async function createAdminSession(): Promise<string> {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  // Guardar en cookie
  cookies().set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return sessionToken;
}

/**
 * Verificar si hay sesión activa de admin
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME);
  
  // Por simplicidad, solo verificamos que exista la cookie
  // En producción, verificar contra una tabla de sesiones en DB
  return !!sessionToken;
}

/**
 * Cerrar sesión de admin
 */
export async function destroyAdminSession(): Promise<void> {
  cookies().delete(SESSION_COOKIE_NAME);
}

/**
 * Middleware para proteger rutas de admin
 */
export async function requireAdmin(): Promise<boolean> {
  const isAuthenticated = await isAdminAuthenticated();
  
  if (!isAuthenticated) {
    return false;
  }

  return true;
}
```

---

## **PASO 2: Crear Página de Login**

### **Archivo: `app/admin/login/page.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Lock, AlertCircle } from 'lucide-react';

/**
 * Página de login del panel de administración
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
```

---

## **PASO 3: Crear API de Login**

### **Archivo: `app/api/admin/login/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminPassword, createAdminSession } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/server';

const loginSchema = z.object({
  password: z.string().min(1, 'Contraseña requerida'),
});

/**
 * POST /api/admin/login
 * 
 * Autenticar admin
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = loginSchema.parse(body);

    // Verificar contraseña
    const isValid = verifyAdminPassword(password);

    if (!isValid) {
      // Log del intento fallido
      await supabaseAdmin.from('api_events').insert({
        event_type: 'admin_login_failed',
        event_source: 'system',
        payload: {
          timestamp: new Date().toISOString(),
          ip: request.headers.get('x-forwarded-for') || 'unknown',
        },
        status: 'error',
      });

      return NextResponse.json(
        { success: false, error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Crear sesión
    await createAdminSession();

    // Log del login exitoso
    await supabaseAdmin.from('api_events').insert({
      event_type: 'admin_login_success',
      event_source: 'system',
      payload: {
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      },
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin login:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
```

---

## **PASO 4: Crear Layout del Admin**

### **Archivo: `app/admin/layout.tsx`**

```typescript
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';
import { AdminNav } from '@/components/admin/AdminNav';

/**
 * Layout del panel de administración
 */
export default async function AdminLayout({
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
```

---

## **PASO 5: Crear Navegación del Admin**

### **Archivo: `components/admin/AdminNav.tsx`**

```typescript
'use client';

import Link from 'link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  Home, 
  Settings, 
  LogOut,
  FileText 
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Reservas', href: '/admin/reservas', icon: Calendar },
  { name: 'Cabañas', href: '/admin/cabanas', icon: Home },
  { name: 'Bloqueos', href: '/admin/bloqueos', icon: FileText },
  { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
];

/**
 * Navegación lateral del panel de admin
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
```

---

## **PASO 6: Crear Dashboard Principal**

### **Archivo: `app/admin/page.tsx`**

```typescript
import { supabaseAdmin } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils/format';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Users 
} from 'lucide-react';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Calcular estadísticas del mes actual
 */
async function getMonthlyStats() {
  const now = new Date();
  const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(now), 'yyyy-MM-dd');

  // Ingresos del mes (reservas pagadas)
  const { data: paidBookings } = await supabaseAdmin
    .from('bookings')
    .select('amount_total')
    .eq('status', 'paid')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const monthlyRevenue = paidBookings?.reduce((sum, b) => sum + b.amount_total, 0) || 0;

  // Reservas totales del mes
  const { count: totalBookings } = await supabaseAdmin
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'paid'])
    .gte('start_date', startDate);

  // Próximas reservas (próximos 7 días)
  const in7Days = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
  const { data: upcomingBookings } = await supabaseAdmin
    .from('bookings')
    .select('*, cabin:cabins(title)')
    .eq('status', 'paid')
    .gte('start_date', format(now, 'yyyy-MM-dd'))
    .lte('start_date', in7Days)
    .order('start_date', { ascending: true })
    .limit(5);

  // Tasa de ocupación (simplificada)
  const { data: allCabins } = await supabaseAdmin
    .from('cabins')
    .select('id')
    .eq('active', true);

  const totalCabins = allCabins?.length || 0;
  const daysInMonth = endOfMonth(now).getDate();
  const totalPossibleNights = totalCabins * daysInMonth;

  const { data: bookedNights } = await supabaseAdmin
    .from('bookings')
    .select('nights')
    .eq('status', 'paid')
    .gte('start_date', startDate)
    .lte('end_date', endDate);

  const totalBookedNights = bookedNights?.reduce((sum, b) => sum + (b.nights || 0), 0) || 0;
  const occupancyRate = totalPossibleNights > 0 
    ? Math.round((totalBookedNights / totalPossibleNights) * 100) 
    : 0;

  return {
    monthlyRevenue,
    totalBookings: totalBookings || 0,
    upcomingBookings: upcomingBookings || [],
    occupancyRate,
  };
}

/**
 * Dashboard principal del admin
 */
export default async function AdminDashboard() {
  const stats = await getMonthlyStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Resumen de {format(new Date(), "MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Ingresos del mes */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingresos del Mes</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatPrice(stats.monthlyRevenue)}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Reservas del mes */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reservas del Mes</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.totalBookings}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Tasa de ocupación */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasa de Ocupación</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.occupancyRate}%
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Próximas llegadas */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Próximas Llegadas</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.upcomingBookings.length}
              </p>
              <p className="text-xs text-gray-500">En los próximos 7 días</p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Próximas Reservas */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900">Próximas Llegadas</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.upcomingBookings.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hay reservas próximas en los siguientes 7 días
            </div>
          ) : (
            stats.upcomingBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-6">
                <div>
                  <p className="font-semibold text-gray-900">{booking.customer_name}</p>
                  <p className="text-sm text-gray-600">{booking.cabin.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {format(parseISO(booking.start_date), "d 'de' MMMM", { locale: es })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {booking.nights} noche{booking.nights !== 1 ? 's' : ''} · {booking.party_size} personas
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## **PASO 7: Crear Página de Listado de Reservas**

### **Archivo: `app/admin/reservas/page.tsx`**

```typescript
import { supabaseAdmin } from '@/lib/supabase/server';
import { formatPrice, formatDateRange } from '@/lib/utils/format';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

/**
 * Página de listado de reservas
 */
export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const statusFilter = searchParams.status || 'all';

  // Construir query
  let query = supabaseAdmin
    .from('bookings')
    .select('*, cabin:cabins(title, slug)')
    .order('created_at', { ascending: false });

  // Aplicar filtro de estado
  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: bookings, error } = await query;

  if (error) {
    console.error('Error fetching bookings:', error);
  }

  // Badges de estado
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      canceled: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendiente',
      paid: 'Pagada',
      expired: 'Expirada',
      canceled: 'Cancelada',
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
          <p className="mt-2 text-gray-600">
            Gestiona todas las reservas del sistema
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'Todas' },
          { value: 'paid', label: 'Pagadas' },
          { value: 'pending', label: 'Pendientes' },
          { value: 'expired', label: 'Expiradas' },
          { value: 'canceled', label: 'Canceladas' },
        ].map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/reservas?status=${filter.value}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === filter.value
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Referencia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Cabaña
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fechas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {!bookings || bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No hay reservas{statusFilter !== 'all' ? ` con estado "${getStatusLabel(statusFilter)}"` : ''}
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="font-mono text-sm font-medium text-gray-900">
                      {booking.id.substring(0, 8).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.customer_name}
                    </div>
                    <div className="text-sm text-gray-500">{booking.customer_email}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {booking.cabin.title}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {format(parseISO(booking.start_date), 'd MMM', { locale: es })} -{' '}
                      {format(parseISO(booking.end_date), 'd MMM yyyy', { locale: es })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {booking.nights} noche{booking.nights !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {formatPrice(booking.amount_total)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(
                        booking.status
                      )}`}
                    >
                      {getStatusLabel(booking.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <Link
                      href={`/admin/reservas/${booking.id}`}
                      className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
                    >
                      Ver detalles
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## **PASO 8: Crear Vista de Detalle de Reserva**

### **Archivo: `app/admin/reservas/[id]/page.tsx`**

```typescript
import { supabaseAdmin } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatPrice, formatDate } from '@/lib/utils/format';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, Calendar, Home, CreditCard } from 'lucide-react';

/**
 * Página de detalle de una reserva
 */
export default async function AdminBookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('*, cabin:cabins(*)')
    .eq('id', params.id)
    .single();

  if (error || !booking) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      paid: 'bg-green-100 text-green-800 border-green-200',
      expired: 'bg-gray-100 text-gray-800 border-gray-200',
      canceled: 'bg-red-100 text-red-800 border-red-200',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendiente de Pago',
      paid: 'Pagada y Confirmada',
      expired: 'Hold Expirado',
      canceled: 'Cancelada',
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/admin/reservas"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a reservas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Reserva #{booking.id.substring(0, 8).toUpperCase()}
            </h1>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getStatusBadge(
                booking.status
              )}`}
            >
              {getStatusLabel(booking.status)}
            </span>
          </div>
          <p className="mt-2 text-gray-600">
            Creada el {formatDate(booking.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Información del Cliente</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium text-gray-900">{booking.customer_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a
                    href={`mailto:${booking.customer_email}`}
                    className="font-medium text-primary-600 hover:text-primary-700"
                  >
                    {booking.customer_email}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <a
                    href={`tel:${booking.customer_phone}`}
                    className="font-medium text-gray-900"
                  >
                    {booking.customer_phone}
                  </a>
                </div>
              </div>
              {booking.customer_notes && (
                <div className="mt-4 rounded-md bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700">Notas del cliente:</p>
                  <p className="mt-1 text-sm text-gray-600">{booking.customer_notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Booking details */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Detalles de la Reserva</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Home className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Cabaña</p>
                  <Link
                    href={`/cabanas/${booking.cabin.slug}`}
                    target="_blank"
                    className="font-medium text-primary-600 hover:text-primary-700"
                  >
                    {booking.cabin.title}
                  </Link>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Fechas de estadía</p>
                  <p className="font-medium text-gray-900">
                    {format(parseISO(booking.start_date), "d 'de' MMMM", { locale: es })} -{' '}
                    {format(parseISO(booking.end_date), "d 'de' MMMM yyyy", { locale: es })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {booking.nights} noche{booking.nights !== 1 ? 's' : ''} · {booking.party_size}{' '}
                    persona{booking.party_size !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {booking.jacuzzi_days && Array.isArray(booking.jacuzzi_days) && booking.jacuzzi_days.length > 0 && (
                <div className="rounded-md bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-900">
                    Jacuzzi solicitado para {booking.jacuzzi_days.length} día
                    {booking.jacuzzi_days.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Payment info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <CreditCard className="h-5 w-5" />
              Información de Pago
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Precio base:</span>
                <span className="font-medium text-gray-900">
                  {formatPrice(booking.amount_base)}
                </span>
              </div>
              {booking.amount_jacuzzi > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Jacuzzi:</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(booking.amount_jacuzzi)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatPrice(booking.amount_total)}
                  </span>
                </div>
              </div>
              {booking.flow_order_id && (
                <div className="mt-4 rounded-md bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Flow Order ID:</p>
                  <p className="font-mono text-sm font-medium text-gray-900">
                    {booking.flow_order_id}
                  </p>
                </div>
              )}
              {booking.paid_at && (
                <div className="rounded-md bg-green-50 p-3">
                  <p className="text-xs text-green-700">Pagado el:</p>
                  <p className="text-sm font-medium text-green-900">
                    {formatDate(booking.paid_at)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Historial</h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Reserva creada</p>
                  <p className="text-xs text-gray-500">{formatDate(booking.created_at)}</p>
                </div>
              </div>
              {booking.paid_at && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-green-600"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pago confirmado</p>
                    <p className="text-xs text-gray-500">{formatDate(booking.paid_at)}</p>
                  </div>
                </div>
              )}
              {booking.canceled_at && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-red-600"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Cancelada</p>
                    <p className="text-xs text-gray-500">{formatDate(booking.canceled_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## **✅ VALIDACIÓN DE LA ITERACIÓN 7**

### **Checklist de Validación:**

```bash
# 1. Compilar sin errores
npm run build

# 2. Configurar contraseña de admin
# Agregar a .env.local:
ADMIN_PASSWORD=tu-contraseña-segura

# 3. Probar login
# Ir a http://localhost:3000/admin/login
# Ingresar la contraseña
# Debe redirigir a /admin

# 4. Verificar dashboard
# - Los KPIs deben mostrarse correctamente
# - Las estadísticas deben calcularse bien
# - Las próximas reservas deben aparecer

# 5. Verificar listado de reservas
# - Ir a /admin/reservas
# - Debe mostrar todas las reservas
# - Los filtros deben funcionar
# - Click en "Ver detalles" debe abrir la reserva

# 6. Verificar detalle de reserva
# - Toda la información debe mostrarse
# - Los datos del cliente deben ser correctos
# - El timeline debe reflejar el estado

# 7. Verificar tipos
npx tsc --noEmit
```

---

## **📝 CHECKLIST FINAL ITERACIÓN 7**

- [ ] Sistema de autenticación funciona
- [ ] Login protege rutas de admin
- [ ] Dashboard muestra KPIs correctos
- [ ] Estadísticas se calculan bien
- [ ] Listado de reservas funciona
- [ ] Filtros de reservas funcionan
- [ ] Vista de detalle muestra toda la info
- [ ] Navegación lateral funciona
- [ ] Logout funciona correctamente
- [ ] Design es responsive
- [ ] No hay errores de TypeScript
- [ ] No hay errores en consola

---

## **🎯 PRÓXIMOS PASOS**

Si TODOS los checks están ✅:

```bash
git add .
git commit -m "feat: iteration 7 - panel de administración básico"
git push origin main
```

**SIGUIENTE:** 08-ITERATION-8.md (Deploy en DigitalOcean)

---

**ESTADO:** 🔴 Pendiente → 🟢 Completada  
**PRÓXIMO ARCHIVO:** AI-INSTRUCTIONS/08-ITERATION-8.md

---

**FIN DE LA ITERACIÓN 7**