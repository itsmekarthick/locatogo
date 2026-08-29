import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xpqizarctxbexawnzogb.supabase.co";
const supabaseKey = "sb_publishable_XFsYigKpFPQhMK9X73FBSQ_K25rV-xm";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testListingQuery() {
  const slug = "truffles-koramangala";
  const { data, error } = await supabase
    .from("listings")
    .select("id, domain_id, title, slug, short_description, description, address_line_1, address_line_2, locality, city, administrative_area, country_code, postal_code, website, phone, email, whatsapp, latitude, longitude, verification_status, is_featured, categories:categories!listings_category_id_domain_id_fkey(name)")
    .eq("slug", slug)
    .eq("status", "published")
    .limit(1)
    .maybeSingle();

  console.log("Result with explicit fkey:", { data: Boolean(data), error });

  const { data: data2, error: error2 } = await supabase
    .from("listings")
    .select("id, domain_id, title, slug, short_description, description, address_line_1, address_line_2, locality, city, administrative_area, country_code, postal_code, website, phone, email, whatsapp, latitude, longitude, verification_status, is_featured, category:categories(name)")
    .eq("slug", slug)
    .eq("status", "published")
    .limit(1)
    .maybeSingle();

  console.log("Result with simple fkey:", { data: Boolean(data2), error: error2 });
}

testListingQuery();

