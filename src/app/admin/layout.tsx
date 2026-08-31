import Link from "next/link";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[var(--background)] lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar Navigation (client component with mobile hamburger) */}
      <AdminSidebar />

      {/* Main Workspace Column */}
      <section className="min-w-0 flex flex-col">
        {/* Top Workspace Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--line)] bg-[var(--paper)]/90 px-6 py-4 backdrop-blur-md sm:px-10">
          <div className="pl-10 lg:pl-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--coral)]">Directory Operations</p>
            <p className="font-display text-lg font-bold text-[var(--foreground)]">Workspace Control Hub</p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/admin/listings"
              className="hidden rounded-full bg-[var(--foreground)] px-4 py-2 text-xs font-semibold text-[var(--paper)] shadow-xs hover:bg-[var(--foreground)]/85 transition-all sm:block"
            >
              + New listing
            </Link>
            <Link
              href="/admin/settings"
              className="h-8 w-8 rounded-full bg-[var(--background)] flex items-center justify-center font-bold text-xs shadow-xs hover:bg-[var(--line)] transition-colors border border-[var(--line)]"
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
