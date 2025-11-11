import { ContactForm } from "@/components/forms/ContactForm";

const ContactoPage = () => (
  <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-2">
    <div className="space-y-4">
      <p className="text-sm uppercase tracking-[0.5em] text-brand">Contacto</p>
      <h1 className="text-4xl font-semibold">Hablemos</h1>
      <p className="text-lg text-slate-600">
        Cuéntanos fechas tentativas, cantidad de personas y experiencias que
        te interesaría coordinar. Respondemos dentro del mismo día hábil.
      </p>
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <p className="text-sm font-semibold text-slate-600">Whatsapp</p>
        <p className="text-2xl font-semibold text-brand">+56 9 5555 9999</p>
        <p className="mt-4 text-sm font-semibold text-slate-600">Email</p>
        <p className="text-lg font-medium">reservas@tresmorros.cl</p>
      </div>
    </div>
    <ContactForm />
  </div>
);

export default ContactoPage;
