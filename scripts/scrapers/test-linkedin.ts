import fs from "fs";

export interface LinkedInJob {
  jobId: string;
  title: string;
  companyName: string;
  companySlug: string;
  logoUrl: string | null;
  location: string;
  applyUrl: string;
  activelyHiring: boolean;
}

export function parseLinkedInJobsHtml(html: string): LinkedInJob[] {
  const jobs: LinkedInJob[] = [];
  // Split on `<li` tags
  const items = html.split("<li");

  for (const item of items) {
    const urnMatch = item.match(/data-entity-urn=["']urn:li:jobPosting:(\d+)["']/);
    if (!urnMatch) continue;

    const jobId = urnMatch[1];
    const titleMatch = item.match(/base-search-card__title[^>]*>([\s\S]*?)<\/h3>/i);
    const companyMatch = item.match(/base-search-card__subtitle[^>]*>([\s\S]*?)<\/h4>/i);
    const logoMatch = item.match(/data-delayed-url=["']([^"']+)["']/i);
    const linkMatch = item.match(/class=["'][^"']*base-card__full-link[^"']*["'][^>]*href=["']([^"']+)["']/i);
    const locationMatch = item.match(/job-search-card__location[^>]*>([\s\S]*?)<\/span>/i);
    const activelyHiring = item.includes("Actively Hiring");

    if (titleMatch && companyMatch) {
      const title = titleMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const rawCompany = companyMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const location = locationMatch
        ? locationMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
        : "Bengaluru, Karnataka, India";

      let rawLink = linkMatch ? linkMatch[1].replace(/&amp;/g, "&") : `https://in.linkedin.com/jobs/view/${jobId}`;
      const applyUrl = rawLink.split("?")[0];
      const logoUrl = logoMatch ? logoMatch[1].replace(/&amp;/g, "&") : null;

      const companySlug = rawCompany
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      if (title && rawCompany) {
        jobs.push({
          jobId,
          title,
          companyName: rawCompany,
          companySlug,
          logoUrl,
          location,
          applyUrl,
          activelyHiring,
        });
      }
    }
  }

  return jobs;
}

async function run() {
  const html = fs.readFileSync("scripts/scrapers/sample-linkedin.html", "utf8");
  const parsed = parseLinkedInJobsHtml(html);
  console.log(`Parsed ${parsed.length} jobs successfully!`);
  console.log("Sample 3 parsed jobs:");
  console.log(JSON.stringify(parsed.slice(0, 3), null, 2));
}

run().catch(console.error);
