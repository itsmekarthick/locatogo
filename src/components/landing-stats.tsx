import type { ReactNode } from "react";
import Link from "next/link";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { WorldDots } from "@/components/landing/world-dots";
import { Badge, buttonVariants } from "@/components/ui";
import {
  ArrowUpRightIcon,
  BuildingIcon,
  GlobeIcon,
  LinkIcon,
  SlidersIcon,
  SparklesIcon,
} from "@/components/ui/icons";
import { CountUp } from "@/components/ui/count-up";
import { Reveal } from "@/components/landing/reveal";
import { SpotlightCard } from "@/components/landing/spotlight-card";
import { APP_URL } from "@/lib/constants/app-url";
import { LEVELS, ROLE_CATEGORIES } from "@/lib/jobs/taxonomy";
import type { HubTour, LandingLive } from "@/lib/landing/data";
import { MAP_H, MAP_W, projectToMap } from "@/lib/landing/map";

type StatsProps = {
  companies: number | null;
  roles: number | null;
  freshers: number | null;
  weekRoles: number | null;
};

export function LandingStats({ companies, roles, freshers, weekRoles }: StatsProps) {
  const stats = [
    { label: "Tech companies", value: companies, desc: "Startups, scaleups and global teams" },
    { label: "Live roles", value: roles, desc: "Linked to company career pages" },
    { label: "Open to freshers", value: freshers, desc: "Internships and entry-level roles, read from the title" },
    { label: "Posted this week", value: weekRoles, desc: "New openings since the last seven days" },
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

const fmt = (value: number) => value.toLocaleString("en-US");
const LABEL_LEFT = ["london", "bengaluru"];

/** The same dotted continents as the hero, with the hubs sized by their open roles. Static: nothing animates here. */
function HubMap({ tours }: { tours: HubTour[] }) {
  const maxRoles = Math.max(1, ...tours.map((hub) => hub.roles));
  return (
    <div aria-hidden="true" className="relative h-44 overflow-hidden rounded-2xl border border-line bg-surface-0">
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <WorldDots />
        {tours.map((hub) => {
          const { x, y } = projectToMap(hub.lat, hub.lng);
          const radius = 2.8 + 3.4 * Math.sqrt(hub.roles / maxRoles);
          const left = LABEL_LEFT.includes(hub.id);
          return (
            <g key={hub.id}>
              <circle cx={x} cy={y} r={radius} className="fill-accent-500" />
              <circle cx={x} cy={y} r={radius * 0.38} className="fill-surface-1" />
              <text
                x={left ? x - radius - 5 : x + radius + 5}
                y={y + 3.5}
                fontSize={11}
                textAnchor={left ? "end" : "start"}
                className="fill-fg-muted"
                stroke="var(--surface-0)"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {hub.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function LandingFeatures({ live }: { live: LandingLive }) {
  const { facets } = live;
  const level = (id: string) => LEVELS.find((item) => item.id === id)?.label ?? id;
  const category = (id: string) => ROLE_CATEGORIES.find((item) => item.id === id)?.label ?? id;
  const filterChips: { label: string; count: number; accent?: boolean }[] = [
    { label: "Freshers", count: facets.freshers, accent: true },
    { label: level("entry"), count: facets.levels.entry ?? 0 },
    { label: level("senior"), count: facets.levels.senior ?? 0 },
    { label: "Remote", count: facets.workplaces.remote ?? 0, accent: true },
    { label: category("ml_ai"), count: facets.categories.ml_ai ?? 0 },
    { label: category("product"), count: facets.categories.product ?? 0 },
    { label: category("data"), count: facets.categories.data ?? 0 },
  ];

  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-medium text-accent-text">Why Tech Atlas</p>
          <h2 className="mt-3 font-display text-[clamp(1.75rem,3.6vw,3rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-fg">
            A clearer way to see where technology is being built, and where you fit.
          </h2>
          <p className="mt-4 max-w-[60ch] text-base text-fg-muted">
            LocaToGo brings geographic context, company intelligence and live hiring signals into one searchable atlas,
            then scores the roles against your own resume.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Reveal index={0} className="lg:col-span-7">
            <SpotlightCard className="flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
              <FeatureHeader icon={<GlobeIcon />} title="Explore hubs on a live map">
                Move from country to city to company with geographic context for every technology cluster. Bigger dots
                mean more open roles.
              </FeatureHeader>
              <HubMap tours={live.tours} />
            </SpotlightCard>
          </Reveal>

          <Reveal index={1} className="lg:col-span-5">
            <SpotlightCard className="flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
              <FeatureHeader icon={<SlidersIcon />} title="Filter down to your kind of role">
                Choose a level, a work mode and any of {ROLE_CATEGORIES.length} role types, or switch on Freshers. Every
                option shows how many roles it will give you before you click.
              </FeatureHeader>
              <div aria-hidden="true" className="flex flex-wrap gap-2">
                {filterChips.map((chip) => (
                  <Badge key={chip.label} variant={chip.accent ? "accent" : "neutral"}>
                    {chip.label} <span className="tabular-nums opacity-70">{fmt(chip.count)}</span>
                  </Badge>
                ))}
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal index={2} className="lg:col-span-4">
            <SpotlightCard className="flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
              <FeatureHeader icon={<SparklesIcon />} title="Match your resume">
                Upload a resume once. Every open role in your hub is scored for fit, with a short note on why it fits and
                what to check.
              </FeatureHeader>
              <div className="space-y-3">
                <div aria-hidden="true" className="space-y-2">
                  {live.demoMatches.slice(0, 2).map((match) => (
                    <div key={match.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface-0 p-2.5">
                      <CompanyBrandAvatar title={match.company} website={match.website} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">{match.title}</p>
                        <p className="truncate text-xs text-fg-subtle">{match.company}</p>
                      </div>
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-sm font-semibold tabular-nums text-accent-text">
                        {match.score}
                      </span>
                    </div>
                  ))}
                </div>
                <a href={`${APP_URL}/matches`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                  Match my resume
                  <ArrowUpRightIcon className="size-3.5" />
                </a>
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
