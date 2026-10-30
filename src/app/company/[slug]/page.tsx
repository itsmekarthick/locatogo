import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { GLOBAL_TECH_HUBS, type TechHub, matchesHub } from "@/lib/constants/tech-hubs";
import { jobMatchesLocation } from "@/lib/jobs/location-matcher";
import { CompanyJobsFilter } from "@/components/company-jobs-filter";
import { PlaceMiniMap } from "@/components/place-mini-map";
import { SiteFooter } from "@/components/site-footer";
import { DetailActions } from "@/components/detail/detail-actions";
import { DetailHeader } from "@/components/detail/detail-header";
import { DetailHero } from "@/components/detail/detail-hero";
import { DetailStickyBar } from "@/components/detail/detail-sticky-bar";
import { CompanyReviews, CompanyWeather } from "@/components/detail/company-modules";
import { ModuleCard } from "@/components/detail/module-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  ArrowUpRightIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  CodeIcon,
  FileTextIcon,
  GlobeIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@/components/ui/icons";

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

  // Prioritize listings that have active jobs and latest updates
  query = query
    .order("active_jobs_count", { ascending: false })
    .order("updated_at", { ascending: false });

  const { data: company } = await query.limit(1).maybeSingle();
  if (!company) return null;

  // Resolve all sibling listing IDs sharing the same slug or title (handles multi-office company profiles)
  let listingIds = [company.id];
  let siblingQuery = supabase.from("listings").select("id");
  if (company.slug) {
    siblingQuery = siblingQuery.or(`slug.eq.${company.slug},title.ilike.${company.title}`);
  } else {
    siblingQuery = siblingQuery.ilike("title", company.title);
  }
  const { data: siblings } = await siblingQuery;
  if (siblings && siblings.length > 0) {
    listingIds = Array.from(new Set([company.id, ...siblings.map((s: any) => s.id)]));
  }

  // Fetch active company jobs across all office listings
  const { data: jobs } = await supabase
    .from("company_jobs")
    .select(
      "id, title, department, location_name, workplace_type, experience_level, salary_range, apply_url, posted_at, is_active"
    )
    .in("listing_id", listingIds)
    .eq("is_active", true)
    .order("posted_at", { ascending: false });

  const activeJobsList = jobs || [];
  if (company.active_jobs_count === 0 && activeJobsList.length > 0) {
    company.active_jobs_count = activeJobsList.length;
  }

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
    jobs: activeJobsList,
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
  const activeCount = company.active_jobs_count || jobs.length || 0;
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
  const activeJobsCount = company.active_jobs_count || jobs.length || 0;
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

  const hubHref = `/${matchingCityHub.id}`;
  const hasCoordinates = typeof company.latitude === "number" && typeof company.longitude === "number";
  const primaryAction = company.careers_url
    ? { href: company.careers_url as string, label: "Careers portal", icon: <BriefcaseIcon className="size-4 shrink-0" /> }
    : company.website
      ? { href: company.website as string, label: "Visit website", icon: <GlobeIcon className="size-4 shrink-0" /> }
      : null;

  const techStack: string[] = company.tech_stack ?? [];
  const aboutText: string | null = company.description || company.short_description || null;
  const facts: { label: string; value: string }[] = [
    { label: "Open roles", value: activeJobsCount.toLocaleString("en-US") },
    { label: "Tech hub", value: matchingCityHub.name },
    { label: "Stage", value: company.funding_stage || "Not disclosed" },
    { label: "Team size", value: company.employee_range ? `${company.employee_range} people` : "Not disclosed" },
    { label: "Founded", value: company.founded_year ? String(company.founded_year) : "Not disclosed" },
    { label: "Type", value: typeDisplay.replace(/\b\w/g, (c: string) => c.toUpperCase()) },
  ];

  const sections = [
    { id: "overview", label: "Overview" },
    ...(techStack.length > 0 ? [{ id: "stack", label: "Tech stack" }] : []),
    { id: "jobs", label: "Jobs" },
    { id: "location", label: "Location", aside: true },
    { id: "reviews", label: "Reviews" },
    ...(related && related.length > 0 ? [{ id: "similar", label: "Similar" }] : []),
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-surface-0 text-fg antialiased">
      <DetailHeader
        crumbs={[
          { label: "Tech Atlas", href: "/" },
          { label: matchingCityHub.name, href: hubHref },
          { label: company.title },
        ]}
        cta={{ href: hubHref, label: `${matchingCityHub.name} map` }}
      />

      <DetailHero
        avatar={<CompanyBrandAvatar title={company.title} website={company.website} size={88} className="rounded-xl" />}
        title={company.title}
        chips={
          <>
            <Badge variant="success" icon={<ShieldCheckIcon className="size-3.5" />}>
              Verified
            </Badge>
            {activeJobsCount > 0 && (
              <Badge variant="accent" dot>
                {activeJobsCount.toLocaleString("en-US")} open {activeJobsCount === 1 ? "role" : "roles"}
              </Badge>
            )}
            <Badge className="capitalize">{typeDisplay}</Badge>
            {company.funding_stage && <Badge variant="info">{company.funding_stage}</Badge>}
          </>
        }
        meta={
          <>
            <span className="inline-flex items-center gap-1.5">
              <MapPinIcon className="size-4 text-fg-subtle" />
              {[company.locality, companyCity].filter(Boolean).join(", ")}
            </span>
            {company.employee_range && (
              <span className="inline-flex items-center gap-1.5">
                <UsersIcon className="size-4 text-fg-subtle" />
                {company.employee_range} employees
              </span>
            )}
            {company.founded_year && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="size-4 text-fg-subtle" />
                Founded {company.founded_year}
              </span>
            )}
          </>
        }
        summary={company.short_description}
      />

      <DetailStickyBar sections={sections} className="mt-6">
        <DetailActions
          primary={primaryAction}
          listingId={company.id}
          shareTitle={`${company.title} on LocaToGo`}
          shareUrl={`https://locatogo.com/company/${company.slug}`}
          latitude={company.latitude}
          longitude={company.longitude}
        />
      </DetailStickyBar>

      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-[minmax(0,1fr)] items-start gap-8 px-4 pb-28 pt-8 sm:px-6 lg:pb-16 lg:grid-cols-[minmax(0,1fr)_23.75rem] lg:px-8">
        <div className="min-w-0 space-y-6">
          <ModuleCard id="overview" icon={<FileTextIcon />} title={`About ${company.title}`}>
            {aboutText ? (
              <p className="max-w-[65ch] whitespace-pre-wrap text-pretty leading-relaxed text-fg-muted">{aboutText}</p>
            ) : (
              <p className="text-sm text-fg-subtle">{company.title} hasn&apos;t added a description yet.</p>
            )}

            <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.label} className="bg-surface-1 p-4">
                  <dt className="text-xs text-fg-subtle">{fact.label}</dt>
                  <dd className="mt-1 truncate font-display text-base font-semibold tracking-tight text-fg">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </ModuleCard>

          {techStack.length > 0 && (
            <ModuleCard id="stack" icon={<CodeIcon />} title="Tech stack" description="Languages, frameworks and tools the engineering team uses.">
              <ul role="list" className="flex flex-wrap gap-2">
                {techStack.map((tech) => (
                  <li key={tech} className="rounded-lg border border-line bg-surface-3 px-2.5 py-1 font-mono text-xs text-fg-muted">
                    {tech}
                  </li>
                ))}
              </ul>
            </ModuleCard>
          )}

          <CompanyJobsFilter
            jobs={jobs}
            companyTitle={company.title}
            companyCity={companyCity}
            careersUrl={company.careers_url}
            websiteUrl={company.website}
            localJobCount={localJobs.length}
            totalJobCount={activeJobsCount}
          />

          <CompanyReviews listingId={company.id} />

          {related && related.length > 0 && (
            <ModuleCard
              id="similar"
              icon={<BuildingIcon />}
              title={`More companies in ${matchingCityHub.name}`}
              action={
                <Link href={hubHref} className="focus-ring inline-flex items-center gap-1 rounded text-sm font-medium text-accent-text hover:underline">
                  Explore all
                  <ArrowUpRightIcon className="size-4" />
                </Link>
              }
            >
              <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {related.map((rel: any) => (
                  <li key={rel.id}>
                    <Link
                      href={`/company/${rel.slug}`}
                      className="focus-ring group flex items-center gap-3 rounded-xl border border-line bg-surface-1 p-3.5 lift hover:border-line-strong hover:bg-surface-3/50"
                    >
                      <CompanyBrandAvatar title={rel.title} website={rel.website} size={40} className="shrink-0 rounded-lg" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-fg">{rel.title}</span>
                        <span className="block truncate text-xs text-fg-subtle">
                          {[rel.locality || rel.city, (rel.company_type || "tech").replace(/_/g, " ")].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      {rel.active_jobs_count > 0 && (
                        <Badge variant="success" size="sm">
                          {rel.active_jobs_count.toLocaleString("en-US")} {rel.active_jobs_count === 1 ? "role" : "roles"}
                        </Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </ModuleCard>
          )}
        </div>

        <aside aria-label="Location and conditions" className="space-y-6 lg:sticky lg:top-36">
          <ModuleCard id="location" icon={<MapPinIcon />} title="Location" description={[company.locality, companyCity].filter(Boolean).join(", ")}>
            {hasCoordinates ? (
              <PlaceMiniMap
                listing={{
                  id: company.id,
                  title: company.title,
                  slug: company.slug,
                  locality: company.locality,
                  city: company.city,
                  website: company.website,
                  latitude: company.latitude,
                  longitude: company.longitude,
                }}
              />
            ) : (
              <p className="rounded-xl border border-dashed border-line-strong p-4 text-sm text-fg-muted">
                Exact coordinates haven&apos;t been verified for this office yet.
              </p>
            )}
            {company.address_line_1 && <p className="mt-4 text-sm text-fg">{company.address_line_1}</p>}
            {hasCoordinates && (
              <p className="mt-1 font-mono text-xs text-fg-subtle">
                {company.latitude.toFixed(4)}, {company.longitude.toFixed(4)}
              </p>
            )}
            <Link href={hubHref} className={buttonVariants({ variant: "secondary", size: "sm", fullWidth: true, className: "mt-4" })}>
              View on {matchingCityHub.name} atlas
              <ArrowUpRightIcon className="size-4" />
            </Link>
          </ModuleCard>

          {hasCoordinates && <CompanyWeather latitude={company.latitude} longitude={company.longitude} locality={company.locality} />}
        </aside>
      </div>

      <SiteFooter />
      <div aria-hidden="true" className="h-[calc(5rem+env(safe-area-inset-bottom))] lg:hidden" />

      {/* Structured Data JSON-LD */}
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
