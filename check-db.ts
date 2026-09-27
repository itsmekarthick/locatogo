import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
const env: any = {};
fs.readFileSync(".env", "utf8").split(/\r?\n/).forEach(line => {
  const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('listings').select('*').eq('title', 'HouseCanary').then(r => console.log(JSON.stringify(r, null, 2)));
