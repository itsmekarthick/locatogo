export type JobProvider = "greenhouse" | "lever" | "ashby" | "smartrecruiters";

export type ExternalJob = {
  providerJobId: string;
  title: string;
  department: string | null;
  locationName: string;
  workplaceType: "on_site" | "hybrid" | "remote";
  applyUrl: string;
  postedAt: string | null;
};

type Board = { provider: JobProvider; token: string };

const CAREER_PATHS = ["/careers", "/jobs", "/work-with-us", "/join-us", "/career"];

function tokenFromPath(url: URL): string | null {
  return url.pathname.split("/").filter(Boolean)[0] || null;
}

export function detectBoard(value: string | null | undefined): Board | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const token = tokenFromPath(url);
  if (!token) return null;
  if ((host === "boards.greenhouse.io" || host === "job-boards.greenhouse.io") && token !== "embed") {
    return { provider: "greenhouse", token };
  }
  if (host === "jobs.lever.co") return { provider: "lever", token };
  if (host === "jobs.ashbyhq.com") return { provider: "ashby", token };
  if (host === "careers.smartrecruiters.com" || host === "jobs.smartrecruiters.com") {
    return { provider: "smartrecruiters", token };
  }
  return null;
}

function workplaceType(text: string): ExternalJob["workplaceType"] {
  const value = text.toLowerCase();
  if (value.includes("remote") || value.includes("work from home")) return "remote";
  if (value.includes("hybrid") || value.includes("flexible")) return "hybrid";
  return "on_site";
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function locationText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(locationText).filter((location) => location !== "Unspecified").join("; ") || "Unspecified";
  }
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "Unspecified";
  const location = value as Record<string, unknown>;
  const address = location.address;
  if (address && typeof address === "object") {
    const fields = address as Record<string, unknown>;
    return [fields.addressLocality, fields.addressRegion, fields.addressCountry]
      .map(stringValue)
      .filter(Boolean)
      .join(", ") || "Unspecified";
  }
  return stringValue(location.name) || "Unspecified";
}

function jsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      blocks.push(JSON.parse(match[1].trim()));
    } catch {
      // Ignore malformed JSON-LD blocks and continue with valid page data.
    }
  }
  return blocks;
}

function jobPostingNodes(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(jobPostingNodes);
  if (!value || typeof value !== "object") return [];
  const node = value as Record<string, unknown>;
  const type = node["@type"];
  const nodes = type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting")) ? [node] : [];
  return nodes.concat(jobPostingNodes(node["@graph"]));
}

export function parseJobPostingJsonLd(html: string, pageUrl: string): ExternalJob[] {
  const jobs: ExternalJob[] = [];
  const seen = new Set<string>();
  for (const block of jsonLdBlocks(html)) {
    for (const job of jobPostingNodes(block)) {
      const title = stringValue(job.title);
      if (!title) continue;
      const applyUrl = stringValue(job.url);
      if (!applyUrl) continue;
      const providerJobId = applyUrl;
      if (seen.has(providerJobId)) continue;
      seen.add(providerJobId);
      const location = locationText(job.jobLocation);
      const remote = stringValue(job.jobLocationType) || "";
      jobs.push({
        providerJobId,
        title,
        department: stringValue(job.occupationalCategory) || stringValue(job.department),
        locationName: location,
        workplaceType: workplaceType(`${location} ${remote}`),
        applyUrl,
        postedAt: stringValue(job.datePosted),
      });
    }
  }
  return jobs;
}

async function getJson(url: string): Promise<any> {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "LocaToGo-Tech-Atlas/1.0" },
    signal: AbortSignal.timeout(20_000),
    next: { revalidate: 0 },
  });
  if (!response.ok) throw new Error(`Provider returned ${response.status}`);
  return response.json();
}

async function getHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "LocaToGo-Tech-Atlas/1.0" },
    signal: AbortSignal.timeout(5_000),
    next: { revalidate: 0 },
  });
  if (!response.ok) throw new Error(`Career page returned ${response.status}`);
  return response.text();
}

function normalizeWebsite(value: string): URL | null {
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return null;
  }
}

function linkedUrls(html: string, pageUrl: string): string[] {
  const urls = new Set<string>();
  const pattern = /href=["']([^"']+)["']/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      urls.add(new URL(match[1], pageUrl).toString());
    } catch {
      // Ignore malformed links.
    }
  }
  return [...urls];
}

export async function fetchCareerPageJobs(value: string | null | undefined): Promise<ExternalJob[]> {
  if (!value) return [];
  const source = normalizeWebsite(value);
  if (!source) return [];
  const candidates = new Set<string>([source.toString(), new URL("/", source).toString()]);
  for (const path of CAREER_PATHS) candidates.add(new URL(path, source).toString());
  const pages = await Promise.allSettled([...candidates].map(async (url) => ({ url, html: await getHtml(url) })));
  const jobs: ExternalJob[] = [];
  const seen = new Set<string>();
  for (const page of pages) {
    if (page.status !== "fulfilled") continue;
    for (const link of linkedUrls(page.value.html, page.value.url)) {
      const board = detectBoard(link);
      if (!board) continue;
      try {
        for (const job of await fetchJobs(board)) {
          if (seen.has(job.providerJobId)) continue;
          seen.add(job.providerJobId);
          jobs.push(job);
        }
      } catch {
        // Continue with other career links and JSON-LD on the page.
      }
    }
    for (const job of parseJobPostingJsonLd(page.value.html, page.value.url)) {
      if (seen.has(job.providerJobId)) continue;
      seen.add(job.providerJobId);
      jobs.push(job);
    }
  }
  return jobs;
}

