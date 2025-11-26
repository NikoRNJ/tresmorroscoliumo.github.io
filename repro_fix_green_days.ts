import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars. Make sure .env.local exists and contains NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper functions to replace date-fns
function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
}

function subMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() - minutes * 60000);
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

async function run() {
    console.log('--- Starting Reproduction Script ---');

    // 1. Get a cabin ID
    const { data: cabins } = await supabase.from('cabins').select('id').limit(1);
    if (!cabins || cabins.length === 0) {
        console.error('No cabins found');
        return;
    }
    const cabinId = cabins[0].id;
    console.log(`Using cabin: ${cabinId}`);

    // 2. Define dates (tomorrow + 1 night)
    const tomorrow = addDays(new Date(), 1);
    const dayAfter = addDays(new Date(), 2);
    const startDate = formatDate(tomorrow);
    const endDate = formatDate(dayAfter);
    console.log(`Testing range: ${startDate} to ${endDate}`);

    // 3. Clean up any existing bookings for this range (for clean state)
    await supabase.from('bookings').delete().eq('cabin_id', cabinId).eq('start_date', startDate);

    // 4. Create an EXPIRED pending booking
    // This simulates a user who started booking but abandoned it, and the time passed.
    const expiredDate = subMinutes(new Date(), 10).toISOString(); // Expired 10 mins ago

    const { data: expiredBooking, error: createError } = await supabase.from('bookings').insert({
        cabin_id: cabinId,
        start_date: startDate,
        end_date: endDate,
        party_size: 2,
        status: 'pending',
        amount_base: 10000,
        amount_total: 10000,
        customer_name: 'Expired User',
        customer_email: 'expired@test.com',
        customer_phone: '12345678',
        expires_at: expiredDate
    }).select().single();

    if (createError) {
        console.error('Failed to create setup booking:', createError);
        return;
    }
    console.log(`Created EXPIRED booking: ${expiredBooking.id} (Expires: ${expiredBooking.expires_at})`);

    // 5. Attempt to create a NEW booking for the same dates via the API logic
    // We will simulate what the API does: check conflicts, then insert.

    console.log('\n--- Attempting to create NEW booking (Simulating API) ---');

    // API Step 1: Check conflicts
    const { data: conflicts } = await supabase
        .from('bookings')
        .select('id, status, expires_at')
        .eq('cabin_id', cabinId)
        .in('status', ['pending', 'paid'])
        .lt('start_date', endDate)
        .gt('end_date', startDate);

    console.log('Conflicts found by API query:', conflicts?.length);

    // API Step 2: Filter expired (The API *should* ignore expired ones)
    const activeConflicts = conflicts?.filter(b => {
        if (b.status === 'paid') return true;
        if (b.status === 'pending' && b.expires_at) {
            return new Date(b.expires_at) > new Date(); // Is future?
        }
        return false;
    });

    console.log('Active conflicts after filtering:', activeConflicts?.length);

    if (activeConflicts && activeConflicts.length > 0) {
        console.log('API would return 409 Conflict (Correct behavior if valid conflict exists)');
    } else {
        console.log('API sees NO conflicts. Proceeding to INSERT...');

        // API Step 3: Insert new booking
        const { data: newBooking, error: insertError } = await supabase.from('bookings').insert({
            cabin_id: cabinId,
            start_date: startDate,
            end_date: endDate,
            party_size: 2,
            status: 'pending',
            amount_base: 10000,
            amount_total: 10000,
            customer_name: 'New User',
            customer_email: 'new@test.com',
            customer_phone: '12345678',
            expires_at: addMinutes(new Date(), 20).toISOString()
        }).select();

        if (insertError) {
            console.error('❌ INSERT FAILED (The Bug):', insertError.message);
            console.log('Reason: Database exclusion constraint prevents overlap even if we think it is safe.');
        } else {
            console.log('✅ INSERT SUCCESS (The Fix works!)');
        }
    }
}

run();
