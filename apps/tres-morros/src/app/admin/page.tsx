import { redirect } from "next/navigation";
import { getCurrentUserRole } from "@/lib/supabase";

const AdminPage = async () => {
  const { role, user } = await getCurrentUserRole();
  if (role !== "admin" || !user) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="rounded-3xl bg-white p-8 shadow-card">
        <p className="text-sm uppercase tracking-[0.5em] text-brand">Admin</p>
        <h1 className="mt-4 text-3xl font-semibold">
          Panel React Admin (Dic)
        </h1>
        <p className="mt-4 text-slate-600">
          Usuario: {user.email} · rol {role}
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-slate-700">
          <li>TODO: montar React Admin sobre /api/admin/*</li>
          <li>TODO: endpoints para confirmar pagos manuales</li>
          <li>TODO: sincronizar bloqueos masivos desde Google Calendar</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminPage;
