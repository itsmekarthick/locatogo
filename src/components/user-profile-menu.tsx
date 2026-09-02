"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function UserProfileMenu({
  className = "",
}: {
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

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
            ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20"
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
        }`}
      >
        {/* Avatar Monogram / Icon */}
        <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white font-bold text-xs shadow-xs">
          <span>👤</span>
          {/* Active Status Indicator */}
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1.5 ring-white dark:ring-slate-900" />
        </div>

        {/* Subtle Dropdown Chevron */}
        <span
          className={`text-[10px] text-slate-400 dark:text-slate-500 pr-1 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-indigo-600" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* Floating Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d131f] p-2 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 z-[2000] animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header Profile Tag */}
          <div className="px-3.5 py-3 border-b border-slate-100 dark:border-slate-800/80 mb-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-700 text-white font-bold text-sm shadow-xs">
                JD
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                  Atlas Operator
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  operator@locatogo.com
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/60 px-2 py-0.5 text-[9px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                ⚡ Admin Verified
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                Active Tenant
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="space-y-0.5 py-1">
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
              <span className="rounded bg-[#e26a4f]/15 px-1.5 py-0.2 text-[9px] font-extrabold text-[#e26a4f] uppercase">
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
              <span className="flex-1 font-medium">Workspace Settings</span>
            </Link>
          </div>

          {/* Footer Shortcuts */}
          <div className="mt-1 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-0.5">
            <Link
              href="/tech-atlas"
              className="flex items-center justify-between rounded-xl px-3 py-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
            >
              <span>💼 Global Tech Atlas</span>
              <span>↗</span>
            </Link>

            <Link
              href="/auth/sign-out"
              className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
