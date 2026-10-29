"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  BriefcaseIcon,
  ChartIcon,
  ChevronDownIcon,
  GlobeIcon,
  HeartIcon,
  LogOutIcon,
  MapPinIcon,
  MoonIcon,
  PlusIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SunIcon,
  UserIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { applyTheme, type Theme } from "@/lib/utils/theme-transition";
import "./user-menu.css";

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const getTheme = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");

const itemClasses =
  "focus-ring flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-surface-3 focus-visible:bg-surface-3 pointer-coarse:py-3";

function IconTile({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "danger" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg text-[1.05rem]",
        tone === "neutral" && "bg-surface-3 text-fg-muted",
        tone === "accent" && "bg-accent-soft text-accent-text",
        tone === "danger" && "bg-danger-soft text-danger",
      )}
    >
      {children}
    </span>
  );
}

function MenuLink({ href, icon, label, description, badge, onSelect }: { href: string; icon: ReactNode; label: string; description?: string; badge?: string; onSelect: () => void }) {
  return (
    <Link href={href} role="menuitem" tabIndex={-1} onClick={onSelect} className={itemClasses}>
      <IconTile>{icon}</IconTile>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-fg">{label}</span>
        {description && <span className="block truncate text-xs text-fg-subtle">{description}</span>}
      </span>
      {badge && (
        <Badge variant="accent" size="sm">
          {badge}
        </Badge>
      )}
    </Link>
  );
}

