import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env: Record<string, string> = {};
const envFile = fs.existsSync(".env.local") ? ".env.local" : ".env";
fs.readFileSync(envFile, "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim().replace(/^['\"]|['\"]$/g, "");
  });

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Patterns that indicate NON-IT companies (retail stores, repair shops, carrier stores, coworking, coaching, clinics, etc.)
const NON_IT_TITLE_PATTERNS = [
    /\b(store|shop|repair|fix|screen|cell phone|cellular|mobile store)\b/i,
    /\b(at&t|verizon|t-mobile|metro by t-mobile|cricket wireless|boost mobile|sprint)\b/i,
    /\b(best buy|micro center|radio shack|apple store)\b/i,
    /\b(co-?working|workspace|shared office)\b/i,
    /\b(coaching|tuition|academy|classes|institute of|driving school)\b/i,
    /\b(dental|clinic|hospital|pharmacy|medical|physio|chiro)\b/i,
    /\b(law office|attorney|legal|accounting|cpa|tax service)\b/i,
    /\b(real estate|realty|property management|mortgage)\b/i,
    /\b(restaurant|cafe|bakery|bar|lounge|pizza|salon|spa)\b/i,
];

const NON_IT_DESC_PATTERNS = [
    /providing (electronics|coworking space|computer store|it service and computer repair|telecommunications|computer coaching) solutions/i,
    /providing corporate office solutions/i,
];

async function main() {
  console.log("Auditing listings for non-IT companies...");

  let page = 0;
  const toDeleteIds: string[] = [];
  const nonItSamples: { title: string; desc: string; reason: string }[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("listings")
      .select("id, title, description, website")
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (error) {
      console.error("Fetch error:", error);
      break;
    }
    if (!data || data.length === 0) break;

    for (const item of data) {
      const title = item.title || "";
      const desc = item.description || "";

      let isNonIt = false;
      let reason = "";

      for (const pat of NON_IT_TITLE_PATTERNS) {
        if (pat.test(title)) {
          isNonIt = true;
          reason = `Title matched: ${pat}`;
          break;
        }
      }

      if (!isNonIt) {
        for (const pat of NON_IT_DESC_PATTERNS) {
          if (pat.test(desc)) {
            isNonIt = true;
            reason = `Description matched: ${pat}`;
            break;
          }
        }
      }

      if (isNonIt) {
        toDeleteIds.push(item.id);
        if (nonItSamples.length < 30) {
          nonItSamples.push({ title, desc, reason });
        }
      }
    }

    page++;
    process.stdout.write(`Scanned ${page * 1000} listings... Found ${toDeleteIds.length} non-IT records\r`);
  }

  console.log(`\n\nTotal non-IT listings identified: ${toDeleteIds.length}`);
  console.log("\nSample non-IT records to be purged:");
  for (const s of nonItSamples) {
    console.log(`- "${s.title}" (${s.reason})`);
  }

  if (toDeleteIds.length > 0) {
    console.log(`\nPurging ${toDeleteIds.length} non-IT listings from Supabase in batches of 100...`);
    const BATCH = 100;
    let purged = 0;
    for (let i = 0; i < toDeleteIds.length; i += BATCH) {
      const chunk = toDeleteIds.slice(i, i + BATCH);
      const { error: delErr } = await supabase
        .from("listings")
        .delete()
        .in("id", chunk);

      if (delErr) {
        console.error(`Error deleting batch ${i}:`, delErr);
      } else {
        purged += chunk.length;
        process.stdout.write(`Purged ${purged}/${toDeleteIds.length} non-IT records\r`);
      }
    }
    console.log(`\n✅ Successfully purged ${purged} non-IT listings from the database!`);
  }
}

main().catch(console.error);
