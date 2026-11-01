import type { Metadata } from "next";
import Link from "next/link";
import "../landing-effects.css";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/landing/reveal";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import {
  ArrowRightIcon,
  BoltIcon,
  BriefcaseIcon,
  BuildingIcon,
  ChartIcon,
  ChevronRightIcon,
  CloudIcon,
  CodeIcon,
  GlobeIcon,
  LayersIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
} from "@/components/ui/icons";
import { GLOBAL_COUNTRIES, GLOBAL_TECH_HUBS, TECH_SECTORS } from "@/lib/constants/tech-hubs";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "About LocaToGo | Global Tech Atlas",
  description: "Learn how LocaToGo maps technology companies, global tech hubs, and live job opportunities for the modern tech ecosystem.",
  keywords: ["about LocaToGo", "global tech atlas", "technology company map", "startup ecosystem directory"],
  authors: [{ name: "LocaToGo" }],
  creator: "LocaToGo",
  publisher: "LocaToGo",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About LocaToGo | Global Tech Atlas",
    description: "Learn how LocaToGo maps technology companies, global tech hubs, and live job opportunities.",
    url: "/about",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const revalidate = 3600;

const PILLARS = [
  {
    icon: <GlobeIcon />,
    title: "Explore global tech hubs",
    body: "Browse technology ecosystems by country, city, and locality, from Bengaluru and New York to London, Singapore, and beyond. Every company is placed in geographic context.",
  },
  {
    icon: <BuildingIcon />,
    title: "Company intelligence",
    body: "Compare company type, funding stage, team scale, technology stack, location, website, and careers information in one searchable profile.",
  },
  {
    icon: <BriefcaseIcon />,
    title: "Live hiring signals",
    body: "Find active roles by department, experience level, workplace model, and location, then follow the direct career link to the source company.",
  },
  {
    icon: <ShieldCheckIcon />,
    title: "Curated and community-improved",
    body: "Company submissions are reviewed before publication, while operators and company teams can keep profiles structured, current, and useful to the ecosystem.",
  },
];

const SECTOR_ICONS: Record<string, React.ReactNode> = {
  product_saas: <CloudIcon />,
  tech_giant_mnc: <BuildingIcon />,
  it_services_consulting: <LayersIcon />,
  deeptech_hardware: <BoltIcon />,
  startup: <TrendingUpIcon />,
  vc_accelerator: <ChartIcon />,
};

// Hubs that get a name and coordinates on the atlas card; every hub is plotted as a pin.
const LABELLED_HUBS: { id: string; dx: number; dy: number; anchor: "start" | "middle" | "end" }[] = [
  { id: "silicon-valley", dx: -6, dy: 22, anchor: "start" },
  { id: "new-york", dx: 0, dy: -26, anchor: "middle" },
  { id: "london", dx: 0, dy: -26, anchor: "middle" },
  { id: "bengaluru", dx: -8, dy: 20, anchor: "end" },
  { id: "singapore", dx: 10, dy: 18, anchor: "start" },
  { id: "tokyo", dx: -10, dy: -22, anchor: "end" },
  { id: "sydney", dx: -10, dy: -6, anchor: "end" },
];

// Equal degrees on both axes, cropped to where the hubs are, so the plot is not stretched.
const ATLAS = { width: 560, height: 213, minLng: -135, maxLng: 165, maxLat: 72, minLat: -42 };

const project = (lat: number, lng: number) => ({
  x: ((lng - ATLAS.minLng) / (ATLAS.maxLng - ATLAS.minLng)) * ATLAS.width,
  y: ((ATLAS.maxLat - lat) / (ATLAS.maxLat - ATLAS.minLat)) * ATLAS.height,
});

const formatCoordinate = (lat: number, lng: number) =>
  `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"} ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? "E" : "W"}`;

