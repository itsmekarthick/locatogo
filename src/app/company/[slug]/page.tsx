import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { GLOBAL_TECH_HUBS, type TechHub, matchesHub } from "@/lib/constants/tech-hubs";
import { jobMatchesLocation } from "@/lib/jobs/location-matcher";
import { ShareButton } from "@/components/share-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CompanyJobsFilter } from "@/components/company-jobs-filter";
import { BrandLogo } from "@/components/brand-logo";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

async function getCompanyBySlug(rawSlug: string) {
  const cleanSlug = decodeURIComponent(rawSlug).trim().toLowerCase();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);

  let supabase: any;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    supabase = await createSupabaseServerClient();
  }

  let query = supabase.from("listings").select(`
    id,
    title,
    slug,
    short_description,
    description,
    address_line_1,
    locality,
    city,
    latitude,
    longitude,
    website,
    careers_url,
    company_type,
    funding_stage,
    employee_range,
    tech_stack,
    founded_year,
    active_jobs_count,
    country_code,
    created_at,
    updated_at
  `).eq("status", "published").not("company_type", "is", null);

  if (isUuid) {
    query = query.or(`slug.eq.${cleanSlug},slug.ilike.${cleanSlug},id.eq.${cleanSlug}`);
  } else {
    query = query.or(`slug.eq.${cleanSlug},slug.ilike.${cleanSlug}`);
  }

  const { data: company } = await query.limit(1).maybeSingle();
  if (!company) return null;

  // Fetch active company jobs
  const { data: jobs } = await supabase
    .from("company_jobs")
    .select(
      "id, title, department, location_name, workplace_type, experience_level, salary_range, apply_url, posted_at, is_active"
    )
    .eq("listing_id", company.id)
    .eq("is_active", true)
    .order("posted_at", { ascending: false });

  // Fetch 4 related companies in the same city
  const { data: related } = await supabase
    .from("listings")
    .select("id, title, slug, locality, city, company_type, funding_stage, active_jobs_count, website")
    .eq("status", "published")
    .not("company_type", "is", null)
    .neq("id", company.id)
    .ilike("city", `%${company.city || "Bangalore"}%`)
    .order("active_jobs_count", { ascending: false })
    .limit(4);

  return {
    company,
    jobs: jobs || [],
    related: related || [],
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCompanyBySlug(slug);

  if (!result) {
    return {
      title: "Company Not Found | LocaToGo",
      description: "The requested tech company profile could not be found.",
    };
  }

  const { company, jobs } = result;
  const locationStr = [company.locality, company.city || "India"].filter(Boolean).join(", ");
  const activeCount = jobs.length > 0 ? jobs.length : (company.active_jobs_count || 0);
  const typeDisplay = (company.company_type || "Technology Company").replace(/_/g, " ");

  const title = `${company.title} Careers, Tech Stack & Office | LocaToGo`;
  const description = `${company.title} in ${locationStr}. Verified ${typeDisplay} with ${activeCount} open tech jobs. Explore engineering tech stack, office address, and direct career portal links.`;
  const url = `https://locatogo.com/company/${company.slug}`;

  return {
    title,
    description,
    keywords: [
      company.title,
      `${company.title} careers`,
      `${typeDisplay} companies`,
      `${company.city || "global"} tech companies`,
      "live tech jobs",
    ],
    alternates: {
      canonical: `/company/${company.slug}`,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "LocaToGo",
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(company.title)}&category=${encodeURIComponent(typeDisplay)}&locality=${encodeURIComponent(locationStr)}&jobs=${activeCount}`,
          width: 1200,
          height: 630,
          alt: `${company.title} on LocaToGo`,
        },
      ],
      type: "article",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        `/api/og?title=${encodeURIComponent(company.title)}&category=${encodeURIComponent(typeDisplay)}&locality=${encodeURIComponent(locationStr)}&jobs=${activeCount}`,
      ],
    },
  };
}

export default async function CompanyProfilePage({ params }: Props) {
  const { slug } = await params;
  const result = await getCompanyBySlug(slug);

  if (!result) {
    notFound();
  }

  const { company, jobs, related } = result;
  const companyCity = company.city || "Bangalore";
  const companyCountryCode = company.country_code || "IN";
  const matchingCityHub = GLOBAL_TECH_HUBS.find(
    (h) => matchesHub(company, h)
  ) || GLOBAL_TECH_HUBS[0];

  const localJobs = jobs.filter((j: any) => jobMatchesLocation(j.location_name, companyCity));
  const activeJobsCount = jobs.length > 0 ? (localJobs.length > 0 ? localJobs.length : jobs.length) : (company.active_jobs_count || 0);
  const typeDisplay = (company.company_type || "Product SaaS").replace(/_/g, " ");
  const companyUrl = company.website || company.careers_url;

  // JSON-LD Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `https://locatogo.com/company/${company.slug}#organization`,
    "name": company.title,
    "url": company.website || `https://locatogo.com/company/${company.slug}`,
    "description": company.short_description,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": company.address_line_1,
      "addressLocality": company.locality || company.city,
      "addressRegion": company.city,
      "addressCountry": companyCountryCode,
    },
    ...(company.latitude && company.longitude
      ? {
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": company.latitude,
            "longitude": company.longitude,
          },
        }
      : {}),
    ...(company.founded_year ? { "foundingDate": `${company.founded_year}` } : {}),
    ...(company.employee_range ? { "numberOfEmployees": company.employee_range } : {}),
  };

  // JSON-LD JobPosting Schemas for Google for Jobs
  const jobPostingSchemas = (jobs || []).slice(0, 20).map((j: any) => ({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": j.title,
    "description": `${j.title} position at ${company.title} in ${j.location_name || companyCity}. Apply directly on company portal.`,
    "datePosted": j.posted_at || company.created_at || new Date().toISOString(),
    "employmentType": j.workplace_type === "remote" ? "FULL_TIME" : "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": company.title,
      "sameAs": company.website,
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": j.location_name || companyCity,
        "addressCountry": companyCountryCode,
      },
    },
    ...(j.workplace_type === "remote" ? { "jobLocationType": "TELECOMMUTE" } : {}),
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": companyCountryCode,
    },
    "directApply": true,
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <BrandLogo size={36} className="group-hover:scale-105 transition-transform" />
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-none">
                  LocaToGo<span className="text-cyan-600">.</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                  Tech Atlas
                </span>
              </div>
            </Link>

            {/* Breadcrumb path */}
            <nav className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>/</span>
              <Link href={`/${matchingCityHub.id}`} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                {matchingCityHub.flag} {matchingCityHub.name}
              </Link>
              {company.locality && (
                <>
                  <span>/</span>
                  <span className="text-slate-400 dark:text-slate-600">{company.locality}</span>
                </>
              )}
              <span>/</span>
              <span className="text-slate-900 dark:text-slate-200 truncate max-w-[200px]">{company.title}</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${matchingCityHub.id}`}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-cyan-400 hover:text-cyan-600 transition-colors shadow-2xs"
            >
              <span>🗺️</span>
              <span>Open {matchingCityHub.name} Map</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 2. Company Profile Hero */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0d1424] p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
            {/* Left: Brand identity */}
            <div className="flex items-start gap-4 sm:gap-5 min-w-0">
              <CompanyBrandAvatar
                title={company.title}
                website={company.website}
                size={72}
                className="rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 shrink-0"
              />

              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {company.title}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Verified Tech Entity
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    📍 {company.locality ? `${company.locality}, ` : ""}{companyCity}
                  </span>
                  <span>•</span>
                  <span className="rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                    {typeDisplay}
                  </span>
                  {company.funding_stage && (
                    <span className="rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 text-[11px] font-semibold">
                      {company.funding_stage}
                    </span>
                  )}
                  {company.employee_range && (
                    <span>👥 {company.employee_range} employees</span>
                  )}
                  {company.founded_year && (
                    <span>📅 Founded {company.founded_year}</span>
                  )}
                </div>

                {company.short_description && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl pt-1">
                    {company.short_description}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Primary Action Buttons */}
            <div className="flex flex-wrap md:flex-col items-stretch gap-2.5 shrink-0 pt-2 md:pt-0">
              {company.careers_url ? (
                <a
                  href={company.careers_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs px-5 py-3 text-center shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🚀</span>
                  <span>Official Careers Portal</span>
                  <span>↗</span>
                </a>
              ) : company.website ? (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs px-5 py-3 text-center shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🌐</span>
                  <span>Visit Website</span>
                  <span>↗</span>
                </a>
              ) : null}

              {company.website && company.careers_url && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2.5 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🌐</span>
                  <span>Company Website</span>
                  <span>↗</span>
                </a>
              )}

              <ShareButton
                title={`${company.title} on LocaToGo`}
                url={`https://locatogo.com/company/${company.slug}`}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              />
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Openings</p>
              <p className="text-xl font-black text-cyan-600 dark:text-cyan-400 mt-0.5">
                {activeJobsCount} {activeJobsCount === 1 ? "Role" : "Roles"}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tech Ecosystem</p>
              <p className="text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                {matchingCityHub.name}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Company Stage</p>
              <p className="text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                {company.funding_stage || "Product"}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Team Size</p>
              <p className="text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                {company.employee_range || "Established"}
              </p>
            </div>
          </div>
        </div>

        {/* 2.5 About the Company (Long Description) */}
        {company.description && (
          <section className="rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0d1424] p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📖</span>
              <span>About {company.title}</span>
            </h2>
            <div className="pt-1 prose prose-sm sm:prose-base dark:prose-invert prose-slate max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
              <p className="whitespace-pre-wrap">{company.description}</p>
            </div>
          </section>
        )}

        {/* 3. Tech Stack Tags */}
        {company.tech_stack && company.tech_stack.length > 0 && (
          <section className="rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0d1424] p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>⚡</span>
              <span>Engineering Tech Stack &amp; Core Tools</span>
            </h2>
            <div className="flex flex-wrap gap-2 pt-1">
              {company.tech_stack.map((tech: string) => (
                <span
                  key={tech}
                  className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 4. Live Job Openings – Interactive Filter */}
        <CompanyJobsFilter
          jobs={jobs}
          companyTitle={company.title}
          companyCity={companyCity}
          careersUrl={company.careers_url}
          websiteUrl={company.website}
          localJobCount={localJobs.length}
          totalJobCount={jobs.length}
        />

        {/* 5. Office Location & Map Details */}
        <section className="rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0d1424] p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>📍</span>
            <span>Office Headquarters &amp; Physical Address</span>
          </h2>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {company.address_line_1 || `${company.locality || "Tech Hub"}, ${companyCity}`}
              </p>
              <p className="text-xs text-slate-500">
                {company.locality ? `${company.locality}, ` : ""}{companyCity}, India
              </p>
              {company.latitude && company.longitude && (
                <p className="text-[11px] font-mono text-slate-400">
                  Coordinates: {company.latitude.toFixed(4)}° N, {company.longitude.toFixed(4)}° E
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/${matchingCityHub.id}`}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-cyan-400 hover:text-cyan-600 transition-colors"
              >
                View on {matchingCityHub.name} Atlas →
              </Link>
            </div>
          </div>
        </section>

        {/* 6. Related Tech Companies in Same Hub */}
        {related && related.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🏢</span>
              <span>More Tech Companies in {matchingCityHub.name}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((rel: any) => (
                <Link
                  key={rel.id}
                  href={`/company/${rel.slug}`}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0d1424] p-4 shadow-2xs hover:shadow-md hover:border-cyan-400 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CompanyBrandAvatar
                        title={rel.title}
                        website={rel.website}
                        size={36}
                        className="rounded-lg shadow-2xs shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                          {rel.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate">
                          📍 {rel.locality || rel.city}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 px-1.5 py-0.5 font-bold uppercase text-[9px]">
                      {(rel.company_type || "Tech").replace(/_/g, " ")}
                    </span>
                    {rel.active_jobs_count > 0 ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {rel.active_jobs_count} jobs
                      </span>
                    ) : (
                      <span className="text-slate-400">Profile →</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 7. Footer */}
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} LocaToGo. Global Tech Atlas &amp; Startup Directory.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-cyan-600">Global Map</Link>
            <Link href={`/${matchingCityHub.id}`} className="hover:text-cyan-600">{matchingCityHub.name} Directory</Link>
            <Link href="/about" className="hover:text-cyan-600">About</Link>
            <Link href="/submit" className="hover:text-cyan-600">List Company</Link>
          </div>
        </div>
      </footer>

      {/* 8. Structured Data JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      {jobPostingSchemas.map((schema: any, idx: number) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}
    </div>
  );
}
