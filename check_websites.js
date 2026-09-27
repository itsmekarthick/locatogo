const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) require('dotenv').config({ path: '.env' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('listings').select('title, website').in('title', ['Crimsons Systems', 'SuperTech Institute', 'Awanti Technologies', 'EVpapa']).then(r => console.log(r.data));
