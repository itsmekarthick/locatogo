import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { buttonVariants } from "@/components/ui/button";
import { ChevronRightIcon, MapIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

export type Crumb = { label: string; href?: string };

type DetailHeaderProps = {
  crumbs: Crumb[];
  /** Optional search control shown between the breadcrumb and the actions. */
  search?: ReactNode;
  cta?: { href: string; label: string };
};

export function DetailHeader({ crumbs, search, cta }: DetailHeaderProps) {
  return (
    <header className="sticky top-0 z-[var(--z-header)] border-b border-line bg-[var(--glass)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="LocaToGo home" className="focus-ring flex shrink-0 items-center gap-2.5 rounded-lg">
          <BrandLogo size={32} />
          <span className="hidden font-display text-xl font-semibold tracking-tight text-fg sm:inline">
            LocaToGo<span className="text-accent-text">.</span>
          </span>
        </Link>

        <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm text-fg-subtle lg:flex">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
                <ChevronRightIcon className="size-4 shrink-0 opacity-60" />
                {crumb.href && !last ? (
                  <Link href={crumb.href} className="focus-ring truncate rounded transition-colors hover:text-fg">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current={last ? "page" : undefined} className={cn("truncate", last && "max-w-[16rem] text-fg")}>
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>

        {search && <div className="mx-1 min-w-0 max-w-md flex-1 md:mx-4">{search}</div>}

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {cta && (
            <span className="hidden sm:inline-flex">
              <Link href={cta.href} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                <MapIcon className="size-4" />
                {cta.label}
              </Link>
            </span>
          )}
          <ThemeToggle />
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
}
