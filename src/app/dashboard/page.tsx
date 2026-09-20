import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "My Dashboard | LocaToGo",
  description: "Manage your submitted places, claimed listings, and saved favorites.",
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dashboard");

  // Fetch user's submitted listings
  const { data: submissions } = await supabase
    .from("listings")
    .select("id, title, slug, status, city, locality, created_at")
    .eq("submitted_by", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch user's claimed listings
  const { data: claims } = await supabase
    .from("listing_claims")
    .select("id, status, created_at, listings(id, title, slug, city)")
    .eq("claimant_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch user's favorites
  const { data: favorites } = await supabase
    .from("user_favorites")
    .select("id, created_at, listings(id, title, slug, city, locality, category_id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "User";

  const statusColors: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-800",
    pending_review: "bg-amber-100 text-amber-800",
    draft: "bg-gray-100 text-gray-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <main className="min-h-screen bg-[#fdfdfd] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors"
            >
              ← Back to Map
            </Link>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-gray-900">
              Welcome, {displayName}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{user.email}</p>
          </div>
          <Link
            href="/submit"
            className="rounded-full bg-[#06b6d4] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0891b2] transition-colors"
          >
            + Add a Place
          </Link>
        </div>

        {/* Submitted Places */}
        <section>
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
            My Submissions
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({submissions?.length ?? 0})
            </span>
          </h2>
          {!submissions || submissions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-400">
                You haven&apos;t submitted any places yet.
              </p>
              <Link
                href="/submit"
                className="mt-3 inline-block text-xs font-bold text-[#06b6d4] hover:underline"
              >
                Suggest a place →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {submissions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-3.5 shadow-xs"
                >
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{s.title}</p>
                    <p className="text-xs text-gray-400">
                      {[s.locality, s.city].filter(Boolean).join(", ")} ·{" "}
                      {new Date(s.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${statusColors[s.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {s.status.replace("_", " ")}
                    </span>
                    {s.status === "published" && (
                      <Link
                        href={`/listing/${s.slug}`}
                        className="text-xs text-[#06b6d4] font-semibold hover:underline"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Claimed Listings */}
        <section>
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
            My Claims
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({claims?.length ?? 0})
            </span>
          </h2>
          {!claims || claims.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-400">
                You haven&apos;t claimed any business listings yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {claims.map((c) => {
                const listing = Array.isArray(c.listings) ? c.listings[0] : c.listings;
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-3.5 shadow-xs"
                  >
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {(listing as any)?.title ?? "Unknown Listing"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(listing as any)?.city ?? ""} · Claim{" "}
                        {new Date(c.created_at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${statusColors[c.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {c.status.replace("_", " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Favorites */}
        <section>
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
            Saved Places
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({favorites?.length ?? 0})
            </span>
          </h2>
          {!favorites || favorites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-400">
                You haven&apos;t saved any places yet. Tap ❤️ on any listing to save it here.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {favorites.map((f) => {
                const listing = Array.isArray(f.listings) ? f.listings[0] : f.listings;
                return (
                  <Link
                    key={f.id}
                    href={`/listing/${(listing as any)?.slug ?? ""}`}
                    className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs hover:border-rose-200 hover:shadow-sm transition-all"
                  >
                    <span className="text-xl shrink-0">❤️</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 group-hover:text-[#06b6d4] transition-colors line-clamp-1">
                        {(listing as any)?.title ?? "Unknown Place"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {[(listing as any)?.locality, (listing as any)?.city]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
