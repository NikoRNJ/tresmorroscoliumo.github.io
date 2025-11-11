import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { env } from "./env";

export const supabaseAdmin = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const cookieAdapter = () => {
  const cookieStore = cookies();
  return {
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
    set(name: string, value: string, options: CookieOptions) {
      cookieStore.set({ name, value, ...options });
    },
    remove(name: string, options: CookieOptions) {
      cookieStore.delete({ name, ...options });
    },
  };
};

export const createSupabaseServerClient = () =>
  createServerClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: cookieAdapter(),
    },
  );

export const getCurrentUserRole = async () => {
  const client = createSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { role: null, user: null };
  }

  const { data } = await client
    .from("user")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return { role: data?.role ?? null, user };
};
