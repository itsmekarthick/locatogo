"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Badge, buttonVariants } from "@/components/ui";
import { ArrowUpRightIcon } from "@/components/ui/icons";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { Reveal } from "@/components/landing/reveal";
import { useInView } from "@/components/landing/use-in-view";
import { LEVELS } from "@/lib/jobs/taxonomy";
import type { LandingLive } from "@/lib/landing/data";
import { cn } from "@/lib/utils/cn";

const STEPS = [
  {
    title: "Choose a tech hub",
    desc: "Start with a country or city hub and see the companies shaping that local ecosystem.",
  },
  {
    title: "Filter to your kind of role",
    desc: "Narrow by level, work mode and role type, or switch on Freshers. Every option shows how many roles it will give you.",
  },
  {
    title: "Match your resume",
    desc: "Upload a resume once. It becomes a structured profile, and every open role in your hub is scored for fit with a note on why.",
  },
  {
    title: "Open roles and apply",
    desc: "Inspect the company profile, review current roles and follow the direct career link to apply.",
  },
];

const fmt = (value: number) => value.toLocaleString("en-US");

function Scene({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" className="h-full rounded-3xl border border-line bg-surface-1 p-5 elev-md sm:p-6">
      {children}
    </div>
  );
}

type HowItWorksProps = { hubNames: string[]; hubCount: number; countryCount: number; live: LandingLive };

export function HowItWorks({ hubNames, hubCount, countryCount, live }: HowItWorksProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const inView = useInView(sectionRef);

  // The step crossing the middle of the viewport becomes active.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    stepRefs.current.forEach((step) => step && observer.observe(step));
    return () => observer.disconnect();
  }, []);

  // Progress line fill follows scroll while the section is on screen.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !inView) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = list.getBoundingClientRect();
      const progress = (window.innerHeight * 0.5 - rect.top) / rect.height;
      list.style.setProperty("--progress", Math.min(1, Math.max(0, progress)).toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [inView]);

  const scenes = [
    <Scene key="hub">
      <p className="text-xs font-medium text-fg-muted">
        {hubCount} hubs · {countryCount} countries
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {hubNames.slice(0, 9).map((name, index) => (
          <Badge key={name} variant={index === 0 ? "accent" : "neutral"} className="h-8 px-3 text-[13px]">
            {name}
          </Badge>
        ))}
      </div>
    </Scene>,
    <Scene key="filter">
      <div className="flex flex-wrap gap-2">
        <Badge variant="accent">Freshers {fmt(live.facets.freshers)}</Badge>
        {LEVELS.filter((level) => ["entry", "mid", "senior"].includes(level.id)).map((level) => (
          <Badge key={level.id}>
            {level.label} {fmt(live.facets.levels[level.id] ?? 0)}
          </Badge>
        ))}
        <Badge>Remote {fmt(live.facets.workplaces.remote ?? 0)}</Badge>
      </div>
      <div className="mt-5 space-y-3">
        {live.fresherRoles.slice(0, 3).map((role) => (
          <div key={role.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface-0 p-3">
            <CompanyBrandAvatar title={role.company} website={role.website} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{role.title}</p>
              <p className="truncate text-xs text-fg-subtle">{[role.company, role.location].filter(Boolean).join(" · ")}</p>
            </div>
            <Badge size="sm" variant="success">
              Fresher
            </Badge>
          </div>
        ))}
      </div>
    </Scene>,
    <Scene key="match">
      <div className="rounded-xl border border-line bg-surface-0 p-3">
        <p className="text-xs font-medium text-fg-muted">Sample profile</p>
        <p className="mt-1 text-sm font-semibold text-fg">{live.demoProfile.headline}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {live.demoProfile.skills.map((skill) => (
            <Badge key={skill} size="sm" variant="accent">
              {skill}
            </Badge>
          ))}
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {live.demoMatches.map((match) => (
          <div key={match.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface-0 p-3">
            <CompanyBrandAvatar title={match.company} website={match.website} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{match.title}</p>
              <p className="truncate text-xs text-fg-subtle">{match.note ?? match.company}</p>
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-sm font-semibold tabular-nums text-accent-text">
              {match.score}
            </span>
          </div>
        ))}
      </div>
    </Scene>,
    <Scene key="apply">
      <div className="space-y-3">
        {live.demoMatches.slice(0, 3).map((match, row) => (
          <div key={match.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface-0 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{match.title}</p>
              <p className="truncate text-xs text-fg-subtle">{[match.company, match.location].filter(Boolean).join(" · ")}</p>
            </div>
            {row === 0 ? (
              <span className={buttonVariants({ size: "sm" })}>
                Apply
                <ArrowUpRightIcon className="size-3.5" />
              </span>
            ) : (
              <Badge size="sm">Company site</Badge>
            )}
          </div>
        ))}
      </div>
    </Scene>,
  ];

  return (
    <section ref={sectionRef} className="border-y border-line bg-surface-1/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-medium text-accent-text">How it works</p>
          <h2 className="mt-3 font-display text-[clamp(1.75rem,3.6vw,3rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-fg">
            From hub to opportunity in four steps.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-24">
          <div className="relative hidden lg:block">
            <div className="sticky top-28 h-[26rem]">
              {scenes.map((scene, index) => (
                <div
                  key={index}
                  className={cn(
                    "absolute inset-0 transition-[opacity,transform] duration-500 ease-emphasized",
                    active === index ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
                  )}
                >
                  {scene}
                </div>
              ))}
            </div>
          </div>

          <ol ref={listRef} className="relative flex flex-col gap-12 pl-10 lg:gap-0">
            <span aria-hidden="true" className="absolute bottom-2 left-3.5 top-2 w-px bg-line">
              <span
                className="absolute inset-0 origin-top bg-accent"
                style={{ transform: "scaleY(var(--progress, 0))" }}
              />
            </span>
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                ref={(node) => {
                  stepRefs.current[index] = node;
                }}
                data-step={index}
                className="relative lg:flex lg:min-h-[22rem] lg:flex-col lg:justify-center"
              >
                <span
                  className={cn(
                    "absolute -left-10 top-0 grid size-7 place-items-center rounded-full border text-xs tabular-nums transition-colors duration-300 lg:top-1/2 lg:-translate-y-1/2",
                    active === index
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-line-strong bg-surface-1 text-fg-subtle",
                  )}
                >
                  {index + 1}
                </span>
                <div className={cn("transition-opacity duration-300", active !== index && "lg:opacity-40")}>
                  <h3 className="font-display text-xl font-semibold tracking-tight text-fg">{step.title}</h3>
                  <p className="mt-2 max-w-[46ch] text-base text-fg-muted">{step.desc}</p>
                </div>
                <div className="mt-6 lg:hidden">{scenes[index]}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
