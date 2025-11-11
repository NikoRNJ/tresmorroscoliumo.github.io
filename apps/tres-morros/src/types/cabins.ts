export type CabinSeo = {
  title: string;
  description: string;
  images: string[];
};

export type Cabin = {
  id: string;
  slug: string;
  name: string;
  headline: string;
  description: string;
  amenities: string[];
  heroImage: string;
  gallery: string[];
  nightlyRate: number;
  basePricePerNight: number;
  jacuzziRate: number;
  maxGuests: number;
  capacity: number;
  bedrooms: number;
  area: number;
  seo: CabinSeo;
};

export type CabinLight = Pick<
  Cabin,
  "id" | "slug" | "name" | "headline" | "heroImage" | "nightlyRate" | "maxGuests"
>;
