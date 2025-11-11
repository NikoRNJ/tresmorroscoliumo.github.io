import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(10),
  SUPABASE_SERVICE_ROLE: z.string().min(10),
  FLOW_API_KEY: z.string().min(5),
  FLOW_API_SECRET: z.string().min(10),
  FLOW_BASE_URL: z.string().url(),
  FLOW_COMMERCE_ID: z.string().min(2),
  SENDGRID_API_KEY: z.string().min(5),
  SENDGRID_FROM_EMAIL: z.string().email(),
  CONTACT_TO_EMAIL: z.string().email(),
});

type EnvShape = z.infer<typeof envSchema>;

declare global {
  // eslint-disable-next-line no-var
  var __envCache: EnvShape | undefined;
}

export const env: EnvShape =
  globalThis.__envCache ??
  (() => {
    const parsed = envSchema.safeParse({
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE,
      FLOW_API_KEY: process.env.FLOW_API_KEY,
      FLOW_API_SECRET: process.env.FLOW_API_SECRET,
      FLOW_BASE_URL: process.env.FLOW_BASE_URL,
      FLOW_COMMERCE_ID: process.env.FLOW_COMMERCE_ID,
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
      SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
      CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
    });

    if (!parsed.success) {
      throw new Error(
        `Invalid environment variables: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
      );
    }

    globalThis.__envCache = parsed.data;
    return parsed.data;
  })();
