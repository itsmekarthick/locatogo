import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xpqizarctxbexawnzogb.supabase.co";
const supabaseKey = "sb_publishable_XFsYigKpFPQhMK9X73FBSQ_K25rV-xm";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllListingSlugs() {
  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, title, slug, status")
    .limit(10);

  console.log("Sample listings in DB:", listings);

  const testSlug = listings?.[0]?.slug;
  if (testSlug) {
    const { data: directListing, error: e1 } = await supabase
      .from("listings")
      .select("id, domain_id, title, slug, short_description, description, address_line_1, address_line_2, locality, city, administrative_area, country_code, postal_code, website, phone, email, whatsapp, latitude, longitude, verification_status, is_featured, categories:categories!listings_category_id_domain_id_fkey(name)")
      .eq("slug", testSlug)
      .eq("status", "published")
      .limit(1)
      .maybeSingle();

    console.log(`Querying /listing/${testSlug}:`, { found: Boolean(directListing), error: e1 });
  }
}

testAllListingSlugs();

