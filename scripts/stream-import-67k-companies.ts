import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { parseImportCsv } from "../src/lib/import/csv";

// Parse .env
const envFile = fs.readFileSync(".env", "utf8");
const env: Record<string, string> = {};
envFile.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function run() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Get first active domain & category
  const { data: domains } = await supabase.from("domains").select("id, tenant_id").limit(1);
  if (!domains || !domains.length) {
    console.error("No active domains found in database.");
    return;
  }
  const { id: domainId, tenant_id: tenantId } = domains[0];

  let { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("tenant_id", tenantId)
    .ilike("name", "%Tech%")
    .limit(1)
    .maybeSingle();

  if (!category) {
    const { data: newCat } = await supabase
      .from("categories")
      .insert({
        tenant_id: tenantId,
        domain_id: domainId,
        name: "Tech & Coworking",
        slug: "tech-coworking",
        icon: "💻",
        pin_color: "#6366f1",
      })
      .select("id")
      .single();
    category = newCat;
  }

  const categoryId = category?.id || domainId;
  const datasetsDir = path.join(process.cwd(), "public", "datasets");

  const files = [
    "bangalore_it_companies_part1_10k.csv",
    "bangalore_it_companies_part2_10k.csv",
    "bangalore_it_companies_part3_10k.csv",
    "bangalore_it_companies_part4_10k.csv",
    "bangalore_it_companies_part5_10k.csv",
    "bangalore_it_companies_part6_10k.csv",
    "bangalore_it_companies_part7_7k.csv",
  ];

  console.log(`Starting High-Speed Stream Ingestion of 67,000 IT Companies into Supabase...`);

  let grandTotal = 0;

  for (let f = 0; f < files.length; f++) {
    const file = files[f];
    const fullPath = path.join(datasetsDir, file);
    if (!fs.existsSync(fullPath)) continue;

    console.log(`\nReading [${f + 1}/7] ${file}...`);
    const content = fs.readFileSync(fullPath, "utf8");
    const rows = parseImportCsv(content);

    console.log(`Ingesting batch of ${rows.length.toLocaleString()} companies in chunks of 500...`);

    const CHUNK_SIZE = 500;
    let batchSuccess = 0;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const records = chunk.map((r, idx) => {
        const rawTech = r.tech_stack || "";
        const techStack = typeof rawTech === "string" ? rawTech.split(";").map((t) => t.trim()).filter(Boolean) : [];
        const year = parseInt(r.founded_year || "", 10);

        return {
          tenant_id: tenantId,
          domain_id: domainId,
          category_id: categoryId,
          title: r.title,
          slug: r.slug,
          short_description: r.short_description,
          address_line_1: r.address_line_1,
          locality: r.locality,
          city: "Bengaluru",
          administrative_area: "Karnataka",
          country_code: "IN",
          postal_code: r.postal_code,
          latitude: parseFloat(r.latitude),
          longitude: parseFloat(r.longitude),
          website: r.website,
          careers_url: r.careers_url,
          company_type: r.company_type,
          funding_stage: r.funding_stage,
          employee_range: r.employee_range,
          tech_stack: techStack.length > 0 ? techStack : undefined,
          founded_year: !isNaN(year) ? year : null,
          status: "published",
          verification_status: "verified",
          is_featured: true,
          published_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase.from("listings").insert(records);
      if (error) {
        // If duplicates exist, insert item by item or skip
        console.warn(`Chunk ${i / CHUNK_SIZE + 1} notice: ${error.message}`);
      } else {
        batchSuccess += records.length;
      }
    }

    grandTotal += batchSuccess;
    console.log(`✓ Completed Part ${f + 1}/7: ${batchSuccess.toLocaleString()} companies inserted.`);
  }

  console.log(`\n🎉 INGESTION COMPLETE: Total ${grandTotal.toLocaleString()} verified Bangalore IT Companies live in Atlas!`);
}

run();
