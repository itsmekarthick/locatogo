"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileMenu } from "@/components/user-profile-menu";

const NAV_LINKS = [
  { href: "/", label: "Tech Atlas", icon: "💼", badge: "Live" },
  { href: "/blog", label: "Stories & Guides", icon: "📖" },
  { href: "/about", label: "About", icon: "ℹ️" },
  { href: "/submit", label: "Add Company", icon: "➕" },
  { href: "/advertise", label: "Advertise", icon: "📢" },
];

export function PublicHeader({
  className = "",
}: {
  className?: string;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md transition-colors ${className}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <BrandLogo size={38} className="group-hover:scale-105 transition-transform" />
          <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100"><span className="animate-brand-reveal">LocaToGo<span className="text-cyan-600 dark:text-cyan-400">.</span></span>
          </span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold">
          {NAV_LINKS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 transition-colors py-1 px-1 relative ${
                  active
                    ? "text-cyan-600 dark:text-cyan-400 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 px-1.5 py-0.2 text-[9px] uppercase font-bold">
                    {item.badge}
                  </span>
                )}
                {active && (
                  <span className="absolute -bottom-3.5 left-0 right-0 h-0.5 bg-cyan-600 dark:bg-cyan-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions (Theme toggle, User Profile, CTA & Mobile Hamburger) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <ThemeToggle />
          <UserProfileMenu />

          {/* Primary CTA (Desktop) */}
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-950 dark:bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 dark:hover:bg-cyan-500 hover:scale-[1.02] transition-all shrink-0"
          >
            <span>Live Atlas</span>
            <span>🗺️</span>
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="text-base font-bold leading-none">
              {mobileMenuOpen ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200/80 dark:border-slate-800/80 bg-white/98 dark:bg-[#090d16]/98 backdrop-blur-xl px-4 py-6 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-2">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </p>
            {NAV_LINKS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-bold transition-colors ${
                    active
                      ? "bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-full bg-cyan-100 dark:bg-cyan-900/60 px-2 py-0.5 text-[9px] uppercase font-bold text-cyan-700 dark:text-cyan-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200/70 dark:border-slate-800/70">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 rounded-full bg-slate-950 dark:bg-cyan-600 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all"
            >
              <span>Explore Live Tech Atlas</span>
              <span>💼</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
