import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CABINS } from "@/data/cabins";
import { CabinGallery } from "@/components/cabins/CabinGallery";
import { CabinBookingForm } from "@/components/cabins/CabinBookingForm";
import { CabinAvailabilityPanel } from "@/components/cabins/CabinAvailabilityPanel";
import { formatClp } from "@/lib/pricing";
import { getCabinSeo } from "@/seo/config";
import { PageSeo } from "@/components/seo/PageSeo";

type Props = {
  params: { slug: string };
};

export const dynamicParams = false;

export async function generateStaticParams() {
  return CABINS.map((cabin) => ({ slug: cabin.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const cabin = CABINS.find((item) => item.slug === slug);
  if (!cabin) return {};
  return {
    title: cabin.seo.title,
    description: cabin.seo.description,
    openGraph: {
      images: cabin.seo.images.map((url) => ({
        url,
        width: 1200,
        height: 630,
      })),
    },
  };
}

const CabinPage = ({ params }: Props) => {
  const { slug } = params;
  const cabin = CABINS.find((item) => item.slug === slug);
  if (!cabin) notFound();

  const seo = getCabinSeo(slug);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {seo && <PageSeo {...seo} />}
      <div className="grid gap-8 md:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-8 shadow-card">
            <p className="text-sm uppercase tracking-[0.5em] text-brand">
              {cabin.headline}
            </p>
            <h1 className="mt-4 text-4xl font-semibold">{cabin.name}</h1>
            <p className="mt-4 text-lg text-slate-600">{cabin.description}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-700">
              {cabin.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-full bg-brand-muted/70 px-4 py-2"
                >
                  {amenity}
                </span>
              ))}
            </div>
            <div className="mt-6 text-lg font-semibold">
              {formatClp(cabin.nightlyRate)} / noche · {cabin.maxGuests} pax máx
            </div>
          </div>
          <CabinGallery images={cabin.gallery} />
          <CabinAvailabilityPanel cabinSlug={cabin.slug} />
        </div>
        <div className="space-y-6">
          <div className="relative h-64 overflow-hidden rounded-3xl">
            <Image
              src={cabin.heroImage}
              alt={cabin.name}
              fill
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-cover"
            />
          </div>
          <CabinBookingForm cabinSlug={cabin.slug} maxGuests={cabin.maxGuests} />
        </div>
      </div>
    </div>
  );
};

export default CabinPage;
