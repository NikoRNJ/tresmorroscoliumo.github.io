/**
 * Supabase Client para uso en el SERVIDOR (API Routes, Server Components)
 * Usa la SERVICE_ROLE key que tiene permisos completos
 * ⚠️ NUNCA exponer este cliente al navegador
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  );
}

/**
 * Cliente de Supabase con permisos de admin
 * SOLO usar en:
 * - API Routes (app/api/*)
 * - Server Components
 * - Server Actions
 * 
 * ⚠️ NUNCA importar en componentes con 'use client'
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