export function UserProfileMenu({ className = "", hasWorkspace = false }: { className?: string; hasWorkspace?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState("user");
  const [profileName, setProfileName] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const theme = useSyncExternalStore(subscribeToTheme, getTheme, (): Theme => "light");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback(() => setIsOpen(false), []);

  // Load the real session and profile from Supabase.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase.from("profiles").select("platform_role, display_name").eq("id", userId).single();
      if (data) {
        setRole(data.platform_role);
        setProfileName(data.display_name || null);
      }
    };

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) {
        fetchProfile(data.user.id).finally(() => setIsLoaded(true));
      } else {
        setIsLoaded(true);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setIsLoaded(true));
      } else {
        setIsLoaded(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Dismiss on outside press and Escape; focus moves into the menu on open.
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    if (!items.length) return;
    const index = items.indexOf(document.activeElement as HTMLElement);

    if (event.key === "ArrowDown") items[(index + 1) % items.length].focus();
    else if (event.key === "ArrowUp") items[(index - 1 + items.length) % items.length].focus();
    else if (event.key === "Home") items[0].focus();
    else if (event.key === "End") items[items.length - 1].focus();
    else if (event.key === "Tab") setIsOpen(false);
    else return;

    if (event.key !== "Tab") event.preventDefault();
  }

  const handleSignOut = async () => {
    setIsOpen(false);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/auth/sign-out";
  };

  if (!isLoaded) {
    return <Skeleton aria-hidden="true" className={cn("h-10 w-[4.25rem] rounded-full", className)} />;
  }

  const displayName = user
    ? profileName || (user.user_metadata?.display_name as string) || (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "Member"
    : "Guest";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const isTechUser = role === "tech_user";
  const roleLabel = isTechUser ? "Tech professional" : role !== "user" ? role.replace(/_/g, " ") : null;

  return (
    <div ref={rootRef} className={cn("relative inline-block text-left", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? menuId : undefined}
        aria-label={user ? `Account menu for ${displayName}` : "Account menu"}
        className={cn(
          "focus-ring inline-flex h-10 select-none items-center gap-1.5 rounded-full border bg-surface-1 pl-1 pr-2.5 transition-ui elev-sm hover:border-line-strong pointer-coarse:h-11",
          isOpen ? "border-accent ring-4 ring-accent/15" : "border-line",
        )}
      >
        {user ? (
          <Avatar name={displayName} src={avatarUrl} size="sm" status="online" />
        ) : (
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-surface-3 text-[1.05rem] text-fg-muted">
            <UserIcon />
          </span>
        )}
        <ChevronDownIcon aria-hidden="true" className={cn("size-4 text-fg-subtle transition-transform duration-200", isOpen && "rotate-180 text-fg")} />
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          id={menuId}
          role="menu"
          aria-label="Account"
          onKeyDown={handlePanelKeyDown}
          className="um-pop absolute right-0 top-full z-[2000] mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface-1 p-1.5 elev-lg"
        >
          {user ? (
            <>
              <div className="flex items-center gap-3 px-2.5 pb-3 pt-2.5">
                <Avatar name={displayName} src={avatarUrl} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  <p className="truncate text-xs text-fg-subtle">{user.email}</p>
                  {roleLabel && (
                    <Badge variant="accent" size="sm" className="mt-1.5 capitalize">
                      {roleLabel}
                    </Badge>
                  )}
                </div>
              </div>
              <div role="separator" className="mx-1 h-px bg-line" />

              <div className="py-1.5">
                {role === "platform_admin" ? (
                  <>
                    <MenuLink href="/platform-admin" icon={<ShieldCheckIcon />} label="Platform console" onSelect={close} />
                    {hasWorkspace && <MenuLink href="/admin" icon={<ChartIcon />} label="Workspace console" onSelect={close} />}
                    {hasWorkspace && <MenuLink href="/admin/settings" icon={<SettingsIcon />} label="Workspace settings" onSelect={close} />}
                  </>
                ) : isTechUser ? (
                  <>
                    <MenuLink href="/dashboard" icon={<BriefcaseIcon />} label="Tech dashboard" description="Your profile, skills and activity" onSelect={close} />
                    <MenuLink href="/dashboard#matches" icon={<SparklesIcon />} label="Role matches" description="Open roles for your skills" onSelect={close} />
                    <MenuLink href="/dashboard#saved" icon={<HeartIcon />} label="Saved companies" description="Your shortlist" onSelect={close} />
                    <MenuLink href="/submit" icon={<PlusIcon />} label="Suggest a company" onSelect={close} />
                  </>
                ) : (
                  <>
                    <MenuLink href="/dashboard" icon={<ChartIcon />} label="Dashboard" description="My submissions, saves and stats" onSelect={close} />
                    <MenuLink href="/admin" icon={<ShieldCheckIcon />} label="Admin console" description="Directory management and KPIs" badge="Hub" onSelect={close} />
                    <MenuLink href="/admin/listings" icon={<MapPinIcon />} label="All listings" onSelect={close} />
                    <MenuLink href="/submit" icon={<PlusIcon />} label="Add a new place" onSelect={close} />
                    <MenuLink href="/admin/settings" icon={<SettingsIcon />} label="Account settings" onSelect={close} />
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="py-1">
              <Link href="/auth/login" role="menuitem" tabIndex={-1} onClick={close} className={cn(itemClasses, "bg-accent-soft hover:bg-accent-soft/70")}>
                <IconTile tone="accent">
                  <UserIcon />
                </IconTile>
                <span className="flex-1 text-sm font-medium text-accent-text">Sign in or register</span>
              </Link>
            </div>
          )}

          <div role="separator" className="mx-1 h-px bg-line" />
          <div className="py-1.5">
            <button type="button" role="menuitem" tabIndex={-1} onClick={() => applyTheme(theme === "dark" ? "light" : "dark")} className={itemClasses}>
              <IconTile>{theme === "dark" ? <SunIcon /> : <MoonIcon />}</IconTile>
              <span className="flex-1 text-sm font-medium">{theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}</span>
            </button>
            {user && (
              <MenuLink href="/" icon={<GlobeIcon />} label="Global Tech Atlas" onSelect={close} />
            )}
          </div>

          {user && (
            <>
              <div role="separator" className="mx-1 h-px bg-line" />
              <div className="pt-1.5">
                <button type="button" role="menuitem" tabIndex={-1} onClick={handleSignOut} className={cn(itemClasses, "hover:bg-danger-soft focus-visible:bg-danger-soft")}>
                  <IconTile tone="danger">
                    <LogOutIcon />
                  </IconTile>
                  <span className="flex-1 text-sm font-medium text-danger">Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
