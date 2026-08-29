import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xpqizarctxbexawnzogb.supabase.co";
const supabaseKey = "sb_publishable_XFsYigKpFPQhMK9X73FBSQ_K25rV-xm";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: domains, error: dErr } = await supabase.from("domains").select("*");
  console.log("Domains:", domains?.length, dErr || "");
  
  const { data: categories, error: cErr } = await supabase.from("categories").select("*");
  console.log("Categories:", JSON.stringify(categories, null, 2));

  const { count: listingCount } = await supabase.from("listings").select("*", { count: "exact", head: true });
  console.log("Total Listings Count:", listingCount);
}

main();

