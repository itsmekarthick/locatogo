import { requirePlatformAdmin } from "@/lib/auth/platform-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CreditCardIcon, GlobeIcon, MapPinIcon } from "@/components/ui/icons";

export default async function PlatformPlansPage() {
  const { supabase } = await requirePlatformAdmin();
  const { data: plans } = await supabase
    .from("plans")
    .select("id, name, slug, price, currency, interval, domain_limit, listing_limit, is_active")
    .order("price");

  return (
    <div className="mx-auto max-w-[1280px] space-y-8">
      <AdminPageHeader
        eyebrow="Commercial architecture"
        title="Subscription plans and limits"
        description="Pricing tiers, directory quotas and listing capacity for tenant subscriptions."
      />

      {plans?.length ? (
        <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <li key={plan.id}>
              <article className="flex h-full flex-col justify-between rounded-2xl border border-line bg-surface-1 p-6 elev-sm transition-ui hover:-translate-y-0.5 hover:elev-md">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-xl font-semibold tracking-tight text-fg">{plan.name}</h2>
                    <Badge variant={plan.is_active ? "success" : "neutral"} dot>
                      {plan.is_active ? "Active" : "Archived"}
                    </Badge>
                  </div>

                  <p className="mt-4 flex items-baseline gap-1.5">
                    <span className="font-display text-4xl font-semibold tracking-tight text-fg">${plan.price}</span>
                    <span className="text-sm text-fg-muted">
                      {plan.currency} / {plan.interval}
                    </span>
                  </p>

                  <ul role="list" className="mt-6 space-y-2.5 border-t border-line pt-4 text-sm text-fg-muted">
                    <li className="flex items-center gap-2.5">
                      <GlobeIcon className="size-4 shrink-0 text-accent-text" />
                      {plan.domain_limit ? `${plan.domain_limit} domains` : "Unlimited multi-domains"}
                    </li>
                    <li className="flex items-center gap-2.5">
                      <MapPinIcon className="size-4 shrink-0 text-accent-text" />
                      {plan.listing_limit ? `${plan.listing_limit} place listings` : "Unlimited listings"}
                    </li>
                  </ul>
                </div>

                <p className="mt-8 border-t border-line pt-4 font-mono text-xs text-fg-subtle">plan_id: {plan.slug}</p>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface-1">
          <EmptyState icon={<CreditCardIcon />} title="No plans configured" description="Subscription plans in the catalog will appear here." />
        </div>
      )}
    </div>
  );
}
