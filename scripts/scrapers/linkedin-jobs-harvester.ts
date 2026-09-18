export interface HarvestedJob {
  jobId: string;
  title: string;
  companyName: string;
  companySlug: string;
  companyUrl: string | null;
  logoUrl: string | null;
  location: string;
  applyUrl: string;
  sourceUrl: string;
  sourceSearchUrl: string;
  description: string | null;
  employmentType: string | null;
  sourceFetchedAt: string;
  activelyHiring: boolean;
  department: string;
  workplaceType: "on_site" | "hybrid" | "remote";
  experienceLevel: "intern" | "entry" | "mid" | "senior" | "lead" | "executive";
  salaryRange?: string;
  keywordTrack: string;
}

const SEARCH_KEYWORDS = [
  "Software Engineer",
  "Senior Software Engineer",
  "Frontend Engineer",
  "React Developer",
  "Backend Engineer",
  "Java Developer",
  "Python Developer",
  "Go Engineer",
  "Node.js Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Site Reliability Engineer",
  "Data Engineer",
  "Data Scientist",
  "AI Engineer",
  "Machine Learning Engineer",
  "Generative AI",
  "LLM Engineer",
  "Product Manager",
  "Technical Program Manager",
  "Mobile Developer",
  "Android Engineer",
  "iOS Engineer",
  "Flutter Developer",
  "QA Automation Engineer",
  "SDET",
  "Cybersecurity Engineer",
  "Solutions Architect",
  "Principal Engineer",
  "Staff Software Engineer",
  "Engineering Manager",
];

function inferDepartment(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("ai") || lower.includes("machine learning") || lower.includes("data") || lower.includes("deep learning")) {
    return "Data & AI";
  }
  if (lower.includes("devops") || lower.includes("sre") || lower.includes("cloud") || lower.includes("infrastructure") || lower.includes("platform")) {
    return "DevOps & Cloud";
  }
  if (lower.includes("product") || lower.includes("program")) {
    return "Product Management";
  }
  if (lower.includes("frontend") || lower.includes("ui") || lower.includes("ux") || lower.includes("web")) {
    return "Frontend Engineering";
  }
  if (lower.includes("qa") || lower.includes("test") || lower.includes("automation")) {
    return "Quality Assurance";
  }
  if (lower.includes("security") || lower.includes("infosec")) {
    return "Cybersecurity";
  }
  return "Engineering";
}

function inferExperienceLevel(title: string): HarvestedJob["experienceLevel"] {
  const lower = title.toLowerCase();
  if (lower.includes("intern") || lower.includes("trainee") || lower.includes("apprentice")) return "intern";
  if (lower.includes("junior") || lower.includes("associate") || lower.includes("entry") || lower.includes("graduate")) return "entry";
  if (lower.includes("lead") || lower.includes("principal") || lower.includes("staff") || lower.includes("architect")) return "lead";
  if (lower.includes("director") || lower.includes("vp") || lower.includes("head of") || lower.includes("chief")) return "executive";
  if (lower.includes("senior") || lower.includes("sr") || lower.includes("lead") || lower.includes("iii") || lower.includes("iv")) return "senior";
  return "mid";
}

function inferWorkplaceType(title: string, location: string): HarvestedJob["workplaceType"] {
  const combined = (title + " " + location).toLowerCase();
  if (combined.includes("remote") || combined.includes("work from home")) return "remote";
  if (combined.includes("hybrid") || combined.includes("flexible")) return "hybrid";
  return "on_site";
}

