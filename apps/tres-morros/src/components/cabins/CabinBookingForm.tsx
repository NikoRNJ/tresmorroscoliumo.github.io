"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  cabinSlug: string;
  maxGuests: number;
}

export const CabinBookingForm = ({ cabinSlug, maxGuests }: Props) => {
  const router = useRouter();
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    partySize: 2,
    includeJacuzzi: true,
    guestName: "",
    guestEmail: "",
    phone: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const holdRes = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cabinSlug,
          startDate: form.startDate,
          endDate: form.endDate,
          partySize: form.partySize,
          includeJacuzzi: form.includeJacuzzi,
          guestName: form.guestName,
          guestEmail: form.guestEmail,
          phone: form.phone || undefined,
          notes: form.notes || undefined,
        }),
      });

      if (!holdRes.ok) {
        throw new Error("No pudimos tomar tu reserva. Intenta nuevamente.");
      }

      const holdData = (await holdRes.json()) as {
        bookingId: string;
        amountTotal: number;
      };

      const flowRes = await fetch("/api/payments/flow/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: holdData.bookingId,
        }),
      });

      if (!flowRes.ok) {
        throw new Error("No pudimos crear el link de pago.");
      }

      const flowData = (await flowRes.json()) as { checkoutUrl: string };
      router.push(flowData.checkoutUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-card"
    >
      <div>
        <label className="text-sm font-medium text-slate-700">Check-in</label>
        <input
          type="date"
          required
          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
          value={form.startDate}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, startDate: event.target.value }))
          }
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Check-out</label>
        <input
          type="date"
          required
          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
          value={form.endDate}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, endDate: event.target.value }))
          }
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">
          Cantidad de personas
        </label>
        <input
          type="number"
          min={1}
          max={maxGuests}
          required
          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
          value={form.partySize}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              partySize: Number(event.target.value),
            }))
          }
        />
      </div>
      <label className="flex items-center gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.includeJacuzzi}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              includeJacuzzi: event.target.checked,
            }))
          }
        />
        Agregar jacuzzi / sauna
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Nombre completo
          </label>
          <input
            required
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
            value={form.guestName}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, guestName: event.target.value }))
            }
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Correo electrónico
          </label>
          <input
            type="email"
            required
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
            value={form.guestEmail}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, guestEmail: event.target.value }))
            }
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">
          Teléfono (opcional)
        </label>
        <input
          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
          value={form.phone}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, phone: event.target.value }))
          }
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">
          Notas para el equipo (opcional)
        </label>
        <textarea
          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
          rows={3}
          value={form.notes}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, notes: event.target.value }))
          }
        />
      </div>
      {error && (
        <p className="rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? "Creando reserva..." : "Reservar con Flow"}
      </button>
    </form>
  );
};
