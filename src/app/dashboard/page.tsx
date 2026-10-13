import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ResumeOnboarding } from "@/components/resume-onboarding";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileEditor } from "./profile-editor";

export const metadata = {
  title: "My Dashboard | LocaToGo",
  description: "Manage your professional profile, job matches, submissions, claims, and saved places.",
};

type Listing = { title?: string | null; slug?: string | null; city?: string | null; locality?: string | null };

function listing(value: Listing | Listing[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function date(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function statusColor(status: string) {
  if (status === "approved" || status === "published") return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800";
  if (status === "rejected") return "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800";
  return "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800";
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
    supabase.from("user_favorites").select("id, created_at, listings(id, title, slug, city, locality)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const skills: string[] = Array.isArray(techProfile?.skills)
    ? techProfile.skills.filter((skill): skill is string => typeof skill === "string")
    : [];
  let jobs: any[] = [];
  if (isTechUser && skills.length) {
    const filters = skills.slice(0, 12).map((skill) => `title.ilike.%${skill}%,department.ilike.%${skill}%`).join(",");
    let query = supabase
      .from("company_jobs")
      .select("id, title, location_name, workplace_type, apply_url, listings(title, slug, city)")
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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.12),_transparent_32%),var(--background)] px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
          <div className="min-w-0">
            <Link href="/map" className="text-xs font-bold text-[var(--ink-muted)] transition hover:text-cyan-600">&larr; Back to Tech Atlas</Link>
            <h1 className="mt-3 font-display text-3xl font-bold text-[var(--foreground)] sm:text-4xl">Welcome back, {firstName}.</h1>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">Your profile, opportunities, and directory activity in one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/map" className="rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-500">Explore companies</Link>
            <UserProfileMenu />
          </div>
        </header>

        {isTechUser && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)]">
            <div className="space-y-6">
              <section className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5 shadow-sm sm:p-7">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div><p className="text-xs font-bold uppercase text-cyan-600">Professional profile</p><h2 className="mt-1 font-display text-xl font-bold text-[var(--foreground)]">Show employers the work you do best.</h2></div>
                  <ProfileEditor displayName={String(displayName)} bio={techProfile?.bio || null} skills={skills} preferredLocation={techProfile?.preferred_location || null} githubUrl={techProfile?.github_url || null} linkedinUrl={techProfile?.linkedin_url || null} portfolioUrl={techProfile?.portfolio_url || null} />
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div><p className="text-xs font-bold uppercase text-[var(--ink-muted)]">About</p><p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{techProfile?.bio || "Add a concise bio so the right opportunities can find you."}</p></div>
                  <div><p className="text-xs font-bold uppercase text-[var(--ink-muted)]">Top skills</p>{skills.length ? <div className="mt-2 flex flex-wrap gap-2">{skills.map((skill) => <span key={skill} className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700 ring-1 ring-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:ring-cyan-900">{skill}</span>)}</div> : <p className="mt-2 text-sm text-[var(--ink-muted)]">Add skills to improve your recommendations.</p>}</div>
                </div>
              </section>

              <section className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5 shadow-sm sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase text-cyan-600">Your matches</p><h2 className="mt-1 font-display text-xl font-bold text-[var(--foreground)]">Roles aligned with your stack</h2><p className="mt-1 text-sm text-[var(--ink-muted)]">{skills.length ? `Matching ${skills.slice(0, 4).join(", ")}.` : "Upload a resume or add skills to receive matches."}</p></div><Link href="/map" className="text-xs font-bold text-cyan-600 hover:text-cyan-700">View all roles &rarr;</Link></div>
                {jobs.length ? <div className="mt-6 grid gap-3 sm:grid-cols-2">{jobs.map((job) => { const company = listing(job.listings as Listing | Listing[] | null); return <article key={job.id} className="flex min-w-0 flex-col justify-between rounded-lg border border-[var(--line)] p-4 transition hover:border-cyan-300 hover:shadow-sm"><div><p className="text-xs font-bold text-cyan-600">{company?.title || "Tech company"}</p><h3 className="mt-1 text-sm font-bold text-[var(--foreground)]">{job.title}</h3><p className="mt-2 text-xs text-[var(--ink-muted)]">{job.location_name || company?.city || "Location not listed"}{job.workplace_type ? ` · ${job.workplace_type}` : ""}</p></div><div className="mt-4 flex items-center justify-between gap-3">{company?.slug ? <Link href={`/listing/${company.slug}`} className="text-xs font-bold text-[var(--ink-muted)] hover:text-[var(--foreground)]">Company</Link> : <span />}{job.apply_url && <a href={job.apply_url} target="_blank" rel="noreferrer" className="rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-cyan-700">Apply ↗</a>}</div></article>; })}</div> : <div className="mt-6 rounded-lg border border-dashed border-[var(--line)] px-5 py-8 text-center text-sm text-[var(--ink-muted)]">No matching roles yet. Add your skills or upload a current resume to personalize this section.</div>}
              </section>

              <section id="applications" className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5 shadow-sm sm:p-7"><p className="text-xs font-bold uppercase text-cyan-600">Applications</p><h2 className="mt-1 font-display text-xl font-bold text-[var(--foreground)]">Application activity</h2><div className="mt-5 border-y border-dashed border-[var(--line)] px-5 py-10 text-center"><p className="text-sm font-bold text-[var(--foreground)]">Application tracking is coming soon.</p><p className="mt-1 text-xs leading-5 text-[var(--ink-muted)]">Roles open their official application pages directly. Your profile and job matches are ready when you are.</p></div></section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5 shadow-sm"><p className="text-xs font-bold uppercase text-[var(--ink-muted)]">Professional links</p><div className="mt-4 space-y-3 text-sm"><ProfileLink label="GitHub" href={techProfile?.github_url || null} /><ProfileLink label="LinkedIn" href={techProfile?.linkedin_url || null} /><ProfileLink label="Portfolio" href={techProfile?.portfolio_url || null} /><ProfileLink label="Resume" href={resumeUrl} unavailable="Upload a PDF below" /></div></section>
              <ResumeOnboarding />
            </aside>
          </div>
        )}

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <Activity title="My submissions" count={submissions?.length || 0} empty="You have not submitted a company yet." action={{ href: "/submit", label: "Suggest a company" }}>{submissions?.map((item) => { const payload = item.payload_json as { name?: string; locality?: string; city?: string } | null; return <ActivityItem key={item.id} title={payload?.name || "Company submission"} detail={[payload?.locality, payload?.city, date(item.submitted_at)].filter(Boolean).join(" · ")} status={item.status} />; })}</Activity>
          <Activity title="My claims" count={claims?.length || 0} empty="You have not claimed a listing yet.">{claims?.map((item) => { const company = listing(item.listings as Listing | Listing[] | null); return <ActivityItem key={item.id} title={company?.title || "Listing claim"} detail={[company?.locality, company?.city, date(item.submitted_at)].filter(Boolean).join(" · ")} status={item.status} href={company?.slug ? `/listing/${company.slug}` : undefined} />; })}</Activity>
          <Activity title="Saved places" count={favorites?.length || 0} empty="Save a company from the Tech Atlas to find it here.">{favorites?.map((item) => { const company = listing(item.listings as Listing | Listing[] | null); return <ActivityItem key={item.id} title={company?.title || "Saved listing"} detail={[company?.locality, company?.city, date(item.created_at)].filter(Boolean).join(" · ")} href={company?.slug ? `/listing/${company.slug}` : undefined} />; })}</Activity>
        </section>
      </div>
    </main>
  );
}

function ProfileLink({ label, href, unavailable = "Not connected" }: { label: string; href: string | null; unavailable?: string }) {
  return <div className="flex items-center justify-between gap-3"><span className="font-bold text-[var(--foreground)]">{label}</span>{href ? <a href={href} target="_blank" rel="noreferrer" className="text-xs font-bold text-cyan-600 hover:underline">View ↗</a> : <span className="text-xs text-[var(--ink-muted)]">{unavailable}</span>}</div>;
}

function Activity({ title, count, empty, action, children }: { title: string; count: number; empty: string; action?: { href: string; label: string }; children: ReactNode }) {
  return <section className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-lg font-bold text-[var(--foreground)]">{title}</h2><span className="rounded-full bg-[var(--background)] px-2 py-0.5 text-xs font-bold text-[var(--ink-muted)]">{count}</span></div>{count ? <div className="mt-4 space-y-3">{children}</div> : <div className="mt-4 rounded-lg border border-dashed border-[var(--line)] p-4 text-sm text-[var(--ink-muted)]">{empty}{action && <Link href={action.href} className="mt-2 block text-xs font-bold text-cyan-600 hover:underline">{action.label} &rarr;</Link>}</div>}</section>;
}

function ActivityItem({ title, detail, status, href }: { title: string; detail: string; status?: string; href?: string }) {
  const content = <><p className="truncate text-sm font-bold text-[var(--foreground)]">{title}</p><p className="mt-1 text-xs text-[var(--ink-muted)]">{detail}</p></>;
  return <div className="flex items-start justify-between gap-3">{href ? <Link href={href} className="min-w-0 hover:text-cyan-600">{content}</Link> : <div className="min-w-0">{content}</div>}{status && <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold capitalize ring-1 ${statusColor(status)}`}>{status.replace("_", " ")}</span>}</div>;
}