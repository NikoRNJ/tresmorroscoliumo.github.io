/**
 * Supabase Client para uso en el SERVIDOR (API Routes, Server Components)
 * Usa la SERVICE_ROLE key que tiene permisos completos
 * ⚠️ NUNCA exponer este cliente al navegador
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // Warn instead of throw to allow build to pass in environments where secrets are not available at build time
  console.warn(
    '⚠️ Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY). supabaseAdmin will fail if used.'
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
