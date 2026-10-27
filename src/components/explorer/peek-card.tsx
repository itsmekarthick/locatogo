"use client";

import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import type { CompanyDetail } from "@/components/company-detail-drawer";
import { Badge, Button } from "@/components/ui";
import { ArrowRightIcon, MapPinIcon, XIcon } from "@/components/ui/icons";
import { IconButton } from "@/components/ui/icon-button";

type PeekCardProps = {
  company: CompanyDetail;
  hubName: string;
  onOpen: () => void;
  onClose: () => void;
};

/** Quick view for a pin tapped on a phone or tablet. */
export function PeekCard({ company, hubName, onOpen, onClose }: PeekCardProps) {
  const jobs = company.active_jobs_count ?? 0;

  return (
    <aside aria-label="Selected company" className="glass elev-lg w-full rounded-2xl p-3.5">
      <div className="flex items-start gap-3">
        <CompanyBrandAvatar title={company.title} website={company.website} size={44} className="shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-semibold tracking-tight text-fg">{company.title}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-fg-muted">
            <MapPinIcon className="size-3.5 shrink-0 text-fg-subtle" />
            <span className="truncate">{[company.locality, company.city || hubName].filter(Boolean).join(", ")}</span>
          </p>
        </div>
        <IconButton label="Close quick view" size="sm" tooltip={false} className="-mr-1.5 -mt-1" onClick={onClose}>
          <XIcon />
        </IconButton>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {jobs > 0 && (
            <Badge variant="success" size="sm" dot>
              {jobs.toLocaleString("en-US")} {jobs === 1 ? "role" : "roles"}
            </Badge>
          )}
          {company.funding_stage && <Badge size="sm">{company.funding_stage}</Badge>}
        </div>
        <Button size="sm" trailingIcon={<ArrowRightIcon className="size-4" />} onClick={onOpen}>
          Details
        </Button>
      </div>
    </aside>
  );
}
