import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { APP_URL } from "@/lib/constants/app-url";

const COLUMNS = [
  {
    title: "Directory",
    links: [
      { label: "Live Atlas", href: APP_URL, external: true },
      { label: "City guides & stories", href: "/blog" },
      { label: "About LocaToGo", href: "/about" },
      { label: "Add company", href: "/submit" },
    ],
  },
  {
    title: "Administration",
    links: [
      { label: "Admin dashboard", href: "/admin" },
      { label: "Visitor analytics", href: "/admin/analytics" },
      { label: "Team & permissions", href: "/admin/team" },
    ],
  },
  {
    title: "Legal & trust",
    links: [
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of service", href: "/terms" },
      { label: "Contact support", href: "/contact" },
    ],
  },
];

const SOCIALS = [
  {
    label: "X (Twitter)",
    href: "https://x.com/locatogo",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/locatogo",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61594797068652",
    path: "M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z",
  },
];

const linkClasses = "focus-ring rounded-md text-sm text-fg-muted transition-colors duration-200 hover:text-fg";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface-1 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 border-b border-line pb-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandLogo size={28} />
              <span className="font-display text-xl font-semibold tracking-tight text-fg">
                LocaToGo<span className="text-accent-text">.</span>
              </span>
            </div>
            <p className="mt-4 max-w-[32ch] text-sm text-fg-muted">
              A global Tech Atlas for companies, hubs and live opportunities.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-sm font-medium text-fg">{column.title}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {"external" in link ? (
                      <a href={link.href} className={linkClasses}>
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className={linkClasses}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-6 text-sm text-fg-subtle sm:flex-row">
          <p>© {new Date().getFullYear()} LocaToGo SaaS. All rights reserved.</p>
          <div className="flex items-center gap-1">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="focus-ring grid size-10 place-items-center rounded-lg text-fg-subtle transition-colors duration-200 hover:bg-surface-3 hover:text-fg"
              >
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
          <p>Crafted for modern map-first discovery.</p>
        </div>
      </div>
    </footer>
  );
}
