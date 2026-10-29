import type { ReactNode } from "react";
import { FavoriteButton } from "@/components/favorite-button";
import { ShareButton } from "@/components/share-button";
import { buttonVariants } from "@/components/ui/button";
import { ArrowUpRightIcon, NavigationIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

type DetailActionsProps = {
  /** Primary call to action, e.g. visit the website or the careers portal. */
  primary?: { href: string; label: string; icon?: ReactNode; external?: boolean } | null;
  listingId: string;
  shareTitle: string;
  shareUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
};

/** Visit, Save, Share and Directions. Lives inside DetailStickyBar, which decides where it docks. */
export function DetailActions({ primary, listingId, shareTitle, shareUrl, latitude, longitude }: DetailActionsProps) {
  const hasCoordinates = typeof latitude === "number" && typeof longitude === "number";
  // Without a primary action the icon buttons share the dock evenly.
  const compact = Boolean(primary);

  return (
    <>
      {primary && (
        <a
          href={primary.href}
          {...(primary.external === false ? {} : { target: "_blank", rel: "noopener noreferrer" })}
          className={buttonVariants({ size: "md", className: "min-w-0 flex-1 lg:flex-none" })}
        >
          {primary.icon}
          <span className="truncate">{primary.label}</span>
          {primary.external !== false && <ArrowUpRightIcon className="size-4 shrink-0" />}
        </a>
      )}
      <FavoriteButton listingId={listingId} showCount collapseLabel className={cn("h-10 rounded-xl", compact ? "shrink-0 max-md:w-11 max-md:px-0" : "max-md:flex-1")} />
      <ShareButton title={shareTitle} url={shareUrl} collapseLabel className={cn("h-10 rounded-xl", compact ? "shrink-0 max-md:w-11 max-md:px-0" : "max-md:flex-1")} />
      {hasCoordinates && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Directions"
          title="Directions"
          className={buttonVariants({ variant: "secondary", size: "md", className: compact ? "shrink-0 max-md:w-11 max-md:px-0" : "max-md:flex-1" })}
        >
          <NavigationIcon className="size-4" />
          <span className="max-md:sr-only">Directions</span>
        </a>
      )}
    </>
  );
}
