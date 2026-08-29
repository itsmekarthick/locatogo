import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xpqizarctxbexawnzogb.supabase.co";
const supabaseKey = "sb_publishable_XFsYigKpFPQhMK9X73FBSQ_K25rV-xm";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearch(q) {
  console.log(`\nTesting search for: "${q}"`);
  
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, slug, locality, city, short_description, is_featured, categories:categories!listings_category_id_domain_id_fkey(name, icon)")
    .eq("status", "published")
    .or(`title.ilike.%${q}%,locality.ilike.%${q}%,slug.ilike.%${q}%`)
    .limit(8);

  console.log("Search Result:", { count: data?.length, error, titles: data?.map(d => d.title) });
}

async function run() {
  await testSearch("tru");
  await testSearch("hos");
  await testSearch("edi");
  await testSearch("kor");
  await testSearch("pet");
}

run();