async function fetchGreenhouse(token: string): Promise<ExternalJob[]> {
  const data = await getJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs?content=true`);
  return (data.jobs || []).map((job: any) => ({
    providerJobId: String(job.id),
    title: job.title,
    department: job.departments?.[0]?.name || null,
    locationName: job.location?.name || "Remote",
    workplaceType: workplaceType(`${job.title} ${job.location?.name || ""}`),
    applyUrl: job.absolute_url,
    postedAt: stringValue(job.updated_at),
  }));
}

async function fetchLever(token: string): Promise<ExternalJob[]> {
  const jobs: ExternalJob[] = [];
  for (let skip = 0; ; skip += 100) {
    const data = await getJson(`https://api.lever.co/v0/postings/${encodeURIComponent(token)}?mode=json&skip=${skip}`);
    if (!Array.isArray(data) || data.length === 0) break;
    jobs.push(...data.map((job: any) => ({
      providerJobId: String(job.id),
      title: job.text,
      department: job.categories?.team || job.categories?.department || null,
      locationName: job.categories?.location || job.workplaceType || "Remote",
      workplaceType: workplaceType(`${job.text} ${job.categories?.location || ""} ${job.workplaceType || ""}`),
      applyUrl: job.hostedUrl || job.applyUrl,
      postedAt: null,
    })));
    if (data.length < 100) break;
  }
  return jobs;
}

async function fetchAshby(token: string): Promise<ExternalJob[]> {
  const data = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(token)}`);
  return (data.jobs || []).map((job: any) => ({
    providerJobId: String(job.jobUrl || job.applyUrl || job.title),
    title: job.title,
    department: job.department || job.team || null,
    locationName: job.location || (job.isRemote ? "Remote" : "Unspecified"),
    workplaceType: workplaceType(`${job.title} ${job.location || ""}`),
    applyUrl: job.applyUrl || job.jobUrl,
    postedAt: stringValue(job.publishedAt),
  }));
}

import { jobMatchesLocation } from "@/lib/jobs/location-matcher";

export type FetchJobsOptions = {
  city?: string;
  country?: string;
};

async function fetchSmartRecruiters(token: string, options?: FetchJobsOptions): Promise<ExternalJob[]> {
  const jobs: ExternalJob[] = [];
  const targetCity = options?.city?.trim();

  // If city is specified, attempt targeted city queries first
  if (targetCity) {
    const cityQueries: string[] = [targetCity];
    const lower = targetCity.toLowerCase();
    if (lower.includes("bangalore") || lower.includes("bengaluru")) {
      cityQueries.push("Bengaluru", "Bangalore");
    }

    const seenIds = new Set<string>();
    for (const cq of Array.from(new Set(cityQueries))) {
      try {
        const data = await getJson(
          `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(token)}/postings?city=${encodeURIComponent(cq)}&limit=100`
        );
        const page = data.content || [];
        for (const job of page) {
          if (!seenIds.has(String(job.id))) {
            seenIds.add(String(job.id));
            jobs.push({
              providerJobId: String(job.id),
              title: job.name,
              department: job.department?.label || null,
              locationName: job.location?.city
                ? [job.location.city, job.location.country].filter(Boolean).join(", ")
                : "Unspecified",
              workplaceType: workplaceType(`${job.name} ${job.location?.city || ""}`),
              applyUrl: job.ref || `https://jobs.smartrecruiters.com/${token}/${job.id}`,
              postedAt: stringValue(job.releasedDate),
            });
          }
        }
      } catch (err) {
        console.warn(`SmartRecruiters query error for ${cq}:`, err);
      }
    }

    if (jobs.length > 0) {
      return jobs;
    }
  }

  // Fallback to general paginated postings
  for (let offset = 0; offset < 300; offset += 100) {
    const countryParam = options?.country ? `&country=${encodeURIComponent(options.country)}` : "";
    const data = await getJson(
      `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(token)}/postings?limit=100&offset=${offset}${countryParam}`
    );
    const page = data.content || [];
    jobs.push(
      ...page.map((job: any) => ({
        providerJobId: String(job.id),
        title: job.name,
        department: job.department?.label || null,
        locationName: job.location?.city
          ? [job.location.city, job.location.country].filter(Boolean).join(", ")
          : "Unspecified",
        workplaceType: workplaceType(`${job.name} ${job.location?.city || ""}`),
        applyUrl: job.ref || `https://jobs.smartrecruiters.com/${token}/${job.id}`,
        postedAt: stringValue(job.releasedDate),
      }))
    );
    if (page.length < 100) break;
  }

  // If a target city was requested, prioritize jobs matching that city
  if (targetCity) {
    jobs.sort((a, b) => {
      const aMatch = jobMatchesLocation(a.locationName, targetCity) ? 1 : 0;
      const bMatch = jobMatchesLocation(b.locationName, targetCity) ? 1 : 0;
      return bMatch - aMatch;
    });
  }

  return jobs;
}

export async function fetchJobs(board: Board, options?: FetchJobsOptions): Promise<ExternalJob[]> {
  let list: ExternalJob[] = [];
  switch (board.provider) {
    case "greenhouse":
      list = await fetchGreenhouse(board.token);
      break;
    case "lever":
      list = await fetchLever(board.token);
      break;
    case "ashby":
      list = await fetchAshby(board.token);
      break;
    case "smartrecruiters":
      list = await fetchSmartRecruiters(board.token, options);
      break;
  }

  if (options?.city) {
    const city = options.city;
    list.sort((a, b) => {
      const aMatch = jobMatchesLocation(a.locationName, city) ? 1 : 0;
      const bMatch = jobMatchesLocation(b.locationName, city) ? 1 : 0;
      return bMatch - aMatch;
    });
  }

  return list;
}

