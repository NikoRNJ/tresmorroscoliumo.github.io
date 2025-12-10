import { Hero } from '@/components/sections/home/Hero';
import { PurposeSection } from '@/components/sections/home/PurposeSection';
import { CabinsSection } from '@/components/features/cabins/CabinsSection';
import { Gallery } from '@/components/features/gallery/Gallery';
import { LocationSection } from '@/components/sections/home/LocationSection';
import { ContactForm } from '@/components/forms/ContactForm';
import { getActiveCabins } from '@/lib/data/cabins';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const cabins = await getActiveCabins();

  return (
    <main className="min-h-screen bg-dark-950">
      <Hero />
      <PurposeSection />
      <CabinsSection cabins={cabins} />
      <Gallery />
      <LocationSection />
      <ContactForm />
    </main>
  );
}
