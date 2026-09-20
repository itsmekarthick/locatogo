"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function UserProfileMenu({
  className = "",
}: {
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>("user");
  const [isLoaded, setIsLoaded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Load real user session from Supabase
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const fetchRole = async (userId: string) => {
      const { data } = await supabase.from("profiles").select("platform_role").eq("id", userId).single();
      if (data) {
        setRole(data.platform_role);
      }
    };

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) {
        fetchRole(data.user.id).finally(() => setIsLoaded(true));
      } else {
        setIsLoaded(true);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id).finally(() => setIsLoaded(true));
      } else {
        setIsLoaded(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Handle client sign-out
  const handleSignOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/auth/sign-out";
  };

  // While loading initial auth check
  if (!isLoaded) {
    return (
      <div
        className={`h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse ${className}`}
        aria-hidden="true"
      />
    );
  }

  // If user is NOT logged in, show clean Sign In button
  if (!user) {
    return (
      <Link
        href="/auth/login"
        className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-2xs cursor-pointer select-none ${className}`}
      >
        <span>👤</span>
        <span>Sign In</span>
      </Link>
    );
  }

  // User is logged in: compute dynamic metadata
  const displayName =
    (user.user_metadata?.display_name as string) ||
    (user.user_metadata?.full_name as string) ||
    user.email?.split("@")[0] ||
    "Member";

  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const isTechUser = role === "tech_user";

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button: User Avatar Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User Account and Workspace Menu"
        className={`flex items-center gap-1.5 rounded-full p-1 border transition-all cursor-pointer select-none ${
          isOpen
            ? "border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/50 ring-2 ring-cyan-500/20"
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
        }`}
      >
        {/* Avatar Image or Monogram */}
        <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 via-cyan-600 to-violet-700 text-white font-bold text-xs shadow-xs overflow-hidden">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
          {/* Active Status Indicator */}
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1.5 ring-white dark:ring-slate-900" />
        </div>

        {/* Subtle Dropdown Chevron */}
        <span
          className={`text-[10px] text-slate-400 dark:text-slate-500 pr-1 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-cyan-600" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* Floating Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d131f] p-2 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 z-[2000] animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header Profile Tag with real user data */}
          <div className="px-3.5 py-3 border-b border-slate-100 dark:border-slate-800/80 mb-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-700 text-white font-bold text-sm shadow-xs overflow-hidden shrink-0">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/70 dark:border-cyan-800/60 px-2 py-0.5 text-[9px] font-bold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">
                ⚡ Active Session
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                Authenticated
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="space-y-0.5 py-1">
            {isTechUser ? (
              <>
                <Link
                  href="/tech"
                  className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <span className="text-sm">👨‍💻</span>
                  <div className="flex-1">
                    <p className="font-bold leading-tight">Tech Dashboard</p>
                    <p className="text-[10px] text-slate-400 font-normal">Manage your profile & skills</p>
                  </div>
                </Link>
                <Link
                  href="/tech/jobs"
                  className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <span className="text-sm">💼</span>
                  <div className="flex-1">
                    <p className="font-bold leading-tight">Jobs & Applications</p>
                    <p className="text-[10px] text-slate-400 font-normal">Track your opportunities</p>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <span className="text-sm">📊</span>
                  <div className="flex-1">
                    <p className="font-bold leading-tight">Dashboard</p>
                    <p className="text-[10px] text-slate-400 font-normal">My submissions, saves & stats</p>
                  </div>
                </Link>
                <Link
                  href="/admin"
                  className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <span className="text-sm">⚡</span>
                  <div className="flex-1">
                    <p className="font-bold leading-tight">Admin Console</p>
                    <p className="text-[10px] text-slate-400 font-normal">Directory management & KPIs</p>
                  </div>
                  <span className="rounded bg-[#06b6d4]/15 px-1.5 py-0.2 text-[9px] font-extrabold text-[#06b6d4] uppercase">
                    Hub
                  </span>
                </Link>
                <Link
                  href="/admin/listings"
                  className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <span className="text-sm">📍</span>
                  <span className="flex-1 font-medium">All Listings</span>
                </Link>
                <Link
                  href="/submit"
                  className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <span className="text-sm">➕</span>
                  <span className="flex-1 font-medium">Add New Place</span>
                </Link>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <span className="text-sm">⚙️</span>
                  <span className="flex-1 font-medium">Account Settings</span>
                </Link>
              </>
            )}
          </div>

          {/* Footer Shortcuts & Sign Out */}
          <div className="mt-1 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-0.5">
            <Link
              href="/"
              className="flex items-center justify-between rounded-xl px-3 py-1.5 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition-colors"
            >
              <span>💼 Global Tech Atlas</span>
              <span>↗</span>
            </Link>

            <form onSubmit={handleSignOut} className="w-full">
              <button
                type="submit"
                className="w-full flex items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
