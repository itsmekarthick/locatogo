import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminPaymentsList } from "@/components/admin-payments-list";

export default async function PaymentsPage() {
  const { supabase, tenant } = await requireTenantContext();
  const { data: payments } = await supabase
    .from("payments")
    .select("id, payment_type, amount, currency, gateway, status, commission_amount, tenant_payout_amount, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Financial Operations</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.05em] text-[var(--foreground)] sm:text-4xl">
          Payments & Revenue
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Track customer payments, paid claim verifications, platform commission splits, and net payouts.
        </p>
      </div>

      {/* Transaction Table Card */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-xs">
        <h2 className="font-display text-lg font-bold text-[var(--foreground)] mb-1">Transaction History</h2>
        <p className="mb-6 text-xs text-[var(--ink-muted)]">Real-time ledger of inbound gateway transactions.</p>

        <AdminPaymentsList payments={payments ?? []} />
      </div>
    </div>
  );
}
