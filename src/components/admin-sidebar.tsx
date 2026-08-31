"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: number;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Core Operations",
    items: [
      { label: "Overview", href: "/admin", icon: "📊" },
      { label: "Listings", href: "/admin/listings", icon: "📍" },
      { label: "Import Hub", href: "/admin/import", icon: "📥" },
    ],
  },
  {
    title: "Structure & Taxonomy",
    items: [
      { label: "Categories", href: "/admin/categories", icon: "🏷️" },
      { label: "Custom Fields", href: "/admin/custom-fields", icon: "⚙️" },
      { label: "Domains", href: "/admin/domains", icon: "🌐" },
    ],
  },
  {
    title: "Curation & Growth",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: "📈" },
      { label: "Moderation Queue", href: "/admin/moderation", icon: "🛡️" },
      { label: "Ownership Claims", href: "/admin/claims", icon: "🤝" },
      { label: "Advertising & Slots", href: "/admin/advertising", icon: "📢" },
      { label: "Payments & Revenue", href: "/admin/payments", icon: "💳" },
    ],
  },
  {
    title: "Governance & Setup",
    items: [
      { label: "Activity Trail", href: "/admin/activity", icon: "📜" },
      { label: "Team", href: "/admin/team", icon: "👥" },
      { label: "Settings", href: "/admin/settings", icon: "🔧" },
      { label: "Platform Console", href: "/platform-admin", icon: "⚡" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when navigating
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <>
      <div>
        <div className="flex items-center justify-between">
          <Link href="/" className="font-display text-2xl font-bold tracking-tight text-[var(--foreground)]">
            locatogo<span className="text-[var(--coral)]">.</span>
          </Link>
          <span className="rounded-full bg-[var(--leaf)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--leaf-dark)]">
            Workspace
          </span>
        </div>

        <nav className="mt-8 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                {section.title}
              </p>
              <div className="mt-2 space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                        active
                          ? "bg-[var(--foreground)] text-[var(--paper)] shadow-sm"
                          : "text-[var(--ink-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge != null && item.badge > 0 && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                          active ? "bg-[var(--paper)]/20 text-[var(--paper)]" : "bg-[var(--coral)]/10 text-[var(--coral)]"
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="mt-8 border-t border-[var(--line)] pt-4">
        <Link
          href="/"
          className="flex items-center justify-between rounded-xl bg-[var(--background)] px-3.5 py-2.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--line)]/50 transition-colors"
        >
          <span>Live Atlas Home</span>
          <span className="text-[var(--coral)]">↗</span>
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button — rendered in the header area */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--paper)] shadow-md lg:hidden"
        aria-label="Open navigation"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="3" y1="5" x2="15" y2="5" />
          <line x1="3" y1="9" x2="15" y2="9" />
          <line x1="3" y1="13" x2="15" y2="13" />
        </svg>
      </button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Slide-in Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-[var(--paper)] px-5 py-6 shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between overflow-y-auto">
          <div>
            {/* Close button */}
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--background)] transition-colors"
                aria-label="Close navigation"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="4" y1="4" x2="12" y2="12" />
                  <line x1="12" y1="4" x2="4" y2="12" />
                </svg>
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden border-r border-[var(--line)] bg-[var(--paper)] px-6 py-8 lg:flex lg:min-h-screen lg:flex-col lg:justify-between">
        {sidebarContent}
      </aside>
    </>
  );
}
