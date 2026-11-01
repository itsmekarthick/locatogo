"use client";

import { useEffect, useState, useTransition, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ResumeOnboarding, type ParsedResume } from "@/components/resume-onboarding";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertCircleIcon, CheckIcon, MapPinIcon, RefreshIcon, UploadIcon } from "@/components/ui/icons";
import type { MatchesData } from "@/lib/matching/load-matches";
import { cn } from "@/lib/utils/cn";
import { useDashboardView } from "../dashboard-shell";
import { ConfirmProfile, LEVEL_LABEL } from "./confirm-profile";
import { MatchList } from "./match-list";
import { MatchScan } from "./match-scan";
import "./matches.css";

type Mode = "results" | "upload" | "confirm" | "scan";

const STEPS = [
  { id: "upload", label: "Resume" },
  { id: "confirm", label: "Review" },
  { id: "scan", label: "Match" },
  { id: "results", label: "Results" },
] as const;

function Stepper({ mode }: { mode: Mode }) {
  const current = STEPS.findIndex((step) => step.id === mode);
  return (
    <ol className="mb-5 flex items-center gap-2 sm:gap-3" aria-label="Steps">
      {STEPS.map((step, index) => (
        <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3" aria-current={index === current ? "step" : undefined}>
          <span
            aria-hidden="true"
            className={cn(
              "grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-medium transition-colors",
              index < current ? "border-transparent bg-success-soft text-success" : index === current ? "border-accent bg-accent-soft text-accent-text" : "border-line-strong text-fg-subtle",
            )}
          >
            {index < current ? <CheckIcon className="size-3.5" /> : index + 1}
          </span>
          <span className={cn("hidden text-sm sm:inline", index === current ? "font-medium text-fg" : "text-fg-subtle")}>{step.label}</span>
          {index < STEPS.length - 1 && (
            <span aria-hidden="true" className="h-px min-w-3 flex-1 overflow-hidden bg-line-strong">
              <span className="block h-full origin-left bg-accent transition-transform duration-500 ease-out" style={{ transform: `scaleX(${index < current ? 1 : 0})` }} />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function ago(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

export function MatchesExperience({ data, defaultLocation }: { data: MatchesData; defaultLocation: string | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const { view } = useDashboardView();
  const [rawMode, setRawMode] = useState<Mode>(data.status === "empty" ? "upload" : "results");
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [autoStarted, setAutoStarted] = useState(false);
  const [seenStep, setSeenStep] = useState<string | null>(null);
  const [dir, setDir] = useState(1);

  // The scan stays on screen until the refreshed matches have arrived, so results never flash old data.
  const mode: Mode = rawMode === "scan" && finishing && !refreshing ? "results" : rawMode;
  const setMode = (next: Mode) => {
    if (next === "scan") setFinishing(false);
    setDir(STEPS.findIndex((item) => item.id === next) >= STEPS.findIndex((item) => item.id === mode) ? 1 : -1);
    setRawMode(next);
  };

  const step = params.get("step");
  if (step !== seenStep) {
    setSeenStep(step);
    if (step === "upload") setMode("upload");
  }
  useEffect(() => {
    if (step !== "upload") return;
    const query = new URLSearchParams(window.location.search);
    query.delete("step");
    window.history.replaceState(null, "", `?${query.toString()}`);
  }, [step]);

  // A stale or missing run starts when the Matches view is opened, not when the dashboard loads.
  const needsRun = data.status === "ok" && data.needsRun;
  if (view === "matches" && needsRun && mode === "results" && !autoStarted) {
    setAutoStarted(true);
    setMode("scan");
  }
  const finishScan = () => {
    setFinishing(true);
    startRefresh(() => router.refresh());
  };

  // Bring the wizard fully into view when a step opens, so it is never half cut off below the hero.
  useEffect(() => {
    if (view !== "matches" || mode === "results") return;
    const panel = document.getElementById("dash-panel-matches");
    if (!panel) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = requestAnimationFrame(() => panel.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" }));
    return () => cancelAnimationFrame(frame);
  }, [mode, view]);

  if (data.status === "error") {
    return (
      <div className="rounded-2xl border border-line bg-surface-1">
        <EmptyState
          icon={<AlertCircleIcon />}
          title="Matches can't load right now"
          description="Something went wrong reading your profile or saved matches. Try again in a moment."
          action={
            <Button variant="secondary" onClick={() => router.refresh()}>
              Reload
            </Button>
          }
        />
      </div>
    );
  }

  if (mode === "upload" || mode === "confirm") {
    return (
      <div className="mx-auto max-w-2xl">
        <Stepper mode={mode} />
        <div key={mode} className="step-in" style={{ "--dir": dir } as CSSProperties}>
          {mode === "upload" ? (
            <>
              <ResumeOnboarding
                hasResume={data.status === "ok"}
                defaultLocation={data.status === "ok" ? (data.loaded.profile.location ?? defaultLocation ?? "Bangalore") : (defaultLocation ?? "Bangalore")}
                onParsed={(result) => {
                  setParsed(result);
                  setMode("confirm");
                }}
              />
              {data.status === "ok" && (
                <div className="mt-3">
                  <Button variant="ghost" size="sm" onClick={() => setMode("results")}>
                    Back to matches
                  </Button>
                </div>
              )}
            </>
          ) : (
            parsed && (
              <div className="rounded-2xl border border-line bg-surface-1 p-5 elev-sm sm:p-6">
                <ConfirmProfile initial={parsed} onSaved={() => setMode("scan")} onBack={() => setMode("upload")} />
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  if (mode === "scan") {
    return <MatchScan onFinished={finishScan} onExit={() => setMode("results")} />;
  }

  if (data.status === "empty") {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong bg-surface-1">
        <EmptyState
          icon={<UploadIcon />}
          title="Upload your resume to see matches"
          description="We read the skills, level and experience on your resume, then rank live openings in your preferred hub."
          action={<Button onClick={() => setMode("upload")}>Upload resume</Button>}
        />
      </div>
    );
  }

  const { loaded, items, lastRun, skillCounts } = data;
  const { profile } = loaded;

  return (
    <div className="step-in" style={{ "--dir": dir } as CSSProperties}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold tracking-tight">Roles that fit your resume</h2>
          <p className="mt-1 text-sm text-fg-muted">
            {lastRun ? (
              <>
                {items.length} ranked in {lastRun.scope}. Read {lastRun.rolesRead.toLocaleString("en-US")} open roles,{" "}
                <time dateTime={lastRun.completedAt} suppressHydrationWarning>
                  updated {ago(lastRun.completedAt)}
                </time>
                .
              </>
            ) : (
              "Open roles ranked against your skills, level and location."
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" leadingIcon={<RefreshIcon className="size-4" />} onClick={() => setMode("scan")}>
            Refresh matches
          </Button>
          <Button variant="ghost" size="sm" leadingIcon={<UploadIcon className="size-4" />} onClick={() => setMode("upload")}>
            Update resume
          </Button>
        </div>
      </div>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
          <MatchList items={items} />
        </div>

        <aside className="min-w-0 lg:sticky lg:top-6">
          <section aria-labelledby="profile-used" className="rounded-2xl border border-line bg-surface-1 p-5 elev-sm">
            <h3 id="profile-used" className="text-sm font-medium text-fg-muted">
              Profile used
            </h3>
            {profile.headline && <p className="mt-2 text-base font-medium leading-snug">{profile.headline}</p>}

            <ul role="list" className="mt-3 flex flex-wrap gap-2">
              {profile.level && (
                <li>
                  <Badge variant="accent">{LEVEL_LABEL[profile.level]}</Badge>
                </li>
              )}
              {profile.yearsExperience != null && (
                <li>
                  <Badge>
                    {profile.yearsExperience} {profile.yearsExperience === 1 ? "year" : "years"}
                  </Badge>
                </li>
              )}
              {profile.location && (
                <li>
                  <Badge icon={<MapPinIcon className="size-3.5" />}>{profile.location}</Badge>
                </li>
              )}
            </ul>

            <p className="mt-5 text-sm font-medium text-fg-muted">Skills</p>
            <ul role="list" className="mt-2 flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => {
                const count = skillCounts[skill] ?? 0;
                return (
                  <li key={skill}>
                    <Badge variant={count > 0 ? "accent" : "neutral"} size="sm">
                      {skill}
                      {count > 0 && <span className="tabular-nums opacity-70">{count}</span>}
                    </Badge>
                  </li>
                );
              })}
            </ul>
            {items.length > 0 && <p className="mt-2 text-xs text-fg-subtle">Counts show how many of your matches name that skill.</p>}
          </section>

          <p className="mt-4 px-1 text-xs leading-5 text-fg-subtle">
            Scores weigh the job title, team, level and location. Job descriptions are not available yet, so a title that does not name your skills can still be a strong fit.
            {lastRun?.notesSource === "ai" ? " Fit notes for your top 10 are written by AI from those same details." : ""}
          </p>
        </aside>
      </div>
    </div>
  );
}
