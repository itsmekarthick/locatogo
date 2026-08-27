import { requirePlatformAdmin } from "@/lib/auth/platform-context";

export default async function PlatformPlansPage() {
  const { supabase } = await requirePlatformAdmin();
  const { data: plans } = await supabase
    .from("plans")
    .select("id, name, slug, price, currency, interval, domain_limit, listing_limit, is_active")
    .order("price");

  return (
    <div className="mx-auto max-w-[1280px] space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Commercial Architecture</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-[-0.05em] text-[var(--foreground)]">
          Subscription Plans & Limits
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Manage pricing tiers, directory quotas, and listing capacity for tenant subscriptions.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans?.length ? (
          plans.map((plan) => (
            <article
              key={plan.id}
              className="flex flex-col justify-between rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-7 shadow-xs transition-all hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold text-[var(--foreground)]">{plan.name}</h2>
                  <span className="rounded-full bg-[var(--leaf)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--leaf-dark)]">
                    {plan.is_active ? "Active" : "Archived"}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-[var(--foreground)]">
                    ${plan.price}
                  </span>
                  <span className="text-xs text-[var(--ink-muted)] font-medium">
                    {plan.currency} / {plan.interval}
                  </span>
                </div>

                <div className="mt-6 space-y-2 border-t border-[var(--line)] pt-4 text-xs text-[var(--ink-muted)]">
                  <p className="flex items-center gap-2">
                    <span>🌐</span>
                    <span>{plan.domain_limit ? `${plan.domain_limit} Domains` : "Unlimited Multi-Domains"}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{plan.listing_limit ? `${plan.listing_limit} Place Listings` : "Unlimited Listings"}</span>
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-[var(--line)] pt-4">
                <span className="font-mono text-[11px] text-[var(--ink-muted)]">plan_id: {plan.slug}</span>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-12 text-center text-xs text-[var(--ink-muted)] sm:col-span-3">
            No subscription plans configured in the catalog.
          </div>
        )}
      </div>
    </div>
  );
}