function cleanHtmlText(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function harvestLinkedInJobs(options: {
  maxPagesPerKeyword?: number;
  keywords?: string[];
  delayMs?: number;
} = {}): Promise<HarvestedJob[]> {
  const maxPages = options.maxPagesPerKeyword ?? 3; // 3 pages * 25 = 75 jobs per keyword
  const keywords = options.keywords ?? SEARCH_KEYWORDS;
  const delay = options.delayMs ?? 400;

  const jobsMap = new Map<string, HarvestedJob>();

  for (const keyword of keywords) {
    console.log(`[LinkedIn Harvester] Harvesting track: "${keyword}" in Bengaluru...`);

    for (let page = 0; page < maxPages; page++) {
      const start = page * 25;
      const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(
        keyword
      )}&location=Bengaluru%2C%20Karnataka%2C%20India&start=${start}`;

      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });

        if (!res.ok) {
          if (res.status === 429) {
            console.warn(`[LinkedIn Harvester] HTTP 429 (rate limited). Waiting 2s before next track...`);
            await new Promise((r) => setTimeout(r, 2000));
          } else {
            console.warn(`[LinkedIn Harvester] HTTP ${res.status} for ${keyword} (start=${start})`);
          }
          break;
        }

        const html = await res.text();
        const sourceFetchedAt = new Date().toISOString();
        const items = html.split("<li");

        let pageJobsCount = 0;

        for (const item of items) {
          const urnMatch = item.match(/data-entity-urn=["']urn:li:jobPosting:(\d+)["']/);
          if (!urnMatch) continue;

          const jobId = urnMatch[1];
          const titleMatch = item.match(/base-search-card__title[^>]*>([\s\S]*?)<\/h3>/i);
          const companyMatch = item.match(/base-search-card__subtitle[^>]*>([\s\S]*?)<\/h4>/i);
          const companyLinkMatch = item.match(/base-search-card__subtitle[\s\S]*?<a[^>]+href=["']([^"']+)["']/i);
          const logoMatch = item.match(/data-delayed-url=["']([^"']+)["']/i);
          const linkMatch = item.match(/class=["'][^"']*base-card__full-link[^"']*["'][^>]*href=["']([^"']+)["']/i);
          const locationMatch = item.match(/job-search-card__location[^>]*>([\s\S]*?)<\/span>/i);
          const descriptionMatch = item.match(/base-search-card__snippet[^>]*>([\s\S]*?)<\/div>/i);
          const employmentTypeMatch = item.match(/job-card-container__metadata-item[^>]*>([\s\S]*?)<\/li>/i);
          const activelyHiring = item.includes("Actively Hiring");

          if (titleMatch && companyMatch) {
            const rawTitle = cleanHtmlText(titleMatch[1]);
            const rawCompany = cleanHtmlText(companyMatch[1]);
            const rawLocation = locationMatch
              ? cleanHtmlText(locationMatch[1])
              : "Bengaluru, Karnataka, India";

            const rawLink = linkMatch
              ? linkMatch[1].replace(/&amp;/g, "&")
              : `https://in.linkedin.com/jobs/view/${jobId}`;
            const applyUrl = rawLink.split("?")[0];
            const companyUrl = companyLinkMatch ? companyLinkMatch[1].replace(/&amp;/g, "&") : null;
            const logoUrl = logoMatch ? logoMatch[1].replace(/&amp;/g, "&") : null;

            const companySlug = rawCompany
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");

            if (!jobsMap.has(jobId) && rawCompany && rawTitle) {
              jobsMap.set(jobId, {
                jobId,
                title: rawTitle,
                companyName: rawCompany,
                companySlug,
                companyUrl,
                logoUrl,
                location: rawLocation,
                applyUrl,
                sourceUrl: applyUrl,
                sourceSearchUrl: url,
                description: descriptionMatch ? cleanHtmlText(descriptionMatch[1]) : null,
                employmentType: employmentTypeMatch ? cleanHtmlText(employmentTypeMatch[1]) : null,
                sourceFetchedAt,
                activelyHiring,
                department: inferDepartment(rawTitle),
                workplaceType: inferWorkplaceType(rawTitle, rawLocation),
                experienceLevel: inferExperienceLevel(rawTitle),
                keywordTrack: keyword,
              });
              pageJobsCount++;
            }
          }
        }

        if (pageJobsCount === 0) {
          // Reached end of results for this keyword
          break;
        }

        // Polite delay
        await new Promise((r) => setTimeout(r, delay));
      } catch (err) {
        console.error(`[LinkedIn Harvester] Error on ${keyword} page ${page}:`, err);
        break;
      }
    }
  }

  const allJobs = Array.from(jobsMap.values());
  console.log(`[LinkedIn Harvester] Finished. Total unique live jobs harvested: ${allJobs.length}`);
  return allJobs;
}
