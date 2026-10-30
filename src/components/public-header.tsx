"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { Badge, buttonVariants, IconButton, Sheet } from "@/components/ui";
import { ArrowRightIcon, MenuIcon } from "@/components/ui/icons";
import { APP_URL } from "@/lib/constants/app-url";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS = [
  { href: APP_URL, label: "Tech Atlas", badge: "Live", external: true },
  { href: "/blog", label: "Stories & Guides" },
  { href: "/about", label: "About" },
  { href: "/submit", label: "Add Company" },
  { href: "/advertise", label: "Advertise" },
];

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const isScrolled = () => window.scrollY > 8;

export function PublicHeader({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const scrolled = useSyncExternalStore(subscribeScroll, isScrolled, () => false);
  // Remembering the path the menu opened on closes it automatically after navigation.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const menuOpen = openedOn === pathname;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : !href.startsWith("http") && pathname.startsWith(href));

  return (
    <header
      data-scrolled={scrolled}
      className={cn("hdr-glass sticky top-0 z-[var(--z-header)]", className)}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring group flex shrink-0 items-center gap-2.5 rounded-lg">
          <BrandLogo size={36} />
          <span className="font-display text-xl font-semibold tracking-tight text-fg sm:text-2xl">
            <span className="animate-brand-reveal">
              LocaToGo<span className="text-accent-text">.</span>
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((item) => {
            const active = isActive(item.href);
            const classes = cn(
              "focus-ring relative inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-ui hover:bg-surface-3 hover:text-fg",
              active ? "text-fg" : "text-fg-muted",
            );
            const content = (
              <>
                {item.label}
                {item.badge && (
                  <Badge variant="accent" size="sm" dot>
                    {item.badge}
                  </Badge>
                )}
                {active && <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-accent" />}
              </>
            );
            return item.external ? (
              <a key={item.href} href={item.href} className={classes}>
                {content}
              </a>
            ) : (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={classes}>
                {content}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <UserProfileMenu />
          <span className="hidden sm:inline-flex">
            <a href={APP_URL} className={buttonVariants({ size: "sm" })}>
              Live Atlas
              <ArrowRightIcon className="size-4" />
            </a>
          </span>
          <IconButton
            label="Open menu"
            variant="secondary"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            tooltip={false}
            className="lg:hidden"
            onClick={() => setOpenedOn(pathname)}
          >
            <MenuIcon />
          </IconButton>
        </div>
      </div>

      <Sheet
        open={menuOpen}
        onOpenChange={(open) => setOpenedOn(open ? pathname : null)}
        side="right"
        title="Menu"
        footer={
          <a href={APP_URL} className={buttonVariants({ size: "lg", fullWidth: true })}>
            Explore live Tech Atlas
            <ArrowRightIcon className="size-4" />
          </a>
        }
      >
        <nav aria-label="Mobile" className="-mx-2 flex flex-col gap-1">
          {NAV_LINKS.map((item) => {
            const active = isActive(item.href);
            const classes = cn(
              "focus-ring flex h-14 items-center justify-between rounded-2xl px-4 text-base font-medium transition-ui motion-safe:active:scale-[0.99]",
              active ? "bg-accent-soft text-accent-text" : "text-fg hover:bg-surface-3",
            );
            const content = (
              <>
                <span className="flex items-center gap-3">
                  {item.label}
                  {item.badge && (
                    <Badge variant="accent" size="sm" dot>
                      {item.badge}
                    </Badge>
                  )}
                </span>
                <ArrowRightIcon className="size-4 text-fg-subtle" />
              </>
            );
            return item.external ? (
              <a key={item.href} href={item.href} className={classes}>
                {content}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpenedOn(null)}
                className={classes}
              >
                {content}
              </Link>
            );
          })}
        </nav>
      </Sheet>
    </header>
  );
}
