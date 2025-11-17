'use client';

import { useEffect, useState } from 'react';
import {
  AdminContext,
  AdminUI,
  Layout,
  type DashboardProps,
} from 'react-admin';
import { formatPrice } from '@core/lib/utils/format';

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
  generatedAt: string;
};

const noopDataProvider = {};

function MetricsDashboard(_props: DashboardProps) {
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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          React Admin · Métricas en vivo
        </h2>
        <p className="text-sm text-gray-500">
          Última actualización: {new Date(metrics.generatedAt).toLocaleString('es-CL')}
        </p>
      </div>

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

export default function ReactAdminDashboard() {
  return (
    <AdminContext dataProvider={noopDataProvider}>
      <AdminUI layout={Layout} dashboard={MetricsDashboard} disableTelemetry>
        <></>
      </AdminUI>
    </AdminContext>
  );
}

