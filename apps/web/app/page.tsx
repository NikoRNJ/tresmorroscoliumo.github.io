import { Hero } from '@/components/cabin/Hero';
import { PurposeSection } from '@/components/cabin/PurposeSection';
import { CabinsSection } from '@/components/cabin/CabinsSection';
import { Gallery } from '@/components/cabin/Gallery';
import { LocationSection } from '@/components/cabin/LocationSection';
import { ContactForm } from '@/components/forms/ContactForm';
import { getActiveCabins } from '@/lib/data/cabins';

export const dynamic = 'force-static';
export const fetchCache = 'force-cache';
export const revalidate = false;

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
