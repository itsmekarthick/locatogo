import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import { z } from "zod";
import { detectBoard, fetchCareerPageJobs, fetchJobs } from "../../src/lib/jobs/providers";

const env: Record<string, string> = {};
fs.readFileSync(".env", "utf8").split(/\r?\n/).forEach((line) => {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!match) return;
  env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
});

const CompanyInput = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1).optional(),
  website: z.string().url().optional().or(z.literal("")),
  careers_url: z.string().url().optional().or(z.literal("")),
  address_line_1: z.string().trim().min(1).default("United States"),
  locality: z.string().trim().optional().default(""),
  city: z.string().trim().min(1),
  state: z.string().trim().optional().default(""),
  country_code: z.literal("US").default("US"),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  company_type: z.enum([
    "tech_giant_mnc",
    "product_saas",
    "startup",
    "it_services_consulting",
    "deeptech_hardware",
    "vc_accelerator",
  ]).default("product_saas"),
  funding_stage: z.string().trim().optional().default(""),
  short_description: z.string().trim().optional().default(""),
});

type CompanyInput = z.infer<typeof CompanyInput>;

const DEFAULT_SOURCE = "https://api.github.com/repos/remoteintech/remote-jobs/contents/src/companies?ref=main";
const US_CITIES = [
  "San Francisco", "New York", "Seattle", "Austin", "Boston", "Chicago",
  "Los Angeles", "Denver", "Miami", "Atlanta", "Portland", "Washington",
  "Philadelphia", "Dallas", "Houston", "San Diego", "Palo Alto", "Mountain View",
  "Menlo Park", "Cambridge", "Raleigh", "Detroit", "Minneapolis", "Salt Lake City",
];
const US_CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  "San Francisco": { latitude: 37.7749, longitude: -122.4194 },
  "New York": { latitude: 40.7128, longitude: -74.006 },
  Seattle: { latitude: 47.6062, longitude: -122.3321 },
  Austin: { latitude: 30.2672, longitude: -97.7431 },
  Boston: { latitude: 42.3601, longitude: -71.0589 },
  Chicago: { latitude: 41.8781, longitude: -87.6298 },
  "Los Angeles": { latitude: 34.0522, longitude: -118.2437 },
  Denver: { latitude: 39.7392, longitude: -104.9903 },
  Miami: { latitude: 25.7617, longitude: -80.1918 },
  Atlanta: { latitude: 33.749, longitude: -84.388 },
  Portland: { latitude: 45.5152, longitude: -122.6784 },
  Washington: { latitude: 38.9072, longitude: -77.0369 },
  Philadelphia: { latitude: 39.9526, longitude: -75.1652 },
  Dallas: { latitude: 32.7767, longitude: -96.797 },
  Houston: { latitude: 29.7604, longitude: -95.3698 },
  "San Diego": { latitude: 32.7157, longitude: -117.1611 },
  "Palo Alto": { latitude: 37.4419, longitude: -122.143 },
  "Mountain View": { latitude: 37.3861, longitude: -122.0839 },
  "Menlo Park": { latitude: 37.453, longitude: -122.1817 },
  Cambridge: { latitude: 42.3736, longitude: -71.1097 },
  Raleigh: { latitude: 35.7796, longitude: -78.6382 },
  Detroit: { latitude: 42.3314, longitude: -83.0458 },
  Minneapolis: { latitude: 44.9778, longitude: -93.265 },
  "Salt Lake City": { latitude: 40.7608, longitude: -111.891 },
};

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function requireEnv(name: string): string {
  const value = env[name];
  if (!value) throw new Error(`Missing ${name} in .env`);
  return value;
}

async function readSource(source: string, limit?: number): Promise<unknown> {
  if (source === DEFAULT_SOURCE) return readRemoteDirectory(limit);
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, {
      headers: { Accept: "application/json,text/csv", "User-Agent": "Mapora-US-Company-Sync/1.0" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`Company source returned ${response.status}`);
    return parseSource(await response.text(), source);
  }
  return parseSource(fs.readFileSync(source, "utf8"), source);
}

