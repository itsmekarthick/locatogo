const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { count } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('country_code', 'IN').ilike('short_description', '%Verified software & IT enterprise%');
  console.log('COUNT:', count);
  
  const { count: c2 } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('country_code', 'IN');
  console.log('TOTAL IN:', c2);
  
  process.exit(0);
}
run();
