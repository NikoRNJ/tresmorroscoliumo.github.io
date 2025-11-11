import Link from "next/link";
import { CABINS } from "@/data/cabins";

const navigation = [
  { label: "Inicio", href: "/" },
  { label: "Cabañas", href: "/#cabanas" },
  { label: "Contacto", href: "/contacto" },
];

export const SiteHeader = () => (
  <header className="sticky top-0 z-40 bg-white/90 shadow-sm backdrop-blur">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Tres Morros
      </Link>
      <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="transition hover:text-brand-accent"
          >
            {item.label}
          </Link>
        ))}
        <div className="group relative">
          <span className="cursor-pointer transition group-hover:text-brand-accent">
            Catálogo
          </span>
          <div className="invisible absolute right-0 mt-3 flex w-60 flex-col rounded-xl border bg-white p-3 text-sm opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
            {CABINS.map((cabin) => (
              <Link
                key={cabin.slug}
                href={`/cabanas/${cabin.slug}`}
                className="rounded-lg px-3 py-2 hover:bg-brand-muted/40"
              >
                {cabin.name}
              </Link>
            ))}
          </div>
        </div>
        <Link
          href="/contacto"
          className="rounded-full bg-brand px-4 py-2 text-white transition hover:bg-brand-accent"
        >
          Reservar
        </Link>
      </nav>
      <Link
        href="/contacto"
        className="md:hidden rounded-full bg-brand px-4 py-2 text-white text-sm"
      >
        Reservar
      </Link>
    </div>
  </header>
);
