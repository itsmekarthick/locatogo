import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env: Record<string, string> = {};
fs.readFileSync(".env", "utf8")
  .split("\n")
  .forEach((line) => {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m) {
      let v = m[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      env[m[1]] = v;
    }
  });

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const domainId = "461e4ee7-7a16-43b3-b342-5a968e44f306";
  const { data: globalCat } = await supabase
    .from("categories")
    .select("id")
    .is("domain_id", null)
    .eq("slug", "tech-coworking")
    .single();

  const { count: catCount } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("domain_id", domainId)
    .eq("category_id", globalCat?.id);

  console.log("Bangalore listings with tech-coworking category:", catCount);

  const { data: curated } = await supabase
    .from("listings")
    .select("id, title, company_type, active_jobs_count, careers_url")
    .eq("domain_id", domainId)
    .eq("category_id", globalCat?.id)
    .order("active_jobs_count", { ascending: false });

  console.log("Sample curated listings:", curated?.slice(0, 15));
}

main().catch(console.error);
