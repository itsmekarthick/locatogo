"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { Badge, Chip } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowUpRightIcon, BriefcaseIcon, MapPinIcon, SearchIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";

export type DashboardRole = {
  id: string;
  title: string;
  company: string;
  slug: string | null;
  website: string | null;
  location: string;
  workplace: string | null;
  applyUrl: string | null;
  matched: string[];
};

const PAGE_SIZE = 5;

const label = (value: string) => value.replace(/_/g, " ");

export function RolesPanel({ roles }: { roles: DashboardRole[] }) {
  const [query, setQuery] = useState("");
  const [workplace, setWorkplace] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const workplaces = useMemo(() => {
    const counts = new Map<string, number>();
    for (const role of roles) if (role.workplace) counts.set(role.workplace, (counts.get(role.workplace) ?? 0) + 1);
    return [...counts.entries()];
  }, [roles]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return roles.filter((role) => (!workplace || role.workplace === workplace) && (!needle || `${role.title} ${role.company} ${role.location}`.toLowerCase().includes(needle)));
  }, [roles, query, workplace]);

  const visible = expanded ? filtered : filtered.slice(0, PAGE_SIZE);

  return (
    <div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="min-w-[12rem] flex-1">
          <Input aria-label="Search matched roles" type="search" placeholder="Search roles or companies" leading={<SearchIcon />} value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        {workplaces.length > 1 && (
          <div role="group" aria-label="Workplace type" className="flex flex-wrap gap-2">
            <Chip selected={workplace === null} count={roles.length} onClick={() => setWorkplace(null)}>
              All
            </Chip>
            {workplaces.map(([type, count]) => (
              <Chip key={type} selected={workplace === type} count={count} onClick={() => setWorkplace(workplace === type ? null : type)} className="capitalize">
                {label(type)}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {filtered.length} matching roles
      </p>

      {filtered.length ? (
        <>
          <ul role="list" className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line">
            {visible.map((role) => (
              <li key={role.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 bg-surface-1 p-4 transition-colors hover:bg-surface-3/40">
                <CompanyBrandAvatar title={role.company} website={role.website} size={44} />
                <div className="min-w-0 flex-1 basis-56">
                  <h3 className="text-sm font-medium leading-snug">{role.title}</h3>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-fg-subtle">
                    {role.slug ? (
                      <Link href={`/listing/${role.slug}`} className="focus-ring rounded font-medium text-fg-muted hover:text-accent-text">
                        {role.company}
                      </Link>
                    ) : (
                      <span className="font-medium text-fg-muted">{role.company}</span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <MapPinIcon className="size-3.5" />
                      {role.location}
                    </span>
                    {role.workplace && (
                      <Badge size="sm" className="capitalize">
                        {label(role.workplace)}
                      </Badge>
                    )}
                  </p>
                  {role.matched.length > 0 && (
                    <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-fg-subtle">
                      Matches
                      {role.matched.map((skill) => (
                        <Badge key={skill} variant="accent" size="sm">
                          {skill}
                        </Badge>
                      ))}
                    </p>
                  )}
                </div>
                {role.applyUrl && (
                  <a href={role.applyUrl} target="_blank" rel="noreferrer" className={buttonVariants({ size: "sm" })}>
                    Apply
                    <ArrowUpRightIcon className="size-4" />
                  </a>
                )}
              </li>
            ))}
          </ul>
          {filtered.length > PAGE_SIZE && (
            <div className="mt-4 flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)}>
                {expanded ? "Show fewer" : `Show all ${filtered.length} roles`}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-line-strong">
          <EmptyState
            className="py-8"
            icon={<BriefcaseIcon />}
            title="No roles match those filters"
            description="Try a different search or clear the workplace filter."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setWorkplace(null);
                }}
              >
                Clear filters
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
