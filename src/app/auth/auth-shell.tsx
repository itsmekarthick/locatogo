import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeftIcon, BriefcaseIcon, HeartIcon, MapPinIcon, type IconProps } from "@/components/ui/icons";

type Point = { icon: ComponentType<IconProps>; title: string; text: string };

export type AuthBrand = { headline: string; text: string; points?: Point[] };

const DEFAULT_POINTS: Point[] = [
  { icon: MapPinIcon, title: "Explore by hub", text: "Browse technology companies on a live map, city by city." },
  { icon: BriefcaseIcon, title: "Follow live roles", text: "Open positions synced from company career pages and ATS feeds." },
  { icon: HeartIcon, title: "Keep your shortlist", text: "Save companies and come back to them from your dashboard." },
];

type AuthShellProps = {
  /** Small status label above the title. */
  eyebrow: string;
  title: string;
  description: string;
  brand: AuthBrand;
  children: ReactNode;
  /** Switch-page prompt under the form. */
  footer?: ReactNode;
  /** Terms and privacy line, wording differs per screen. */
  legal?: string;
};

const MESH = {
  backgroundImage:
    "radial-gradient(55% 60% at 10% 0%, color-mix(in oklab, var(--accent) 30%, transparent), transparent 70%), radial-gradient(45% 55% at 100% 55%, color-mix(in oklab, var(--accent-vivid, var(--accent)) 20%, transparent), transparent 72%), radial-gradient(50% 50% at 30% 100%, color-mix(in oklab, var(--info) 18%, transparent), transparent 70%)",
};

/** Split layout: brand visual beside the form on desktop, form only on mobile. */
export function AuthShell({ eyebrow, title, description, brand, children, footer, legal = "By continuing, you agree to our" }: AuthShellProps) {
  const points = brand.points ?? DEFAULT_POINTS;

  return (
    <div className="grid min-h-dvh bg-surface-0 text-fg lg:grid-cols-2">
      <aside aria-label="About LocaToGo" className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-surface-2 p-12 lg:flex xl:p-16">
        <div aria-hidden="true" className="absolute inset-0" style={MESH} />
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative flex items-center justify-between">
          <Link href="/" className="focus-ring flex items-center gap-2.5 rounded-lg">
            <BrandLogo size={36} />
            <span className="font-display text-2xl font-semibold tracking-tight">
              LocaToGo<span className="text-accent-text">.</span>
            </span>
          </Link>
          <Link href="/" className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-[var(--glass)] px-3.5 text-sm text-fg-muted backdrop-blur-md transition-ui hover:text-fg">
            <ArrowLeftIcon className="size-4" />
            Live map
          </Link>
        </div>

        <div className="relative my-auto max-w-lg py-12">
          <h2 className="text-balance font-display text-[clamp(2rem,3vw,2.75rem)] font-semibold leading-[1.1] tracking-tight">{brand.headline}</h2>
          <p className="mt-4 text-base text-fg-muted">{brand.text}</p>

          <ul role="list" className="mt-8 space-y-3">
            {points.map((point) => {
              const Icon = point.icon;
              return (
                <li key={point.title} className="flex items-start gap-3.5 rounded-2xl border border-line bg-[var(--glass)] p-4 backdrop-blur-md">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-xl text-accent-text">
                    <Icon />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{point.title}</span>
                    <span className="mt-0.5 block text-sm text-fg-muted">{point.text}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative flex items-center justify-between border-t border-line pt-4 text-xs text-fg-subtle">
          <p>© {new Date().getFullYear()} LocaToGo</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="transition-colors hover:text-fg">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-fg">
              Terms
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col px-5 py-6 sm:px-10 lg:px-12 xl:px-16">
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="LocaToGo home" className="focus-ring flex items-center gap-2.5 rounded-lg lg:invisible">
            <BrandLogo size={32} />
            <span className="font-display text-xl font-semibold tracking-tight">
              LocaToGo<span className="text-accent-text">.</span>
            </span>
          </Link>
          <ThemeToggle />
        </header>

        <div className="mx-auto my-auto w-full max-w-md py-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-text">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            {eyebrow}
          </p>
          <h1 className="mt-4 text-balance font-display text-[clamp(1.875rem,4vw,2.5rem)] font-semibold leading-[1.1] tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-fg-muted sm:text-base">{description}</p>

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-8 border-t border-line pt-6 text-center text-sm text-fg-muted">{footer}</div>}
        </div>

        <p className="text-center text-xs text-fg-subtle">
          {legal}{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-fg">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-fg">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
