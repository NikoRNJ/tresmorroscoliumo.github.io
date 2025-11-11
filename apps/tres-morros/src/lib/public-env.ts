import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string(),
});

const parsed = publicSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
});

if (!parsed.success) {
  throw new Error(
    `Invalid public env: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
  );
}

export const publicEnv = {
  siteUrl: parsed.data.NEXT_PUBLIC_SITE_URL,
  plausibleDomain: parsed.data.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
};
