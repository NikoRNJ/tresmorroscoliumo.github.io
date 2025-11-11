import type { DefaultSeoProps } from "next-seo";
import { CABINS } from "@/data/cabins";
import { publicEnv } from "@/lib/public-env";

const baseUrl = publicEnv.siteUrl.replace(/\/$/, "");

export const defaultSeoConfig: DefaultSeoProps = {
  titleTemplate: "%s | Tres Morros",
  defaultTitle: "Retiro sostenible Tres Morros",
  description:
    "Tres cabañas boutique en la Región de Los Ríos con hot tub, chimenea y experiencias locales curadas.",
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: baseUrl,
    siteName: "Tres Morros",
    images: [
      {
        url: CABINS[0]?.heroImage ?? `${baseUrl}/og.jpg`,
        width: 1200,
        height: 630,
        alt: "Tres Morros",
      },
    ],
  },
  additionalMetaTags: [
    {
      name: "theme-color",
      content: "#0B3B3C",
    },
  ],
};

export const getCabinSeo = (slug: string) => {
  const cabin = CABINS.find((item) => item.slug === slug);
  if (!cabin) return undefined;
  return {
    title: cabin.seo.title,
    description: cabin.seo.description,
    openGraph: {
      url: `${baseUrl}/cabanas/${cabin.slug}`,
      title: cabin.seo.title,
      description: cabin.seo.description,
      images: cabin.seo.images.map((url) => ({
        url,
        width: 1200,
        height: 630,
        alt: cabin.name,
      })),
    },
  };
};
