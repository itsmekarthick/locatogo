"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, isNavActive, type AdminNavSection } from "@/components/admin/nav";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { ArrowUpRightIcon, PanelLeftIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/sheet";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";

type NavProps = { collapsed: boolean; sections: AdminNavSection[]; onNavigate?: () => void };

function SidebarNav({ collapsed, sections, onNavigate }: NavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex flex-col gap-5">
      {sections.map((section) => (
        <div key={section.title}>
          {collapsed ? (
            <span aria-hidden="true" className="mx-3 mb-2 block h-px bg-line" />
          ) : (
            <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-fg-subtle">{section.title}</p>
          )}
          <ul role="list" className={cn("space-y-0.5", !collapsed && "mt-2")}>
            {section.items.map((item) => {
              const active = isNavActive(pathname, item.href);
              const Icon = item.icon;
              const link = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  className={cn(
                    "focus-ring relative flex h-10 items-center gap-3 rounded-xl text-sm font-medium transition-ui pointer-coarse:h-11",
                    collapsed ? "mx-auto w-11 justify-center" : "px-3",
                    active ? "bg-accent-soft text-accent-text" : "text-fg-muted hover:bg-surface-3 hover:text-fg",
                  )}
                >
                  <Icon className="size-[1.15rem] shrink-0" />
                  {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                  {active && !collapsed && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent" />}
                </Link>
              );
              return (
                <li key={item.href} className={cn(collapsed && "flex justify-center")}>
                  {collapsed ? (
                    <Tooltip content={item.label} side="right" delay={150}>
                      {link}
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href="/" aria-label="LocaToGo home" className={cn("focus-ring flex items-center gap-2.5 rounded-lg", collapsed && "mx-auto")}>
      <BrandLogo size={32} />
      {!collapsed && (
        <span className="font-display text-xl font-semibold tracking-tight text-fg">
          LocaToGo<span className="text-accent-text">.</span>
        </span>
      )}
    </Link>
  );
}

type Props = {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  sections?: AdminNavSection[];
  badge?: string;
  home?: { href: string; label: string };
};

export function AdminSidebar({
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileOpenChange,
  sections = ADMIN_NAV,
  badge = "Workspace",
  home = { href: "/", label: "Live Atlas home" },
}: Props) {
  return (
    <>
      <aside
        data-collapsed={collapsed}
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface-1 lg:flex",
          collapsed ? "w-[4.5rem]" : "w-64",
        )}
      >
        <div className={cn("flex h-16 shrink-0 items-center border-b border-line", collapsed ? "justify-center" : "justify-between px-5")}>
          <Brand collapsed={collapsed} />
          {!collapsed && (
            <Badge variant="accent" size="sm">
              {badge}
            </Badge>
          )}
        </div>

        <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain py-5", collapsed ? "px-2" : "px-3")}>
          <SidebarNav collapsed={collapsed} sections={sections} />
        </div>

        <div className={cn("shrink-0 space-y-2 border-t border-line p-3", collapsed && "flex flex-col items-center")}>
          {collapsed ? (
            <Tooltip content={home.label} side="right" delay={150}>
              <Link href={home.href} aria-label={home.label} className="focus-ring grid size-11 place-items-center rounded-xl text-fg-muted transition-ui hover:bg-surface-3 hover:text-fg">
                <ArrowUpRightIcon className="size-[1.15rem]" />
              </Link>
            </Tooltip>
          ) : (
            <Link
              href={home.href}
              className="focus-ring flex h-10 items-center justify-between rounded-xl bg-surface-3 px-3 text-sm font-medium text-fg transition-ui hover:bg-line"
            >
              {home.label}
              <ArrowUpRightIcon className="size-4 text-accent-text" />
            </Link>
          )}
          <IconButton
            label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            tooltipSide="right"
            className={cn(!collapsed && "ml-auto flex")}
            onClick={() => onCollapsedChange(!collapsed)}
          >
            <PanelLeftIcon />
          </IconButton>
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange} side="left" title="Navigation" className="max-w-xs">
        <SidebarNav collapsed={false} sections={sections} onNavigate={() => onMobileOpenChange(false)} />
      </Sheet>
    </>
  );
}
