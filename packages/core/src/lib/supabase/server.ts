/**
 * Supabase Client para uso en el SERVIDOR (API Routes, Server Components)
 * Usa la SERVICE_ROLE key que tiene permisos completos
 * ⚠️ NUNCA exponer este cliente al navegador
 * 
 * IMPORTANTE: El cliente se crea con inicialización lazy para evitar
 * errores durante el build de Next.js en Digital Ocean.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

// Singleton para el cliente de Supabase
let _supabaseAdmin: SupabaseClient<Database> | null = null;

/**
 * Obtiene o crea el cliente de Supabase Admin
 * Inicialización lazy para evitar errores en build time
 */
function getSupabaseAdmin(): SupabaseClient<Database> {
  // Si ya existe, retornarlo
  if (_supabaseAdmin) {
    return _supabaseAdmin;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validar variables de entorno
  if (!supabaseUrl || !supabaseServiceKey) {
    // Durante build time, retornar un cliente placeholder que fallará gracefully
    console.warn(
      '⚠️ [supabase] Variables de entorno no disponibles. Esto es normal durante el build.'
    );

    // Crear cliente con valores dummy que fallará en cualquier operación
    return createClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  // Crear el cliente real
  _supabaseAdmin = createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  console.log('[supabase] Cliente admin inicializado correctamente');

  return _supabaseAdmin;
}

/**
 * Cliente de Supabase con permisos de admin
 * SOLO usar en:
 * - API Routes (app/api/*)
 * - Server Components
 * - Server Actions
 * 
 * ⚠️ NUNCA importar en componentes con 'use client'
 * 
 * Nota: Este es un getter que crea el cliente bajo demanda,
 * evitando errores durante el build de Next.js.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

/**
 * Verifica si el cliente de Supabase está correctamente configurado
 */
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
