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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function main() {
  const fileContent = fs.readFileSync("scripts/scrapers/seed-bangalore-comprehensive.ts", "utf8");
  const names: string[] = [];
  for (const m of fileContent.matchAll(/^\s*name:\s*"([^"]+)",/gm)) {
    names.push(m[1]);
  }
  const slugs = Array.from(new Set(names.map(slugify)));
  const bangaloreDomainId = "461e4ee7-7a16-43b3-b342-5a968e44f306";

  console.log(`Slugs count: ${slugs.length}, joined length: ${slugs.join(",").length} bytes`);

  // Count uncurated in Bangalore
  const { count: uncuratedCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("domain_id", bangaloreDomainId)
    .not("slug", "in", `(${slugs.join(",")})`);

  console.log(`Bangalore uncurated count: ${uncuratedCount}`);
}

main().catch(console.error);
