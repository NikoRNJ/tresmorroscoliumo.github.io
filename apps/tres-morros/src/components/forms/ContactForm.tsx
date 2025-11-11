"use client";

import { useState } from "react";

export const ContactForm = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("No se pudo enviar tu mensaje");
      }

      setStatus("sent");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-card"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Nombre</label>
          <input
            required
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Correo</label>
          <input
            type="email"
            required
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
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
        <label className="text-sm font-medium text-slate-700">Mensaje</label>
        <textarea
          required
          rows={4}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
          value={form.message}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, message: event.target.value }))
          }
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-full bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-accent disabled:bg-slate-300"
      >
        {status === "sending" ? "Enviando..." : "Enviar mensaje"}
      </button>
      {status === "sent" && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          Gracias, te contactaremos muy pronto.
        </p>
      )}
      {status === "error" && (
        <p className="rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-700">
          Hubo un error al enviar. Inténtalo en un momento.
        </p>
      )}
    </form>
  );
};
