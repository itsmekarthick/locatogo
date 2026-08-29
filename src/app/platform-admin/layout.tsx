import Link from "next/link";

const links = [
  { label: "Overview Pulse", href: "/platform-admin", icon: "⚡" },
  { label: "Tenants Directory", href: "/platform-admin/tenants", icon: "🏢" },
  { label: "Subscription Plans", href: "/platform-admin/plans", icon: "💎" },
];

export default function PlatformAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[var(--background)] lg:grid lg:grid-cols-[250px_1fr]">
      {/* Platform Dark Console Sidebar */}
      <aside className="border-b border-white/10 bg-[var(--foreground)] px-6 py-6 text-white lg:min-h-screen lg:border-b-0 lg:border-r flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <Link href="/" className="font-display text-xl font-bold tracking-tight text-white">
              locatogo<span className="text-[var(--coral)]">.</span>
            </Link>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--yellow)]">
              Super Admin
            </span>
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">Global Platform Console</p>

          <nav className="mt-8 space-y-1.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/10 pt-4 text-xs">
          <Link href="/admin" className="flex items-center justify-between text-white/70 hover:text-white transition-colors">
            <span>← Back to Workspace</span>
          </Link>
        </div>
      </aside>

      {/* Main Platform Viewport */}
      <main className="min-w-0 px-5 py-8 sm:px-10 lg:py-12">
        {children}
      </main>
    </div>
  );
}