async function readRemoteDirectory(limit?: number): Promise<CompanyInput[]> {
  const response = await fetch(DEFAULT_SOURCE, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "Mapora-US-Company-Sync/1.0" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Remote company directory returned ${response.status}`);
  const files = (await response.json()) as Array<{ download_url: string; name: string }>;
  const records: CompanyInput[] = [];

  for (const file of files) {
    if (limit && records.length >= limit) break;
    if (!file.download_url || !file.name.endsWith(".md")) continue;
    try {
      const markdown = await (await fetch(file.download_url, {
        headers: { "User-Agent": "Mapora-US-Company-Sync/1.0" },
        signal: AbortSignal.timeout(15_000),
      })).text();
      const frontmatter = markdown.match(/^---\s*\n([\s\S]*?)\n---/);
      if (!frontmatter) continue;
      const getField = (name: string) => frontmatter[1].match(new RegExp(`^${name}:\\s*["']?([^"'\\n]+)`, "m"))?.[1]?.trim();
      const title = getField("title");
      const website = getField("website");
      const careersUrl = getField("careers_url");
      const officeSection = markdown.match(/## Office locations\s*([\s\S]*?)(?:\n## |$)/i)?.[1] || "";
      const city = US_CITIES.find((candidate) => officeSection.toLowerCase().includes(candidate.toLowerCase()));
      if (!title || !city || !website) continue;
      const coordinates = US_CITY_COORDINATES[city];

      records.push({
        name: title,
        slug: getField("slug") || slugify(title),
        website,
        careers_url: careersUrl || website,
        address_line_1: "United States",
        locality: city,
        city,
        country_code: "US",
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        company_type: "product_saas",
        short_description: `${title} technology company with a US office in ${city}.`,
      });
    } catch {
      // Skip individual records that disappear or fail while the directory is fetched.
    }
  }

  return records;
}

function parseSource(text: string, source: string): unknown {
  if (source.toLowerCase().endsWith(".csv") || text.trimStart().startsWith("name,")) {
    return parse(text, { columns: true, skip_empty_lines: true, trim: true });
  }
  return JSON.parse(text);
}

function normalizeCompanies(value: unknown): CompanyInput[] {
  const rows = Array.isArray(value) ? value : (value as { companies?: unknown })?.companies;
  if (!Array.isArray(rows)) throw new Error("Company source must be an array or { companies: [] }");

  return rows.map((row) => {
    const parsed = CompanyInput.parse(row);
    return {
      ...parsed,
      slug: parsed.slug || slugify(parsed.name),
      website: parsed.website || undefined,
      careers_url: parsed.careers_url || undefined,
    };
  }).map((company, index) => {
    if (!company.slug) throw new Error(`Row ${index + 1} has no usable slug`);
    if (!company.careers_url && !company.website) {
      throw new Error(`Row ${index + 1} (${company.name}) needs website or careers_url`);
    }
    return company;
  });
}

async function getContext(supabase: SupabaseClient) {
  const { data: domains, error: domainError } = await supabase
    .from("domains")
    .select("id, tenant_id")
    .order("created_at")
    .limit(100);
  if (domainError || !domains?.length) throw new Error(`Unable to find a domain: ${domainError?.message || "unknown error"}`);

  for (const domain of domains) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("tenant_id", domain.tenant_id)
      .eq("domain_id", domain.id)
      .order("sort_order")
      .limit(1)
      .maybeSingle();
    if (category) return { tenantId: domain.tenant_id, domainId: domain.id, categoryId: category.id };
  }

  throw new Error("Unable to find a category attached to any available domain");
}

async function syncJobs(supabase: SupabaseClient, company: { id: string; tenant_id: string; title: string; careers_url: string | null; website: string | null }) {
  const board = detectBoard(company.careers_url);
  const sourceUrl = company.careers_url || company.website;
  if (!sourceUrl) return 0;

  const jobs = board ? await fetchJobs(board) : await fetchCareerPageJobs(sourceUrl);
  const records = jobs.filter((job) => job.applyUrl && job.applyUrl !== "#").map((job) => ({
    tenant_id: company.tenant_id,
    listing_id: company.id,
    title: job.title,
    department: job.department || "Engineering",
    location_name: job.locationName || "United States",
    workplace_type: job.workplaceType || "hybrid",
    experience_level: "mid",
    apply_url: job.applyUrl,
    ats_job_id: `${board?.provider || "career-page"}:${job.providerJobId}`,
    posted_at: job.postedAt || new Date().toISOString(),
    is_active: true,
  }));

  if (records.length) {
    const { error } = await supabase
      .from("company_jobs")
      .upsert(records, { onConflict: "listing_id,ats_job_id" });
    if (error) throw error;
  }

  let staleQuery = supabase
    .from("company_jobs")
    .update({ is_active: false })
    .eq("listing_id", company.id)
    .eq("is_active", true);
  if (records.length) {
    staleQuery = staleQuery.not("ats_job_id", "in", `(${records.map((job) => job.ats_job_id).join(",")})`);
  }
  const { error: staleError } = await staleQuery;
  if (staleError) throw staleError;

  const { error: countError } = await supabase
    .from("listings")
    .update({ active_jobs_count: records.length, updated_at: new Date().toISOString() })
    .eq("id", company.id);
  if (countError) throw countError;
  return records.length;
}

async function main() {
  const source = process.env.US_COMPANIES_SOURCE || env.US_COMPANIES_SOURCE || DEFAULT_SOURCE;

  const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));
  const context = await getContext(supabase);
  const configuredLimit = Number(process.env.US_COMPANIES_LIMIT || env.US_COMPANIES_LIMIT || "0");
  const companies = normalizeCompanies(await readSource(source, configuredLimit > 0 ? configuredLimit : undefined));
  const rows = companies.map((company) => ({
    tenant_id: context.tenantId,
    domain_id: context.domainId,
    category_id: context.categoryId,
    title: company.name,
    slug: company.slug,
    short_description: company.short_description || `${company.name} technology company in ${company.city}.`,
    address_line_1: company.address_line_1,
    locality: company.locality || company.state || company.city,
    city: company.city,
    country_code: "US",
    latitude: company.latitude ?? null,
    longitude: company.longitude ?? null,
    website: company.website || null,
    careers_url: company.careers_url || null,
    status: "published",
    verification_status: "verified",
    company_type: company.company_type,
    funding_stage: company.funding_stage || null,
  }));

  const { error: upsertError } = await supabase
    .from("listings")
    .upsert(rows, { onConflict: "domain_id,slug" });
  if (upsertError) throw upsertError;

  const { data: saved, error: savedError } = await supabase
    .from("listings")
    .select("id, tenant_id, title, careers_url, website")
    .eq("domain_id", context.domainId)
    .in("slug", rows.map((row) => row.slug));
  if (savedError || !saved) throw savedError || new Error("Could not reload upserted companies");

  let synced = 0;
  let jobs = 0;
  for (const company of saved) {
    try {
      const count = await syncJobs(supabase, company);
      synced++;
      jobs += count;
      console.log(`OK ${company.title}: ${count} active jobs`);
    } catch (error) {
      console.error(`FAILED ${company.title}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`Synced ${synced}/${saved.length} companies and ${jobs} active jobs.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});