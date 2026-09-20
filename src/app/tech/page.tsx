import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function TechDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch standard profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.platform_role !== "tech_user") {
    // If somehow a non-tech user lands here, send them to admin
    redirect("/admin");
  }

  // Fetch tech profile
  const { data: techProfile } = await supabase
    .from("tech_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-[var(--foreground)]">
          Welcome back, {profile?.display_name?.split(" ")[0] || "Tech Professional"}.
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Manage your professional profile, skills, and discover tech companies.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Technical Profile</h2>
              <button className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">
                Edit Profile
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider">Bio</label>
                <p className="mt-1 text-sm text-[var(--foreground)]">
                  {techProfile?.bio || "No bio added yet. Tell companies about yourself!"}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider mb-2 block">Top Skills</label>
                {techProfile?.skills && techProfile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {techProfile.skills.map((skill: string) => (
                      <span key={skill} className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-100 dark:border-indigo-900/60">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--ink-muted)] italic">No skills listed.</p>
                )}
              </div>
            </div>
          </div>

          {/* Activity / Applied Jobs */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">Recent Activity</h2>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-12 w-12 rounded-full bg-[var(--background)] flex items-center justify-center text-xl mb-3">
                💼
              </div>
              <p className="text-sm font-medium text-[var(--foreground)]">You haven't applied to any jobs yet.</p>
              <p className="text-xs text-[var(--ink-muted)] mt-1 mb-4">Explore the atlas to find your next role.</p>
              <Link 
                href="/company" 
                className="rounded-xl bg-indigo-600 text-white px-5 py-2.5 text-xs font-bold shadow-sm hover:bg-indigo-700 transition-colors"
              >
                Explore Companies
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          {/* Links Card */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">Social & Links</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--background)] flex items-center justify-center text-sm">
                  🐙
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[var(--foreground)]">GitHub</p>
                  <p className="text-xs text-[var(--ink-muted)] truncate">
                    {techProfile?.github_url ? (
                      <a href={techProfile.github_url} target="_blank" rel="noreferrer" className="hover:underline">{techProfile.github_url}</a>
                    ) : (
                      "Not connected"
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--background)] flex items-center justify-center text-sm">
                  💼
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[var(--foreground)]">LinkedIn</p>
                  <p className="text-xs text-[var(--ink-muted)] truncate">
                    {techProfile?.linkedin_url ? (
                      <a href={techProfile.linkedin_url} target="_blank" rel="noreferrer" className="hover:underline">{techProfile.linkedin_url}</a>
                    ) : (
                      "Not connected"
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--background)] flex items-center justify-center text-sm">
                  📄
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[var(--foreground)]">Resume</p>
                  <p className="text-xs text-[var(--ink-muted)] truncate">
                    {techProfile?.resume_url ? (
                      <a href={techProfile.resume_url} target="_blank" rel="noreferrer" className="hover:underline text-indigo-500">View Document</a>
                    ) : (
                      "No resume uploaded"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
