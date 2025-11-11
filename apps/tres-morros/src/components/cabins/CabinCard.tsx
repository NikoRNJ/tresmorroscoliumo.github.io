import Image from "next/image";
import Link from "next/link";
import type { CabinLight } from "@/types/cabins";
import { formatClp } from "@/lib/pricing";

interface Props {
  cabin: CabinLight;
}

export const CabinCard = ({ cabin }: Props) => (
  <Link
    href={`/cabanas/${cabin.slug}`}
    className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-card transition hover:-translate-y-1 hover:shadow-2xl"
  >
    <div className="relative h-60 w-full">
      <Image
        src={cabin.heroImage}
        alt={cabin.name}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition duration-300 group-hover:scale-105"
      />
    </div>
    <div className="flex flex-1 flex-col gap-2 px-6 py-6">
      <div className="flex items-center justify-between text-sm uppercase tracking-[0.25em] text-brand">
        {cabin.headline}
        <span>{cabin.maxGuests} pax</span>
      </div>
      <h3 className="text-2xl font-semibold">{cabin.name}</h3>
      <p className="text-sm text-slate-600">
        {formatClp(cabin.nightlyRate)} / noche
      </p>
    </div>
  </Link>
);
