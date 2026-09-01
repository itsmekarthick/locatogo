// Public ATS Ingestion Client for Greenhouse, Lever, and Ashby

export type NormalizedJob = {
  atsJobId: string;
  title: string;
  department: string;
  locationName: string;
  workplaceType: "on_site" | "hybrid" | "remote";
  applyUrl: string;
  postedAt: string;
};

/**
 * Fetch and normalize live job openings from Greenhouse.io
 */
export async function fetchGreenhouseJobs(boardToken: string): Promise<NormalizedJob[]> {
  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data.jobs)) return [];

    return data.jobs.map((j: any) => {
      const loc = (j.location?.name || "Remote").trim();
      const isRemote = loc.toLowerCase().includes("remote");
      const isHybrid = loc.toLowerCase().includes("hybrid");

      return {
        atsJobId: String(j.id),
        title: j.title || "Software Engineer",
        department: j.departments?.[0]?.name || "Engineering",
        locationName: loc,
        workplaceType: isRemote ? "remote" : isHybrid ? "hybrid" : "on_site",
        applyUrl: j.absolute_url || `https://boards.greenhouse.io/${boardToken}/jobs/${j.id}`,
        postedAt: j.updated_at || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error(`[ATS Sync] Error fetching Greenhouse for ${boardToken}:`, err);
    return [];
  }
}

/**
 * Fetch and normalize live job openings from Lever.co
 */
export async function fetchLeverJobs(companyToken: string): Promise<NormalizedJob[]> {
  try {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(companyToken)}?mode=json`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((j: any) => {
      const loc = (j.categories?.location || "Remote").trim();
      const workplace = (j.workplaceType || "").toLowerCase();

      return {
        atsJobId: String(j.id),
        title: j.text || "Software Engineer",
        department: j.categories?.department || j.categories?.team || "Engineering",
        locationName: loc,
        workplaceType: workplace === "remote" ? "remote" : workplace === "hybrid" ? "hybrid" : "on_site",
        applyUrl: j.hostedUrl || j.applyUrl,
        postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error(`[ATS Sync] Error fetching Lever for ${companyToken}:`, err);
    return [];
  }
}

/**
 * Fetch and normalize live job openings from AshbyHQ
 */
export async function fetchAshbyJobs(companyToken: string): Promise<NormalizedJob[]> {
  try {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(companyToken)}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data.jobs)) return [];

    return data.jobs.map((j: any) => {
      const loc = (j.locationName || j.location || "Remote").trim();
      const isRemote = j.isRemote || loc.toLowerCase().includes("remote");

      return {
        atsJobId: String(j.id),
        title: j.title || "Software Engineer",
        department: j.departmentName || "Engineering",
        locationName: loc,
        workplaceType: isRemote ? "remote" : "hybrid",
        applyUrl: j.jobUrl || `https://jobs.ashbyhq.com/${companyToken}/${j.id}`,
        postedAt: j.publishedAt || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error(`[ATS Sync] Error fetching Ashby for ${companyToken}:`, err);
    return [];
  }
}

/**
 * Universal ATS Sync Dispatcher
 */
export async function syncCompanyAtsJobs(
  provider: "greenhouse" | "lever" | "ashby" | "custom" | "workday" | "smartrecruiters",
  boardToken: string
): Promise<NormalizedJob[]> {
  if (!boardToken) return [];

  switch (provider) {
    case "greenhouse":
      return fetchGreenhouseJobs(boardToken);
    case "lever":
      return fetchLeverJobs(boardToken);
    case "ashby":
      return fetchAshbyJobs(boardToken);
    default:
      return [];
  }
}
