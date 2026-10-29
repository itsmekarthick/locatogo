"use client";

import { DataTable, type Column } from "@/components/admin/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ClockIcon } from "@/components/ui/icons";

type AuditLogItem = {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  created_at: string;
};

// UTC keeps the server and browser renders identical.
const stampFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

const columns: Column<AuditLogItem>[] = [
  {
    id: "action",
    header: "Action",
    sortValue: (row) => row.action,
    cell: (row) => (
      <div>
        <p className="font-medium text-fg">{row.action}</p>
        <p className="mt-0.5 text-xs capitalize text-fg-subtle">{row.entity_type}</p>
      </div>
    ),
  },
  {
    id: "entity",
    header: "Entity ID",
    hideBelow: "md",
    cell: (row) => <span className="block max-w-[16rem] truncate font-mono text-xs text-fg-muted">{row.entity_id || "None"}</span>,
  },
  {
    id: "time",
    header: "Timestamp (UTC)",
    sortValue: (row) => row.created_at,
    cell: (row) => <span className="whitespace-nowrap text-fg-muted">{stampFormat.format(new Date(row.created_at))}</span>,
  },
];

export function AdminActivityList({ logs }: { logs: AuditLogItem[] }) {
  return (
    <DataTable
      caption="Activity trail"
      columns={columns}
      rows={logs}
      getRowId={(row) => row.id}
      pageSize={10}
      defaultSort={{ id: "time", dir: "desc" }}
      empty={<EmptyState icon={<ClockIcon />} title="No logged activity yet" description="Changes to listings and directory items will appear here automatically." />}
    />
  );
}
