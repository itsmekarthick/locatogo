import type { ComponentType } from "react";
import {
  BoltIcon,
  BuildingIcon,
  ChartIcon,
  ClockIcon,
  CreditCardIcon,
  DownloadIcon,
  FileTextIcon,
  GlobeIcon,
  GridIcon,
  MailIcon,
  MapPinIcon,
  MegaphoneIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SlidersIcon,
  TagIcon,
  UsersIcon,
  type IconProps,
} from "@/components/ui/icons";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: ComponentType<IconProps>;
  /** Extra words the command palette matches on. */
  keywords?: string;
};

export type AdminNavSection = { title: string; items: AdminNavItem[] };

export const ADMIN_NAV: AdminNavSection[] = [
  {
    title: "Core operations",
    items: [
      { label: "Overview", href: "/admin", icon: GridIcon, keywords: "dashboard home" },
      { label: "Listings", href: "/admin/listings", icon: MapPinIcon, keywords: "places companies" },
      { label: "Import hub", href: "/admin/import", icon: DownloadIcon, keywords: "csv upload" },
    ],
  },
  {
    title: "Structure and taxonomy",
    items: [
      { label: "Categories", href: "/admin/categories", icon: TagIcon },
      { label: "Custom fields", href: "/admin/custom-fields", icon: SlidersIcon },
      { label: "Domains", href: "/admin/domains", icon: GlobeIcon, keywords: "directories atlases" },
    ],
  },
  {
    title: "Curation and growth",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: ChartIcon, keywords: "metrics traffic" },
      { label: "Moderation queue", href: "/admin/moderation", icon: ShieldCheckIcon, keywords: "submissions review" },
      { label: "Ownership claims", href: "/admin/claims", icon: BuildingIcon, keywords: "verify owners" },
      { label: "Advertising and slots", href: "/admin/advertising", icon: MegaphoneIcon, keywords: "ads" },
      { label: "Stories and blogs", href: "/admin/blogs", icon: FileTextIcon, keywords: "articles posts" },
      { label: "Payments and revenue", href: "/admin/payments", icon: CreditCardIcon, keywords: "billing" },
    ],
  },
  {
    title: "Governance and setup",
    items: [
      { label: "Activity trail", href: "/admin/activity", icon: ClockIcon, keywords: "audit log" },
      { label: "Team", href: "/admin/team", icon: UsersIcon, keywords: "members roles" },
      { label: "Email templates", href: "/admin/settings/emails", icon: MailIcon },
      { label: "Settings", href: "/admin/settings", icon: SettingsIcon, keywords: "preferences" },
      { label: "Platform console", href: "/platform-admin", icon: BoltIcon, keywords: "tenants plans" },
    ],
  },
];

/** The most specific nav item whose path prefixes the current one. */
export function isNavActive(pathname: string, href: string) {
  if (href === "/admin" || href === "/platform-admin" || href === "/admin/settings") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const PLATFORM_NAV: AdminNavSection[] = [
  {
    title: "Global platform",
    items: [
      { label: "Overview pulse", href: "/platform-admin", icon: BoltIcon, keywords: "system health" },
      { label: "Tenants directory", href: "/platform-admin/tenants", icon: BuildingIcon, keywords: "workspaces organizations" },
      { label: "Subscription plans", href: "/platform-admin/plans", icon: CreditCardIcon, keywords: "pricing limits" },
    ],
  },
];
