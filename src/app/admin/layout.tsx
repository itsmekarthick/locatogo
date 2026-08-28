import Link from "next/link";

const navSections = [
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
    ],
  },
  {
    title: "Curation & Growth",
    items: [
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
      { label: "Settings", href: "/admin/settings", icon: "🔧" },
      { label: "Platform Console", href: "/platform-admin", icon: "⚡" },
    ],
  },
];

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[var(--background)] lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar Navigation */}
      <aside className="border-b border-[var(--line)] bg-[var(--paper)] px-5 py-6 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-6 lg:py-8 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <Link href="/" className="font-display text-2xl font-bold tracking-tight text-[var(--foreground)]">
              mapora<span className="text-[var(--coral)]">.</span>
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
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)] transition-colors"
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Link */}
        <div className="mt-8 border-t border-[var(--line)] pt-4">
          <Link
            href="/"
            className="flex items-center justify-between rounded-xl bg-[var(--background)] px-3.5 py-2.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--line)]/50 transition-colors"
          >
            <span>Live Atlas Home</span>
            <span className="text-[var(--coral)]">↗</span>
          </Link>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <section className="min-w-0 flex flex-col">
        {/* Top Workspace Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--line)] bg-[var(--paper)]/90 px-6 py-4 backdrop-blur-md sm:px-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--coral)]">Directory Operations</p>
            <p className="font-display text-lg font-bold text-[var(--foreground)]">Workspace Control Hub</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/listings"
              className="rounded-full bg-[var(--foreground)] px-4 py-2 text-xs font-semibold text-[var(--paper)] shadow-xs hover:bg-[var(--foreground)]/85 transition-all"
            >
              + New listing
            </Link>
            <Link
              href="/admin/settings"
              className="h-8 w-8 rounded-full bg-[var(--yellow)] flex items-center justify-center font-bold text-xs shadow-xs"
              title="Account Settings"
            >
              👤
            </Link>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="mx-auto max-w-[1360px] w-full flex-1 px-5 py-8 sm:px-10 lg:py-10">
          {children}
        </div>
      </section>
    </div>
  );
}
