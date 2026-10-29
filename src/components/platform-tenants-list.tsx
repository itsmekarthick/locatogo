"use client";

import { useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge, Chip, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BuildingIcon, DownloadIcon, SearchIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";

type TenantItem = {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
};

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const STATUS_VARIANT: Record<string, BadgeVariant> = { active: "success", trialing: "info", suspended: "danger", pending: "warning" };

const columns: Column<TenantItem>[] = [
  {
    id: "name",
    header: "Workspace",
    sortValue: (row) => row.name,
    cell: (row) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-fg">{row.name}</p>
        <p className="mt-0.5 truncate font-mono text-xs text-fg-subtle">
          /{row.slug} · {row.id.slice(0, 8)}
        </p>
      </div>
    ),
  },
  {
    id: "joined",
    header: "Joined (UTC)",
    hideBelow: "sm",
    sortValue: (row) => row.created_at,
    cell: (row) => <span className="whitespace-nowrap text-fg-muted">{dateFormat.format(new Date(row.created_at))}</span>,
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

// A leading =, +, - or @ would be run as a formula by spreadsheet apps.
const csvCell = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`;

function downloadCsv(rows: TenantItem[]) {
  const lines = [["id", "name", "slug", "status", "created_at"], ...rows.map((row) => [row.id, row.name, row.slug, row.status, row.created_at])];
  const blob = new Blob([lines.map((line) => line.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "tenants.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function PlatformTenantsList({ tenants }: { tenants: TenantItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const statuses = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tenant of tenants) counts.set(tenant.status, (counts.get(tenant.status) ?? 0) + 1);
    return [...counts.entries()];
  }, [tenants]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tenants.filter((tenant) => (!status || tenant.status === status) && (!needle || `${tenant.name} ${tenant.slug} ${tenant.id}`.toLowerCase().includes(needle)));
  }, [tenants, query, status]);

  const filtering = Boolean(query.trim() || status);

  return (
    <DataTable
      caption="Tenant workspaces"
      columns={columns}
      rows={filtered}
      getRowId={(row) => row.id}
      pageSize={10}
      defaultSort={{ id: "joined", dir: "desc" }}
      toolbar={
        <>
          <div className="w-full min-w-[12rem] sm:w-72">
            <Input aria-label="Search tenants" type="search" placeholder="Search name, slug or ID" leading={<SearchIcon />} value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          {statuses.length > 1 && (
            <div role="group" aria-label="Status" className="flex flex-wrap gap-2">
              <Chip selected={status === null} count={tenants.length} onClick={() => setStatus(null)}>
                All
              </Chip>
              {statuses.map(([value, count]) => (
                <Chip key={value} selected={status === value} count={count} onClick={() => setStatus(status === value ? null : value)} className="capitalize">
                  {value}
                </Chip>
              ))}
            </div>
          )}
          <Button variant="secondary" size="sm" leadingIcon={<DownloadIcon className="size-4" />} disabled={!filtered.length} onClick={() => downloadCsv(filtered)}>
            Export CSV
          </Button>
        </>
      }
      empty={
        filtering ? (
          <EmptyState
            icon={<SearchIcon />}
            title="No tenants match"
            description="Try a different search or clear the status filter."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setStatus(null);
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState icon={<BuildingIcon />} title="No tenants yet" description="Organization workspaces appear here once they register." />
        )
      }
    />
  );
}
