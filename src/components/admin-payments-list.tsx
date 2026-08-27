"use client";

import { useState, useMemo } from "react";
import { Pagination } from "@/components/ui/pagination";

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

const PAGE_SIZE = 6;

export function AdminPaymentsList({ payments }: { payments: PaymentItem[] }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(payments.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return payments.slice(start, start + PAGE_SIZE);
  }, [payments, currentPage]);

  return (
    <div className="space-y-4">
      <div className="divide-y divide-[var(--line)]">
        {paginated.length > 0 ? (
          paginated.map((payment) => (
            <div key={payment.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[var(--foreground)] capitalize">
                    {payment.payment_type.replace("_", " ")}
                  </span>
                  <span className="rounded bg-[var(--background)] px-2 py-0.5 text-[10px] font-mono text-[var(--ink-muted)]">
                    {payment.gateway}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Date: {new Date(payment.created_at).toLocaleString()} · Commission: {payment.commission_amount} {payment.currency}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-display text-lg font-bold text-[var(--foreground)]">
                    {payment.amount} {payment.currency}
                  </p>
                  <p className="text-[11px] text-green-700 font-medium">
                    Payout: {payment.tenant_payout_amount} {payment.currency}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--leaf)] px-3 py-1 text-xs font-bold text-[var(--leaf-dark)] uppercase">
                  {payment.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-xs text-[var(--ink-muted)]">
            No transactions recorded yet. When users purchase featured spots or claims, payment records will populate here.
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={payments.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

