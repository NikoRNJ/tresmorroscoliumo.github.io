import ReactAdminDashboard from './ReactAdminDashboard';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <ReactAdminDashboard />
    </div>
  );
}

