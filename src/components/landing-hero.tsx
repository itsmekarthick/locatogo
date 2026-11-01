"use client";

import { useRef, type CSSProperties } from "react";
import { Badge, buttonVariants } from "@/components/ui";
import { ArrowRightIcon } from "@/components/ui/icons";
import { CommandSearch, type SearchHub } from "@/components/landing/command-search";
import { HeroPreview } from "@/components/landing/hero-preview";
import { useInView } from "@/components/landing/use-in-view";
import { APP_URL } from "@/lib/constants/app-url";
import type { LandingLive } from "@/lib/landing/data";

const TRENDING = ["AI startups", "SaaS companies", "GCCs", "Fintech", "Remote jobs", "Bengaluru"];

const rise = (index: number) => ({ "--i": index }) as CSSProperties;

type LandingHeroProps = {
  openRoles: number | null;
  hubs: SearchHub[];
  popularHubs: SearchHub[];
  examples: string[];
  live: LandingLive;
  hubCount: number;
  countryCount: number;
};

export function LandingHero({
  openRoles,
  hubs,
  popularHubs,
  examples,
  live,
  hubCount,
  countryCount,
}: LandingHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);

  return (
    <section
      ref={ref}
      data-active={inView}
      className="lp-hero lp-grain relative isolate overflow-x-clip pb-20 pt-[clamp(1rem,2.5vh,2.5rem)] sm:pb-28"
    >
      <div aria-hidden="true" className="lp-mesh -z-10">
        <div className="lp-blob lp-blob-a" />
        <div className="lp-blob lp-blob-b" />
        <div className="lp-blob lp-blob-c" />
      </div>

      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        {openRoles != null && openRoles > 0 && (
          <div className="lp-rise" style={rise(0)}>
            <Badge variant="accent" dot className="h-7 px-3">
              {openRoles.toLocaleString("en-US")} open roles right now
            </Badge>
          </div>
        )}

        <h1
          className="lp-rise mx-auto mt-[clamp(0.5rem,1.6vh,1rem)] max-w-6xl text-balance font-display text-[clamp(1.75rem,min(3.9vw,6.2vh),3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-fg"
          style={rise(1)}
        >
          Find the companies shaping{" "}
          <span className="bg-gradient-to-r from-accent-600 via-accent-500 to-accent-400 bg-clip-text text-transparent dark:from-accent-300 dark:via-accent-400 dark:to-accent-500">
            the next tech economy
          </span>
          .
        </h1>

        <p className="lp-rise mx-auto mt-[clamp(0.5rem,1.4vh,1rem)] max-w-[120ch] text-sm text-fg-muted" style={rise(2)}>
          Explore technology companies, startups, AI labs and MNC GCCs across the world&apos;s innovation hubs. Add your
          resume and see which live roles fit you best, and why.
        </p>

        <div className="lp-rise relative z-20 mx-auto mt-[clamp(0.625rem,1.8vh,1.25rem)] max-w-2xl" style={rise(3)}>
          <CommandSearch hubs={hubs} popularHubs={popularHubs} examples={examples} />
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-sm text-fg-subtle">
            <span>Trending</span>
            {TRENDING.map((tag) => (
              <a
                key={tag}
                href={`${APP_URL}/?q=${encodeURIComponent(tag)}`}
                className="focus-ring inline-flex h-7 items-center rounded-full border border-line-strong bg-surface-1/70 px-3 text-xs text-fg-muted transition-ui hover:bg-surface-3 hover:text-fg pointer-coarse:h-10"
              >
                {tag}
              </a>
            ))}
          </div>
        </div>

        <div className="lp-rise mt-[clamp(0.625rem,1.6vh,1.25rem)] flex flex-wrap items-center justify-center gap-3" style={rise(4)}>
          <a href={APP_URL} className={buttonVariants({ size: "md" })}>
            Explore Tech Atlas
            <ArrowRightIcon className="size-4" />
          </a>
          <a href={`${APP_URL}/matches`} className={buttonVariants({ variant: "secondary", size: "md" })}>
            Match my resume
          </a>
        </div>

        <div className="lp-rise mt-5 sm:mt-6" style={rise(6)}>
          <HeroPreview live={live} hubCount={hubCount} countryCount={countryCount} />
        </div>
      </div>
    </section>
  );
}
