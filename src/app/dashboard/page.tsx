import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminKpiCard } from "@/components/admin-kpi-card";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { ContentEnter } from "@/components/page-transition";
import { ResumeOnboarding } from "@/components/resume-onboarding";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, BriefcaseIcon, BuildingIcon, HeartIcon, MapPinIcon, PlusIcon, ShieldCheckIcon, UploadIcon } from "@/components/ui/icons";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileEditor } from "./profile-editor";
import { ProfileStrength, type StrengthItem } from "./profile-strength";
import { RolesPanel, type DashboardRole } from "./roles-panel";

export const metadata = {
  title: "My Dashboard | LocaToGo",
  description: "Manage your professional profile, job matches, submissions, claims, and saved places.",
};

type Listing = { title?: string | null; slug?: string | null; city?: string | null; locality?: string | null; website?: string | null };

function listing(value: Listing | Listing[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function date(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function statusVariant(status: string): BadgeVariant {
  if (status === "approved" || status === "published") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard");

  const { data: account } = await supabase
    .from("profiles")
    .select("display_name, platform_role")
    .eq("id", user.id)
    .maybeSingle();
  const isTechUser = account?.platform_role === "tech_user";

  const [{ data: techProfile }, { data: submissions }, { data: claims }, { data: favorites }] = await Promise.all([
    isTechUser
      ? supabase.from("tech_profiles").select("bio, skills, preferred_location, github_url, linkedin_url, portfolio_url, resume_storage_path").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("listing_submissions").select("id, status, payload_json, submitted_at").eq("submitted_by_user_id", user.id).order("submitted_at", { ascending: false }).limit(20),
    supabase.from("listing_claims").select("id, status, submitted_at, listings(id, title, slug, city, locality)").eq("user_id", user.id).order("submitted_at", { ascending: false }).limit(20),
    supabase.from("user_favorites").select("id, created_at, listings(id, title, slug, city, locality, website)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const skills: string[] = Array.isArray(techProfile?.skills)
    ? techProfile.skills.filter((skill): skill is string => typeof skill === "string")
    : [];
  let jobs: any[] = [];
  if (isTechUser && skills.length) {
    const filters = skills.slice(0, 12).map((skill) => `title.ilike.%${skill}%,department.ilike.%${skill}%`).join(",");
    let query = supabase
      .from("company_jobs")
      .select("id, title, department, location_name, workplace_type, apply_url, listings(title, slug, city, website)")
      .eq("is_active", true)
      .or(filters)
      .limit(8);
    if (techProfile?.preferred_location && techProfile.preferred_location !== "Remote") {
      query = query.or(`location_name.ilike.%${techProfile.preferred_location}%,workplace_type.eq.remote`);
    }
    const { data } = await query;
    jobs = data || [];
  }

  let resumeUrl: string | null = null;
  if (techProfile?.resume_storage_path) {
    const { data } = await supabase.storage.from("resumes").createSignedUrl(techProfile.resume_storage_path, 300);
    resumeUrl = data?.signedUrl || null;
  }

  const displayName = account?.display_name || user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Member";
  const firstName = String(displayName).split(" ")[0];

  const savedDates = (favorites ?? []).map((item) => item.created_at);
  const submissionDates = (submissions ?? []).map((item) => item.submitted_at);
  const claimDates = (claims ?? []).map((item) => item.submitted_at);

  const hasResume = Boolean(techProfile?.resume_storage_path);
  const strengthItems: StrengthItem[] = [
    { label: "Bio added", done: Boolean(techProfile?.bio?.trim()), href: "#profile", hint: "Write a short bio" },
    { label: "Skills listed", done: skills.length >= 3, href: "#profile", hint: "Add at least 3 skills" },
    { label: "Preferred location set", done: Boolean(techProfile?.preferred_location?.trim()), href: "#profile", hint: "Set your preferred location" },
    { label: "Professional link added", done: Boolean(techProfile?.github_url || techProfile?.linkedin_url || techProfile?.portfolio_url), href: "#profile", hint: "Link GitHub, LinkedIn or a portfolio" },
    { label: "Resume uploaded", done: hasResume, href: "#resume", hint: "Upload your resume" },
  ];

  const roles: DashboardRole[] = jobs.map((job) => {
    const company = listing(job.listings as Listing | Listing[] | null);
    const haystack = `${job.title ?? ""} ${job.department ?? ""}`.toLowerCase();
    return {
      id: String(job.id),
      title: String(job.title),
      company: company?.title || "Tech company",
      slug: company?.slug || null,
      website: company?.website || null,
      location: job.location_name || company?.city || "Location not listed",
      workplace: job.workplace_type ? String(job.workplace_type) : null,
      applyUrl: job.apply_url || null,
      matched: skills.filter((skill) => haystack.includes(skill.toLowerCase())).slice(0, 4),
    };
  });

  const subtitle = isTechUser
    ? roles.length
      ? `${roles.length} open ${roles.length === 1 ? "role matches" : "roles match"} your ${skills.slice(0, 2).join(" and ") || "profile"}${skills.length > 2 ? " skills" : ""}.`
      : "Complete your profile to start receiving role matches."
    : "Your saved companies and directory activity in one place.";

  return (
    <ContentEnter><div className="min-h-dvh bg-surface-0 text-fg">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link href="/map" className="focus-ring inline-flex items-center gap-1.5 rounded text-sm text-fg-muted transition-colors hover:text-fg">
            <ArrowLeftIcon className="size-4" />
            Back to Tech Atlas
          </Link>
          <UserProfileMenu />
        </div>

        <section className="adm-rise relative overflow-hidden rounded-3xl border border-line bg-linear-to-br from-accent-soft via-surface-1 to-surface-1 p-6 elev-sm sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-accent/10 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-info/10 blur-3xl" />

          <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
            <div className="min-w-0">
              <div className="flex items-center gap-4">
                <Avatar name={String(displayName)} src={user.user_metadata?.avatar_url} size="lg" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-accent-text">Dashboard</p>
                  <h1 className="mt-1 text-balance font-display text-[clamp(1.875rem,3.6vw,2.75rem)] font-semibold leading-tight tracking-tight">Welcome back, {firstName}.</h1>
                </div>
              </div>
              <p className="mt-4 max-w-xl text-pretty text-base text-fg-muted">{subtitle}</p>

              {isTechUser && (
                <ul role="list" className="mt-4 flex flex-wrap gap-2">
                  {techProfile?.preferred_location && (
                    <li>
                      <Badge icon={<MapPinIcon className="size-3.5" />}>{techProfile.preferred_location}</Badge>
                    </li>
                  )}
                  <li>
                    <Badge>
                      {skills.length} {skills.length === 1 ? "skill" : "skills"}
                    </Badge>
                  </li>
                  <li>
                    <Badge variant={hasResume ? "success" : "warning"} dot>
                      {hasResume ? "Resume on file" : "No resume yet"}
                    </Badge>
                  </li>
                </ul>
              )}

              <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
                <Link href="/map" className={buttonVariants({ size: "lg" })}>
                  Explore companies
                  <ArrowRightIcon className="size-4" />
                </Link>
                <Link href="/submit" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                  <PlusIcon className="size-4" />
                  Suggest a company
                </Link>
                {isTechUser && (
                  <Link href="#resume" className={buttonVariants({ variant: "ghost", size: "lg" })}>
                    <UploadIcon className="size-4" />
                    {hasResume ? "Update resume" : "Upload resume"}
                  </Link>
                )}
              </div>
            </div>

            {isTechUser && (
              <div className="rounded-2xl border border-line bg-surface-1/80 p-5 backdrop-blur">
                <ProfileStrength items={strengthItems} />
              </div>
            )}
          </div>
        </section>

        <section aria-label="Your activity at a glance" className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <AdminKpiCard index={1} title="Saved places" value={favorites?.length ?? 0} icon={<HeartIcon />} description="Companies you follow" tone="danger" sparklineData={weeklySeries(savedDates)} trend={monthlyDelta(savedDates)} href="#saved" />
          <AdminKpiCard index={2} title="Submissions" value={submissions?.length ?? 0} icon={<BuildingIcon />} description="Companies you suggested" tone="info" sparklineData={weeklySeries(submissionDates)} trend={monthlyDelta(submissionDates)} href="#activity" />
          <AdminKpiCard index={3} title="Claims" value={claims?.length ?? 0} icon={<ShieldCheckIcon />} description="Listings you claimed" tone="success" sparklineData={weeklySeries(claimDates)} trend={monthlyDelta(claimDates)} href="#activity" />
          {isTechUser && <AdminKpiCard index={4} title="Role matches" value={roles.length} icon={<BriefcaseIcon />} description="Open roles for your skills" tone="accent" href="#matches" />}
        </section>

        {isTechUser && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(19rem,0.8fr)]">
            <div className="min-w-0 space-y-6">
              <Panel id="profile">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Eyebrow>Professional profile</Eyebrow>
                    <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">Show employers the work you do best.</h2>
                  </div>
                  <ProfileEditor
                    displayName={String(displayName)}
                    bio={techProfile?.bio || null}
                    skills={skills}
                    preferredLocation={techProfile?.preferred_location || null}
                    githubUrl={techProfile?.github_url || null}
                    linkedinUrl={techProfile?.linkedin_url || null}
                    portfolioUrl={techProfile?.portfolio_url || null}
                  />
                </div>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-fg-muted">About</p>
                    <p className="mt-2 text-sm leading-6">{techProfile?.bio || <span className="text-fg-subtle">Add a concise bio so the right opportunities can find you.</span>}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-fg-muted">Top skills</p>
                    {skills.length ? (
                      <ul role="list" className="mt-2 flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <li key={skill}>
                            <Badge variant="accent">{skill}</Badge>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-fg-subtle">Add skills to improve your recommendations.</p>
                    )}
                  </div>
                </div>
              </Panel>

              <Panel id="matches">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <Eyebrow>Your matches</Eyebrow>
                    <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">Roles aligned with your stack</h2>
                    <p className="mt-1 text-sm text-fg-muted">{skills.length ? `Matching ${skills.slice(0, 4).join(", ")}.` : "Upload a resume or add skills to receive matches."}</p>
                  </div>
                  <Link href="/map" className="focus-ring rounded text-sm font-medium text-accent-text hover:underline">
                    Browse the atlas
                  </Link>
                </div>
                {roles.length ? (
                  <RolesPanel roles={roles} />
                ) : (
                  <div className="mt-6 rounded-xl border border-dashed border-line-strong">
                    <EmptyState className="py-8" icon={<BriefcaseIcon />} title="No matching roles yet" description="Add your skills or upload a current resume to personalize this section." />
                  </div>
                )}
              </Panel>
            </div>

            <aside className="min-w-0 space-y-6 lg:sticky lg:top-6 lg:self-start">
              <Panel>
                <p className="text-sm font-medium text-fg-muted">Professional links</p>
                <div className="mt-4 space-y-3 text-sm">
                  <ProfileLink label="GitHub" href={techProfile?.github_url || null} />
                  <ProfileLink label="LinkedIn" href={techProfile?.linkedin_url || null} />
                  <ProfileLink label="Portfolio" href={techProfile?.portfolio_url || null} />
                  <ProfileLink label="Resume" href={resumeUrl} unavailable="Upload a PDF below" />
                </div>
              </Panel>
              <ResumeOnboarding hasResume={hasResume} />
            </aside>
          </div>
        )}

        <Panel className="mt-6" id="saved">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Eyebrow>Saved companies</Eyebrow>
              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">Your shortlist</h2>
            </div>
            <Badge>{(favorites?.length ?? 0).toLocaleString("en-US")}</Badge>
          </div>

          {favorites?.length ? (
            <ul role="list" className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {favorites.map((item) => {
                const company = listing(item.listings as Listing | Listing[] | null);
                const place = [company?.locality, company?.city].filter(Boolean).join(", ");
                const card = (
                  <>
                    <CompanyBrandAvatar title={company?.title || "Saved listing"} website={company?.website} size={44} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{company?.title || "Saved listing"}</span>
                      <span className="block truncate text-xs text-fg-subtle">{place || "Location not listed"}</span>
                      <span className="mt-0.5 block text-xs text-fg-subtle">Saved {date(item.created_at)}</span>
                    </span>
                    <ArrowUpRightIcon className="size-4 shrink-0 text-fg-subtle transition-transform duration-200 motion-safe:group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
                  </>
                );
                return (
                  <li key={item.id}>
                    {company?.slug ? (
                      <Link href={`/listing/${company.slug}`} className="focus-ring group flex items-center gap-3 rounded-xl border border-line bg-surface-1 p-3.5 lift hover:border-line-strong hover:bg-surface-3/50">
                        {card}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-1 p-3.5">{card}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-line-strong">
              <EmptyState
                className="py-10"
                icon={<HeartIcon />}
                title="Nothing saved yet"
                description="Save a company from the Tech Atlas to find it here."
                action={
                  <Link href="/map" className={buttonVariants({ variant: "secondary" })}>
                    Explore the atlas
                  </Link>
                }
              />
            </div>
          )}
        </Panel>

        <section id="activity" className="mt-6 grid scroll-mt-24 grid-cols-1 gap-6 lg:grid-cols-2">
          <Activity title="My submissions" count={submissions?.length || 0} empty="You have not submitted a company yet." action={{ href: "/submit", label: "Suggest a company" }}>
            {submissions?.map((item) => {
              const payload = item.payload_json as { name?: string; locality?: string; city?: string } | null;
              return <ActivityItem key={item.id} title={payload?.name || "Company submission"} detail={[payload?.locality, payload?.city, date(item.submitted_at)].filter(Boolean).join(" · ")} status={item.status} />;
            })}
          </Activity>
          <Activity title="My claims" count={claims?.length || 0} empty="You have not claimed a listing yet.">
            {claims?.map((item) => {
              const company = listing(item.listings as Listing | Listing[] | null);
              return <ActivityItem key={item.id} title={company?.title || "Listing claim"} detail={[company?.locality, company?.city, date(item.submitted_at)].filter(Boolean).join(" · ")} status={item.status} href={company?.slug ? `/listing/${company.slug}` : undefined} />;
            })}
          </Activity>
        </section>
      </div>
    </div></ContentEnter>
  );
}

const DAY_MS = 86_400_000;

/** Items per week over the last `weeks` weeks, oldest first; undefined when there is nothing to draw. */
function weeklySeries(dates: string[], weeks = 8) {
  const now = Date.now();
  const series = Array.from({ length: weeks }, (_, i) => {
    const start = now - (weeks - i) * 7 * DAY_MS;
    const end = start + 7 * DAY_MS;
    return dates.filter((value) => {
      const time = new Date(value).getTime();
      return time >= start && time < end;
    }).length;
  });
  return series.some(Boolean) ? series : undefined;
}

/** Change in items over the last 30 days against the 30 before, as a percentage. */
function monthlyDelta(dates: string[]) {
  const now = Date.now();
  const recent = dates.filter((value) => now - new Date(value).getTime() < 30 * DAY_MS).length;
  const prior = dates.filter((value) => {
    const age = now - new Date(value).getTime();
    return age >= 30 * DAY_MS && age < 60 * DAY_MS;
  }).length;
  if (recent === 0 && prior === 0) return null;
  const value = prior === 0 ? 100 : Math.round(((recent - prior) / prior) * 100);
  return { value, label: "vs prior 30 days" };
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium uppercase tracking-wider text-accent-text">{children}</p>;
}

function Panel({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`scroll-mt-24 rounded-2xl border border-line bg-surface-1 p-5 elev-sm sm:p-6 ${className ?? ""}`}>
      {children}
    </section>
  );
}

function ProfileLink({ label, href, unavailable = "Not connected" }: { label: string; href: string | null; unavailable?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-medium">{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-1 rounded text-sm font-medium text-accent-text hover:underline">
          View
          <ArrowUpRightIcon className="size-3.5" />
        </a>
      ) : (
        <span className="text-sm text-fg-subtle">{unavailable}</span>
      )}
    </div>
  );
}

function Activity({ title, count, empty, action, children }: { title: string; count: number; empty: string; action?: { href: string; label: string }; children: ReactNode }) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
        <Badge>{count.toLocaleString("en-US")}</Badge>
      </div>
      {count ? (
        <div className="mt-4 space-y-3">{children}</div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-line-strong p-4 text-sm text-fg-muted">
          <p>{empty}</p>
          {action && (
            <Link href={action.href} className="focus-ring mt-2 inline-flex items-center gap-1 rounded text-sm font-medium text-accent-text hover:underline">
              {action.label}
              <ArrowRightIcon className="size-4" />
            </Link>
          )}
        </div>
      )}
    </Panel>
  );
}

function ActivityItem({ title, detail, status, href }: { title: string; detail: string; status?: string; href?: string }) {
  const content = (
    <>
      <p className="truncate text-sm font-medium">{title}</p>
      <p className="mt-0.5 text-xs text-fg-subtle">{detail}</p>
    </>
  );
  return (
    <div className="flex items-start justify-between gap-3">
      {href ? (
        <Link href={href} className="focus-ring min-w-0 rounded transition-colors hover:text-accent-text">
          {content}
        </Link>
      ) : (
        <div className="min-w-0">{content}</div>
      )}
      {status && (
        <Badge variant={statusVariant(status)} size="sm" className="capitalize">
          {status.replace(/_/g, " ")}
        </Badge>
      )}
    </div>
  );
}
