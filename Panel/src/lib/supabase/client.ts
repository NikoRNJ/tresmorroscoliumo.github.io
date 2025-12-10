// Cliente del navegador
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton para evitar múltiples instancias
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getClient() {
  if (!client) {
    client = createClient();
  }
  return client;
}
