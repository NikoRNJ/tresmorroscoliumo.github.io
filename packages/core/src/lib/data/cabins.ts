import { cache } from 'react';
import { supabaseAdmin } from '../supabase/server';
import type { Database } from '../../types/database';

type Cabin = Database['public']['Tables']['cabins']['Row'];

const fetchActiveCabins = async (): Promise<Cabin[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('cabins')
      .select('*')
      .eq('active', true)
      .order('slug', { ascending: true });

    if (error) {
      console.error('Error fetching cabins:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching cabins:', error);
    return [];
  }
};

const fetchCabinBySlug = async (slug: string): Promise<Cabin | null> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('cabins')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .limit(1);

    if (error) {
      console.error('Error fetching cabin by slug:', error);
      return null;
    }

    return (data?.[0] as Cabin) || null;
  } catch (error) {
    console.error('Unexpected error fetching cabin by slug:', error);
    return null;
  }
};

const fetchCabinSlugs = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('cabins')
      .select('slug')
      .eq('active', true);

    if (error) {
      console.error('Error fetching cabin slugs:', error);
      return [];
    }

    return (data || []).map((cabin) => (cabin as { slug: string }).slug);
  } catch (error) {
    console.error('Unexpected error fetching cabin slugs:', error);
    return [];
  }
};

export const getActiveCabins = cache(fetchActiveCabins);
export const getCabinBySlug = cache(fetchCabinBySlug);
export const getCabinSlugs = cache(fetchCabinSlugs);
