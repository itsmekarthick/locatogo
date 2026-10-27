import type { ReactNode } from "react";
import Link from "next/link";
import { Badge, buttonVariants } from "@/components/ui";
import {
  ArrowUpRightIcon,
  BriefcaseIcon,
  BuildingIcon,
  GlobeIcon,
  LinkIcon,
  SlidersIcon,
  SparklesIcon,
} from "@/components/ui/icons";
import { CountUp } from "@/components/landing/count-up";
import { Reveal } from "@/components/landing/reveal";
import { SpotlightCard } from "@/components/landing/spotlight-card";

type StatsProps = {
  companies: number | null;
  roles: number | null;
  hubs: number;
  countries: number;
};

export function LandingStats({ companies, roles, hubs, countries }: StatsProps) {
  const stats = [
    { label: "Tech companies", value: companies, desc: "Startups, scaleups and global teams" },
    { label: "Live roles", value: roles, desc: "Linked to company career pages" },
    { label: "Tech hubs", value: hubs, desc: "Technology clusters around the world" },
    { label: "Countries", value: countries, desc: "Each with a leading hub to start from" },
  ];

  return (
    <section aria-label="Atlas at a glance" className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} index={index} className="bg-surface-1 p-6 sm:p-8">
              <p className="font-display text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
                <CountUp value={stat.value} />
              </p>
              <p className="mt-3 text-sm font-medium text-fg">{stat.label}</p>
              <p className="mt-1 text-sm text-fg-muted">{stat.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureHeader({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div>
      <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-xl text-accent-text">{icon}</span>
      <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-fg">{title}</h3>
      <p className="mt-2 max-w-[46ch] text-sm text-fg-muted">{children}</p>
    </div>
  );
}

function Bar({ className, width }: { className?: string; width?: number }) {
  return (
    <span
      className={`block h-2.5 rounded-full bg-surface-3 ${className ?? ""}`}
      style={width ? { width: `${width}%` } : undefined}
    />
  );
}

const PINS = [
  { left: "18%", top: "38%" },
  { left: "34%", top: "62%" },
  { left: "52%", top: "30%" },
  { left: "63%", top: "58%" },
  { left: "78%", top: "36%" },
  { left: "88%", top: "66%" },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-medium text-accent-text">Why Tech Atlas</p>
          <h2 className="mt-3 font-display text-[clamp(1.75rem,3.6vw,3rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-fg">
            A clearer way to see where technology is being built.
          </h2>
          <p className="mt-4 max-w-[60ch] text-base text-fg-muted">
            LocaToGo brings geographic context, company intelligence and live hiring signals into one searchable atlas.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          <Reveal index={0} className="lg:col-span-7">
            <SpotlightCard className="flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
              <FeatureHeader icon={<GlobeIcon />} title="Explore hubs on a live map">
                Move from country to city to company with geographic context for every technology cluster.
              </FeatureHeader>
              <div aria-hidden="true" className="lp-dots relative h-44 overflow-hidden rounded-2xl border border-line bg-surface-0">
                {PINS.map((pin, index) => (
                  <span
                    key={index}
                    className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-1 bg-accent elev-sm"
                    style={pin}
                  />
                ))}
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal index={1} className="lg:col-span-5">
            <SpotlightCard className="flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
              <FeatureHeader icon={<SlidersIcon />} title="Filter the ecosystem">
                Narrow companies by sector, funding stage, workplace model, stack and hiring activity.
              </FeatureHeader>
              <div aria-hidden="true" className="flex flex-wrap gap-2">
                <Badge variant="accent">Hiring</Badge>
                <Badge>Series B</Badge>
                <Badge>Remote</Badge>
                <Badge>Fintech</Badge>
                <Badge variant="accent">GCC</Badge>
                <Badge>Rust</Badge>
                <Badge>Seed</Badge>
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal index={2} className="lg:col-span-4">
            <SpotlightCard className="flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
              <FeatureHeader icon={<BriefcaseIcon />} title="Find live opportunities">
                Browse active openings by role, level, department, location and workplace type.
              </FeatureHeader>
              <div aria-hidden="true" className="space-y-3">
                {[60, 44, 52].map((width, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-0 px-3 py-2.5">
                    <div className="flex-1 space-y-2">
                      <Bar width={width} />
                      <Bar className="h-2 w-1/3 opacity-60" />
                    </div>
                    <Badge size="sm" variant={index === 0 ? "accent" : "neutral"}>
                      {index === 1 ? "Remote" : "Hybrid"}
                    </Badge>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal index={3} className="lg:col-span-4">
            <SpotlightCard className="flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
              <FeatureHeader icon={<BuildingIcon />} title="Understand each company">
                Open a profile for type, stage, location, stack, team size and available roles.
              </FeatureHeader>
              <div aria-hidden="true" className="flex items-center gap-3 rounded-2xl border border-line bg-surface-0 p-3">
                <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-xl text-accent-text">
                  <BuildingIcon />
                </span>
                <div className="flex-1 space-y-2">
                  <Bar className="w-2/3" />
                  <div className="flex gap-1.5">
                    <Badge size="sm" variant="success">Verified</Badge>
                    <Badge size="sm">Series C+</Badge>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal index={4} className="lg:col-span-4">
            <SpotlightCard className="flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
              <FeatureHeader icon={<LinkIcon />} title="Direct paths to apply">
                Follow current career links from the source company instead of stale job-board copies.
              </FeatureHeader>
              <div
                aria-hidden="true"
                className="flex items-center justify-between rounded-xl border border-line-strong bg-surface-0 px-4 py-3 text-sm font-medium text-fg"
              >
                Apply on company site
                <ArrowUpRightIcon className="size-4 text-accent-text" />
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal index={5} className="lg:col-span-12">
            <SpotlightCard className="flex flex-col items-start justify-between gap-6 p-6 sm:p-8 md:flex-row md:items-center">
              <div className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-xl text-accent-text">
                  <SparklesIcon />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-fg">Built for the ecosystem</h3>
                  <p className="mt-2 max-w-[60ch] text-sm text-fg-muted">
                    Companies can submit and maintain their presence while operators keep the atlas structured and
                    useful.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/submit" className={buttonVariants()}>
                  Add your company
                </Link>
                <Link href="/about" className={buttonVariants({ variant: "secondary" })}>
                  About the atlas
                </Link>
              </div>
            </SpotlightCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
