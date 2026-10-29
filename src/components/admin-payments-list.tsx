"use client";

import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CreditCardIcon } from "@/components/ui/icons";

type PaymentItem = {
  id: string;
  payment_type: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  commission_amount: number;
  tenant_payout_amount: number;
  created_at: string;
};

// UTC keeps the server and browser renders identical.
const stampFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  succeeded: "success",
  paid: "success",
  pending: "warning",
  failed: "danger",
  refunded: "neutral",
};

const money = (value: number, currency: string) => `${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

const columns: Column<PaymentItem>[] = [
  {
    id: "type",
    header: "Payment",
    sortValue: (row) => row.payment_type,
    cell: (row) => (
      <div className="flex items-center gap-2">
        <span className="font-medium capitalize text-fg">{row.payment_type.replace(/_/g, " ")}</span>
        <span className="rounded-md bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] text-fg-subtle">{row.gateway}</span>
      </div>
    ),
  },
  {
    id: "date",
    header: "Date (UTC)",
    hideBelow: "md",
    sortValue: (row) => row.created_at,
    cell: (row) => <span className="whitespace-nowrap text-fg-muted">{stampFormat.format(new Date(row.created_at))}</span>,
  },
  {
    id: "commission",
    header: "Commission",
    align: "right",
    hideBelow: "lg",
    sortValue: (row) => Number(row.commission_amount),
    cell: (row) => <span className="font-mono text-xs text-fg-muted">{money(row.commission_amount, row.currency)}</span>,
  },
  {
    id: "payout",
    header: "Payout",
    align: "right",
    hideBelow: "md",
    sortValue: (row) => Number(row.tenant_payout_amount),
    cell: (row) => <span className="font-mono text-xs text-success">{money(row.tenant_payout_amount, row.currency)}</span>,
  },
  {
    id: "amount",
    header: "Amount",
    align: "right",
    sortValue: (row) => Number(row.amount),
    cell: (row) => <span className="font-display text-base font-semibold text-fg">{money(row.amount, row.currency)}</span>,
  },
  {
    id: "status",
    header: "Status",
    sortValue: (row) => row.status,
    cell: (row) => (
      <Badge variant={STATUS_VARIANT[row.status] ?? "neutral"} dot className="capitalize">
        {row.status}
      </Badge>
    ),
  },
];

export function AdminPaymentsList({ payments }: { payments: PaymentItem[] }) {
  return (
    <DataTable
      caption="Transaction history"
      columns={columns}
      rows={payments}
      getRowId={(row) => row.id}
      pageSize={8}
      defaultSort={{ id: "date", dir: "desc" }}
      empty={<EmptyState icon={<CreditCardIcon />} title="No transactions yet" description="When users purchase featured spots or claims, payment records will appear here." />}
    />
  );
}
