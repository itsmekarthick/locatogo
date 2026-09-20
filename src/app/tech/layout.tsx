import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function TechLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Top Workspace Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--line)] bg-[var(--paper)]/90 px-6 py-4 backdrop-blur-md sm:px-10">
        <div className="flex items-center gap-6">
          <Link href="/tech" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-indigo-600 flex items-center justify-center text-white font-bold">
              T
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Tech Professional</p>
              <p className="font-display text-base font-bold text-[var(--foreground)] leading-none">Dashboard</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-semibold text-[var(--ink-muted)]">
            <Link href="/tech" className="text-[var(--foreground)]">Overview</Link>
            <Link href="/tech/profile" className="hover:text-[var(--foreground)] transition-colors">Profile</Link>
            <Link href="/tech/jobs" className="hover:text-[var(--foreground)] transition-colors">Jobs</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="hidden rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--line)]/50 transition-colors sm:block"
          >
            Go to Map
          </Link>
          <Link
            href="/auth/sign-out"
            className="h-8 w-8 rounded-full bg-[var(--background)] flex items-center justify-center font-bold text-xs shadow-xs hover:bg-[var(--line)] transition-colors border border-[var(--line)]"
            title="Sign Out"
          >
            👋
          </Link>
        </div>
      </header>

      {/* Content Viewport */}
      <div className="mx-auto max-w-[1000px] w-full flex-1 px-5 py-8 sm:px-10 lg:py-12">
        {children}
      </div>
    </div>
  );
}
