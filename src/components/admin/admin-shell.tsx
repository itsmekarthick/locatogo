"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminCommandPalette } from "@/components/admin/command-palette";
import { useSidebarCollapsed } from "@/components/admin/use-sidebar-collapsed";
import { ADMIN_NAV, PLATFORM_NAV } from "@/components/admin/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { buttonVariants } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { MenuIcon, PlusIcon, SearchIcon, UserIcon } from "@/components/ui/icons";

/** Sidebar, top bar and command palette around the admin routes. */
export function AdminShell({ children, variant = "workspace", hasWorkspace = false }: { children: ReactNode; variant?: "workspace" | "platform"; hasWorkspace?: boolean }) {
  const platform = variant === "platform";
  const sections = platform ? PLATFORM_NAV : ADMIN_NAV;
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-dvh bg-surface-0 text-fg lg:flex">
      <AdminSidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        sections={sections}
        badge={platform ? "Super admin" : "Workspace"}
        home={platform && hasWorkspace ? { href: "/admin", label: "Back to workspace" } : { href: "/", label: "Live Atlas home" }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[var(--z-header)] flex h-16 items-center gap-3 border-b border-line bg-[var(--glass)] px-4 backdrop-blur-xl backdrop-saturate-150 sm:px-6 lg:px-10">
          <span className="lg:hidden">
            <IconButton label="Open navigation" aria-haspopup="dialog" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          </span>

          <div className="min-w-0">
            <p className="hidden text-[11px] font-medium uppercase tracking-wider text-accent-text sm:block">{platform ? "Global platform console" : "Directory operations"}</p>
            <p className="truncate font-display text-lg font-semibold tracking-tight">{platform ? "Platform control" : "Workspace control hub"}</p>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Open command palette"
              className="focus-ring hidden h-10 items-center gap-2 rounded-xl border border-line-strong bg-surface-1 pl-3 pr-2 text-sm text-fg-muted transition-ui hover:bg-surface-3 md:inline-flex"
            >
              <SearchIcon className="size-4" />
              <span className="pr-6">Search sections</span>
              <kbd className="rounded-md border border-line bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] text-fg-subtle">⌘K</kbd>
            </button>
            <span className="md:hidden">
              <IconButton label="Search sections" onClick={() => setPaletteOpen(true)}>
                <SearchIcon />
              </IconButton>
            </span>
            <ThemeToggle />
            <span className="hidden sm:inline-flex">
              {platform && hasWorkspace ? (
                <Link href="/admin" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                  Workspace
                </Link>
              ) : !platform ? (
                <Link href="/admin/listings" className={buttonVariants({ size: "sm" })}>
                  <PlusIcon className="size-4" />
                  New listing
                </Link>
              ) : null}
            </span>
            {platform ? <UserProfileMenu hasWorkspace={hasWorkspace} /> : <Link
              href="/admin/settings"
              title="Workspace settings"
              aria-label="Workspace settings"
              className="focus-ring grid size-9 place-items-center rounded-full border border-line-strong bg-surface-1 text-fg-muted transition-ui hover:bg-surface-3 hover:text-fg pointer-coarse:size-11"
            >
              <UserIcon className="size-[1.15rem]" />
            </Link>}
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </div>

      <AdminCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} sections={sections} />
    </div>
  );
}
