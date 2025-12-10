'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@core/lib/utils/format';
import {
  Users,
  Eye,
  TrendingUp,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  AlertCircle
} from 'lucide-react';

type VisitorMetrics = {
  today: { unique: number; total: number };
  week: { unique: number; total: number };
  month: { unique: number };
  byDay: Record<string, number>;
  topPages: Array<{ path: string; visits: number }>;
  devices: Record<string, number>;
};

type MetricsResponse = {
  statusCounts: Record<string, number>;
  monthlyRevenue: number;
  upcomingCheckins: number;
  flowErrorsLast7Days: number;
  recentFlowEvents: Array<{
    id: string;
    created_at: string;
    error_message: string | null;
  }>;
  visitors: VisitorMetrics;
  generatedAt: string;
};

export default function ReactAdminDashboard() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadMetrics = async () => {
      try {
        const response = await fetch('/api/admin/metrics', {
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || 'No se pudieron cargar las métricas');
        }
        if (mounted) {
          setMetrics(payload);
        }
      } catch (err) {
        if (mounted && !(err instanceof DOMException && err.name === 'AbortError')) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
        }
      }
    };

    loadMetrics();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        {error}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  const statusEntries = [
    { label: 'Pendientes', value: metrics.statusCounts.pending || 0 },
    { label: 'Pagadas', value: metrics.statusCounts.paid || 0 },
    { label: 'Expiradas', value: metrics.statusCounts.expired || 0 },
    { label: 'Canceladas', value: metrics.statusCounts.canceled || 0 },
  ];

  // Preparar métricas de visitantes
  const visitors = metrics.visitors || {
    today: { unique: 0, total: 0 },
    week: { unique: 0, total: 0 },
    month: { unique: 0 },
    topPages: [],
    devices: {},
  };

  // Calcular total de dispositivos para porcentajes
  const totalDevices = Object.values(visitors.devices).reduce((a, b) => a + b, 0);

  // Iconos de dispositivos
  const deviceIcons: Record<string, React.ReactNode> = {
    desktop: <Monitor className="h-4 w-4" />,
    mobile: <Smartphone className="h-4 w-4" />,
    tablet: <Tablet className="h-4 w-4" />,
    unknown: <Globe className="h-4 w-4" />,
  };

  // Nombres de rutas amigables
  const getPageName = (path: string): string => {
    const names: Record<string, string> = {
      '/': 'Inicio',
      '/cabanas': 'Cabañas',
      '/galeria': 'Galería',
      '/reservar': 'Reservar',
      '/contacto': 'Contacto',
    };
    if (path.startsWith('/cabanas/')) return 'Detalle Cabaña';
    return names[path] || path;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-sm font-semibold uppercase tracking-wide text-primary-600">
          Panel de métricas
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Visión general</h2>
        <p className="text-sm text-gray-500">
          Última actualización: {new Date(metrics.generatedAt).toLocaleString('es-CL')}
        </p>
      </div>

      {/* ============================================ */}
      {/* MÉTRICAS DE VISITANTES - SECCIÓN PRINCIPAL */}
      {/* ============================================ */}
      <div className="rounded-xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-primary-800">
          <Users className="h-5 w-5" />
          Visitantes del Sitio
        </h3>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Visitantes Hoy */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Hoy</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {visitors.today.unique}
                </p>
                <p className="text-xs text-gray-500">
                  visitantes únicos
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {visitors.today.total} visitas totales
            </p>
          </div>

          {/* Visitantes Semana */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Últimos 7 días</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {visitors.week.unique}
                </p>
                <p className="text-xs text-gray-500">
                  visitantes únicos
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {visitors.week.total} visitas totales
            </p>
          </div>

          {/* Visitantes Mes */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Este mes</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {visitors.month.unique}
                </p>
                <p className="text-xs text-gray-500">
                  visitantes únicos
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Top páginas y dispositivos */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Top Páginas */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h4 className="mb-3 font-semibold text-gray-800">Páginas más visitadas</h4>
            {visitors.topPages.length === 0 ? (
              <p className="text-sm text-gray-500">Sin datos aún</p>
            ) : (
              <ul className="space-y-2">
                {visitors.topPages.map((page, i) => (
                  <li key={page.path} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
                        {i + 1}
                      </span>
                      <span className="text-gray-700">{getPageName(page.path)}</span>
                    </span>
                    <span className="font-medium text-gray-900">{page.visits}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Distribución de Dispositivos */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h4 className="mb-3 font-semibold text-gray-800">Dispositivos</h4>
            {totalDevices === 0 ? (
              <p className="text-sm text-gray-500">Sin datos aún</p>
            ) : (
              <ul className="space-y-3">
                {Object.entries(visitors.devices).map(([device, count]) => {
                  const percentage = Math.round((count / totalDevices) * 100);
                  const deviceName = device === 'desktop' ? 'Escritorio' :
                    device === 'mobile' ? 'Móvil' :
                      device === 'tablet' ? 'Tablet' : 'Otro';
                  return (
                    <li key={device}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-700">
                          {deviceIcons[device] || deviceIcons.unknown}
                          {deviceName}
                        </span>
                        <span className="font-medium text-gray-900">{percentage}%</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-primary-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MÉTRICAS DE RESERVAS */}
      {/* ============================================ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Ingresos del mes" value={formatPrice(metrics.monthlyRevenue)} />
        <MetricCard label="Próximos check-in (7 días)" value={metrics.upcomingCheckins} />
        <MetricCard label="Errores Flow (7 días)" value={metrics.flowErrorsLast7Days} />
        <MetricCard label="Estados rastreados" value={Object.keys(metrics.statusCounts).length} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Estado de las reservas
          </h3>
          <ul className="mt-2 space-y-2">
            {statusEntries.map((entry) => (
              <li
                key={entry.label}
                className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-gray-700">{entry.label}</span>
                <span className="text-gray-900">{entry.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-lg font-semibold text-gray-900">Últimos eventos de Flow</h3>
          {metrics.recentFlowEvents.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">
              Sin incidencias en el periodo reciente 🎉
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {metrics.recentFlowEvents.map((event) => (
                <li key={event.id} className="rounded-md bg-gray-50 px-3 py-2 text-sm">
                  <p className="font-medium text-gray-800">
                    {event.error_message || 'Error registrado'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.created_at).toLocaleString('es-CL')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
