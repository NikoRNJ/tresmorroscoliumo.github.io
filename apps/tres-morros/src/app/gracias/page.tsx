import { supabaseAdmin } from "@/lib/supabase";
import { formatClp } from "@/lib/pricing";

type Props = {
  searchParams: { bookingId?: string };
};

const statusCopy: Record<string, { title: string; description: string }> = {
  paid: {
    title: "Reserva confirmada",
    description:
      "Te enviamos un correo con todos los detalles y accesos. ¡Nos vemos pronto!",
  },
  pending: {
    title: "Pago en revisión",
    description:
      "Tu pago está en proceso. Apenas Flow nos confirme, recibirás un correo.",
  },
  hold: {
    title: "Reserva en hold",
    description:
      "Bloqueamos la disponibilidad por 20 minutos. Completa el pago o contáctanos si necesitas ayuda.",
  },
  canceled: {
    title: "Pago cancelado",
    description:
      "No recibimos la confirmación de Flow. Reintenta o escríbenos para asistirte.",
  },
};

const GraciasPage = async ({ searchParams }: Props) => {
  const bookingId = searchParams.bookingId;

  if (!bookingId) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12 text-center">
        <h1 className="text-3xl font-semibold">Reserva no encontrada</h1>
        <p className="mt-4 text-slate-600">
          Agrega el parámetro bookingId al enlace entregado por Flow.
        </p>
      </div>
    );
  }

  const { data: booking } = await supabaseAdmin
    .from("booking")
    .select("status, amount_total, guest_name, cabin_slug")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12 text-center">
        <h1 className="text-3xl font-semibold">Reserva no encontrada</h1>
        <p className="mt-4 text-slate-600">
          Si pagaste exitosamente, responde el correo de confirmación y lo
          resolveremos al tiro.
        </p>
      </div>
    );
  }

  const copy = statusCopy[booking.status] ?? statusCopy.pending;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <div className="rounded-3xl bg-white px-8 py-10 shadow-card">
        <p className="text-sm uppercase tracking-[0.5em] text-brand">
          Flow · Supabase
        </p>
        <h1 className="mt-4 text-4xl font-semibold">{copy.title}</h1>
        <p className="mt-4 text-slate-600">{copy.description}</p>
        <dl className="mt-8 space-y-3 text-left text-slate-700">
          <div className="flex justify-between">
            <dt>Cabina</dt>
            <dd className="font-semibold">{booking.cabin_slug}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Nombre</dt>
            <dd className="font-semibold">{booking.guest_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Monto</dt>
            <dd className="font-semibold">
              {formatClp(Number(booking.amount_total))}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default GraciasPage;
