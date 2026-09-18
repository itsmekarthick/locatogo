import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { detectBoard, fetchJobs } from "../../src/lib/jobs/providers";

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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const board = detectBoard("https://careers.smartrecruiters.com/servicenow");
  console.log("Detected board:", board);
  if (!board) return;
  const jobs = await fetchJobs(board);
  console.log(`Fetched ${jobs.length} jobs from ServiceNow SmartRecruiters!`);
  if (jobs.length > 0) {
    console.log("Sample job:", jobs[0]);
  }
}

test().catch(console.error);
