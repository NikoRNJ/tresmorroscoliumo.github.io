import {
  HeroSection,
  AboutSection,
  BenefitsSection,
  ModelsSection,
  GallerySection,
  LocationSection,
  ContactSection,
} from "@/components/sections";

export default function Home() {
  return (
    <main className="relative">
      <HeroSection />
      <AboutSection />
      <BenefitsSection />
      <ModelsSection />
      <GallerySection />
      <LocationSection />
      <ContactSection />
    </main>
  );
}
