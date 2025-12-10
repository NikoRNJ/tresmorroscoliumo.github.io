import { cache } from 'react';
import { supabaseAdmin, isSupabaseConfigured } from '../supabase/server';
import type { Database } from '../../types/database';

type Cabin = Database['public']['Tables']['cabins']['Row'];

/**
 * Verifica si estamos en fase de build (no runtime)
 */
function isBuildPhase(): boolean {
  // NEXT_PHASE se establece durante el build
  return process.env.NEXT_PHASE === 'phase-production-build';
}

const fetchActiveCabins = async (): Promise<Cabin[]> => {
  // Durante el build, retornar array vacío para evitar errores de fetch
  if (isBuildPhase()) {
    console.log('[cabins] Build phase detected, skipping Supabase fetch');
    return [];
  }

  // Verificar si Supabase está configurado
  if (!isSupabaseConfigured()) {
    console.warn('[cabins] Supabase not configured, returning empty array');
    return [];
  }

  const startTime = Date.now();

  try {
    console.log('[cabins] Fetching active cabins from Supabase...');

    const { data, error } = await supabaseAdmin
      .from('cabins')
      .select('*')
      .eq('active', true)
      .order('slug', { ascending: true });

    const elapsed = Date.now() - startTime;

    if (error) {
      console.error('[cabins] Supabase error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        elapsed: `${elapsed}ms`,
      });
      return [];
    }

    console.log(`[cabins] Fetched ${data?.length ?? 0} cabins in ${elapsed}ms`);

    if (!data || data.length === 0) {
      console.warn('[cabins] No active cabins found in database');
    }

    return data || [];
  } catch (error) {
    const elapsed = Date.now() - startTime;

    // Detectar si es error de red (común en build time)
    const isNetworkError = error instanceof Error &&
      (error.message.includes('fetch failed') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ECONNREFUSED'));

    if (isNetworkError) {
      console.warn('[cabins] Network error (possibly build time):', error instanceof Error ? error.message : String(error));
    } else {
      console.error('[cabins] Unexpected error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        elapsed: `${elapsed}ms`,
      });
    }

    return [];
  }
};

const fetchCabinBySlug = async (slug: string): Promise<Cabin | null> => {
  if (isBuildPhase() || !isSupabaseConfigured()) {
    return null;
  }

  try {
    console.log(`[cabins] Fetching cabin by slug: ${slug}`);

    const { data, error } = await supabaseAdmin
      .from('cabins')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .limit(1);

    if (error) {
      console.error('[cabins] Error fetching cabin by slug:', {
        slug,
        message: error.message,
        code: error.code,
      });
      return null;
    }

    const cabin = (data?.[0] as Cabin) || null;
    console.log(`[cabins] Cabin "${slug}" found: ${cabin ? 'yes' : 'no'}`);

    return cabin;
  } catch (error) {
    console.error('[cabins] Unexpected error fetching cabin by slug:', {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

const fetchCabinSlugs = async (): Promise<string[]> => {
  if (isBuildPhase() || !isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('cabins')
      .select('slug')
      .eq('active', true);

    if (error) {
      console.error('[cabins] Error fetching cabin slugs:', error.message);
      return [];
    }

    return (data || []).map((cabin) => (cabin as { slug: string }).slug);
  } catch (error) {
    console.error('[cabins] Unexpected error fetching cabin slugs:', error);
    return [];
  }
};

export const getActiveCabins = cache(fetchActiveCabins);
export const getCabinBySlug = cache(fetchCabinBySlug);
export const getCabinSlugs = cache(fetchCabinSlugs);