function HubAtlas({ companies, roles }: { companies: number | null; roles: number | null }) {
  const countries = GLOBAL_COUNTRIES.filter((country) => country.code !== "ALL").length;
  const meridians = [-120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
  const parallels = [60, 30, 0, -30];
  const labelled = LABELLED_HUBS.flatMap((label) => {
    const hub = GLOBAL_TECH_HUBS.find((candidate) => candidate.id === label.id);
    return hub ? [{ ...label, hub }] : [];
  });

  const stats = [
    { label: "Tech companies", value: companies },
    { label: "Live roles", value: roles },
    { label: "Tech hubs", value: GLOBAL_TECH_HUBS.length },
    { label: "Countries", value: countries },
  ];

  return (
    <Card padding="sm" className="animate-fade-up sm:p-6">
      <svg
        role="img"
        aria-label={`Map of ${GLOBAL_TECH_HUBS.length} tech hubs across ${countries} countries, plotted by latitude and longitude`}
        viewBox={`0 0 ${ATLAS.width} ${ATLAS.height}`}
        className="h-auto w-full text-fg-subtle"
      >
        <g className="stroke-line-strong" strokeWidth="1" strokeDasharray="2 6" strokeLinecap="round">
          {meridians.map((lng) => {
            const { x } = project(0, lng);
            return <line key={lng} x1={x} y1={0} x2={x} y2={ATLAS.height} />;
          })}
          {parallels.map((lat) => {
            const { y } = project(lat, 0);
            return <line key={lat} x1={0} y1={y} x2={ATLAS.width} y2={y} />;
          })}
        </g>

        <g className="fill-accent opacity-60">
          {GLOBAL_TECH_HUBS.map((hub) => {
            const { x, y } = project(hub.lat, hub.lng);
            return <circle key={hub.id} cx={x} cy={y} r={3} />;
          })}
        </g>

        {labelled.map(({ hub, dx, dy, anchor }) => {
          const { x, y } = project(hub.lat, hub.lng);
          return (
            <g key={hub.id}>
              <circle cx={x} cy={y} r={10} className="fill-accent/15" />
              <circle cx={x} cy={y} r={4.5} className="fill-accent" />
              <g className="max-sm:hidden">
                <text x={x + dx} y={y + dy} textAnchor={anchor} className="fill-fg text-[11px] font-medium">
                  {hub.name}
                </text>
                <text x={x + dx} y={y + dy + 12} textAnchor={anchor} className="fill-fg-subtle font-mono text-[9px]">
                  {formatCoordinate(hub.lat, hub.lng)}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-line pt-5 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse gap-1">
            <dt className="text-sm text-fg-muted">{stat.label}</dt>
            <dd className="font-display text-2xl font-semibold tracking-tight text-fg tabular-nums sm:text-3xl">
              <CountUp value={stat.value} />
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export default async function AboutPage() {
  const supabase = await createSupabaseServerClient();
  const [{ count: companies }, { count: roles }] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "published").not("company_type", "is", null),
    supabase.from("company_jobs").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-surface-0 text-fg">
      <PublicHeader />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 pb-20 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="pt-8">
          <ol className="flex items-center gap-1.5 text-sm text-fg-subtle">
            <li>
              <Link href="/" className="focus-ring rounded transition-colors hover:text-fg">
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRightIcon className="size-4" />
            </li>
            <li aria-current="page" className="text-fg">
              About LocaToGo
            </li>
          </ol>
        </nav>

        <section className="grid items-center gap-12 py-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14 lg:py-20">
          <div>
            <p className="text-sm font-medium text-accent-text">Our mission</p>
            <h1 className="mt-4 text-balance font-display text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.08] tracking-tight">
              Mapping the companies shaping the next tech economy
            </h1>
            <p className="mt-6 max-w-[60ch] text-base leading-7 text-fg-muted">
              LocaToGo is a global Tech Atlas for discovering companies, startups, MNC GCCs, technology hubs, and live opportunities. We connect geographic context with company intelligence so people can understand where technology is being built and where teams are hiring.
            </p>
          </div>
          <HubAtlas companies={companies ?? null} roles={roles ?? null} />
        </section>

        <section aria-labelledby="pillars-heading">
          <h2 id="pillars-heading" className="sr-only">
            What the atlas does
          </h2>
          <ul role="list" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((pillar, index) => (
              <li key={pillar.title}>
                <Reveal index={index} className="h-full">
                  <Card className="h-full">
                    <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-xl text-accent-text">{pillar.icon}</span>
                    <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">{pillar.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-fg-muted">{pillar.body}</p>
                  </Card>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="coverage-heading" className="mt-20 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div>
            <h2 id="coverage-heading" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              What the Tech Atlas covers
            </h2>
            <p className="mt-3 max-w-[48ch] text-sm leading-6 text-fg-muted">
              The company types and technology ecosystems represented across our global hub directory.
            </p>
          </div>
          <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {TECH_SECTORS.filter((sector) => sector.id !== "all").map((sector, index) => (
              <li key={sector.id}>
                <Reveal index={index}>
                  <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-1 p-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-3 text-lg text-fg-muted">
                      {SECTOR_ICONS[sector.id] ?? <CodeIcon />}
                    </span>
                    <span className="text-sm font-medium">{sector.name}</span>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="cta-heading" className="mt-20">
          <Card padding="lg" className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[56ch]">
              <h2 id="cta-heading" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Is your company part of the ecosystem?
              </h2>
              <p className="mt-3 text-sm leading-6 text-fg-muted">
                Add your company to the Tech Atlas with its sector, location, website, careers page, and a clear description of what you build.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/submit" className={buttonVariants({ size: "lg" })}>
                <PlusIcon className="size-4" />
                Add your company
              </Link>
              <Link href="/" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                Explore the Tech Atlas
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
          </Card>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
