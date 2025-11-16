import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('cabins')
      .select('id, slug, title, base_price, jacuzzi_price, capacity_base, capacity_max, price_per_extra_person')
      .eq('active', true)
      .order('slug', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ cabins: data || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}