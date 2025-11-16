import { config } from 'dotenv';

config({ path: '.env', override: false });
config({ path: '.env.local', override: false });
config({ path: './apps/web/.env.local', override: false });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function clearTable(table) {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    throw new Error(`No se pudo limpiar ${table}: ${error.message}`);
  }

  console.log(`✅ ${table}: ${count ?? 0} registros eliminados`);
}

async function main() {
  try {
    await clearTable('api_events');
    await clearTable('admin_blocks');
    await clearTable('bookings');
    console.log('Reservas, eventos y bloqueos limpiados.');
    process.exit(0);
  } catch (error) {
    console.error('Error limpiando reservas:', error);
    process.exit(1);
  }
}

main();

