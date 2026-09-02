import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data: techParks } = await supabase
    .from("listings")
    .select("id, title, locality, company_type")
    .or("title.ilike.%tech park%,title.ilike.%business park%,title.ilike.%wework%,title.ilike.%awfis%,title.ilike.%cowork%,title.ilike.%indiqube%,title.ilike.%innov8%,title.ilike.%bhive%,title.ilike.%91springboard%,title.ilike.%cowrks%")
    .limit(30);

  console.log("Tech Parks & Coworking matching count:", techParks?.length);
  console.log("Sample matches:", JSON.stringify(techParks?.slice(0, 10), null, 2));
}

main().catch(console.error);
