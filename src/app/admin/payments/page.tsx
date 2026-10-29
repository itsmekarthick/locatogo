import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminPaymentsList } from "@/components/admin-payments-list";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function PaymentsPage() {
  const { supabase, tenant } = await requireTenantContext();
  const { data: payments } = await supabase
    .from("payments")
    .select("id, payment_type, amount, currency, gateway, status, commission_amount, tenant_payout_amount, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Financial operations"
        title="Payments and revenue"
        description="Track customer payments, paid claim verifications, platform commission splits and net payouts."
      />

      <AdminPaymentsList payments={payments ?? []} />
    </div>
  );
}
