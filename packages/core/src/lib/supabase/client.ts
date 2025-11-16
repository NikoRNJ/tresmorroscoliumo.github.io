/**
 * Supabase Client para uso en el CLIENTE (Browser)
 * Solo usa la ANON key que es segura para exponer
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

// Validar que las variables de entorno existen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

/**
 * Cliente de Supabase para usar en componentes del cliente
 * @example
 * import { supabase } from '@core/lib/supabase/client'
 * const { data } = await supabase.from('cabins').select('*')
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // No necesitamos sesiones de usuario por ahora
  },
});
