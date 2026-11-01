"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, CheckIcon, MapPinIcon, PauseIcon, PlayIcon, SkipForwardIcon } from "@/components/ui/icons";
import type { MatchPin, MatchRunEvent, MatchTopPreview, NoteSample, NotesSource } from "@/lib/matching/types";
import { cn } from "@/lib/utils/cn";
import { AtlasMap } from "./atlas-map";
import { format, Gauge, LiveNumber, notesDuration, NotesPanel, RankRows, RoleTicker, RunLog, SkillBars, SourceBadge, useLogoWarmup, type LogLine, type TickerItem } from "./scan-parts";
import "./matches.css";

// Minimum time each stage stays on screen (milliseconds on the scan's own clock, which stops while paused).
// The server finishes in about three seconds; these holds are what make the numbers readable.
const HOLD = { read: 2200, shortlist: 2800, rank: 2800, explain: 2400, reveal: 2200 } as const;
const INTRO_MS = 600;
const READ_GAP_MS = 300;
const TICK_MS = 50;

const STAGES = [
  { name: "Read", title: "Reading open roles" },
  { name: "Shortlist", title: "Shortlisting what fits" },
  { name: "Rank", title: "Ranking by fit" },
  { name: "Explain", title: "Writing fit notes" },
] as const;

type Scene = {
  stage: number;
  scope: string | null;
  skills: string[];
  read: { inScope: number; read: number; cap: number } | null;
  ticker: TickerItem[];
  shortlist: { count: number; skillHits: { skill: string; count: number }[] } | null;
  pins: MatchPin[];
  top: MatchTopPreview[] | null;
  notes: { source: NotesSource; samples: NoteSample[] } | null;
  ranked: number | null;
};

const emptyScene: Scene = { stage: 0, scope: null, skills: [], read: null, ticker: [], shortlist: null, pins: [], top: null, notes: null, ranked: null };

function StageRail({ stage }: { stage: number }) {
  return (
    <ol className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3" aria-label="Matching stages">
      {STAGES.map((item, index) => {
        const done = stage > index;
        const active = stage === index;
        return (
          <li key={item.name} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-medium transition-colors",
                  done ? "border-transparent bg-success-soft text-success" : active ? "border-accent bg-accent-soft text-accent-text" : "border-line-strong text-fg-subtle",
                )}
              >
                {done ? <CheckIcon className="size-3.5" /> : index + 1}
              </span>
              <span className={cn("hidden truncate text-sm md:inline", active ? "font-medium text-fg" : done ? "text-fg-muted" : "text-fg-subtle")}>{item.name}</span>
            </span>
            {index < STAGES.length - 1 && (
              <span aria-hidden="true" className="relative h-px min-w-3 flex-1 overflow-hidden bg-line-strong">
                <span className="block h-full origin-left bg-accent transition-transform duration-500 ease-out" style={{ transform: `scaleX(${done ? 1 : 0})` }} />
                {active && <span className="rail-scan absolute inset-y-0 left-0 w-1/2 bg-accent/60" />}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Counter({ label, value, show }: { label: string; value: number; show: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface-1/85 px-3 py-2 backdrop-blur-sm">
      <p className="text-[11px] leading-4 text-fg-subtle">{label}</p>
      <p className="font-display text-lg font-semibold leading-6">{show ? <LiveNumber value={value} duration={700} /> : <span className="text-fg-subtle">-</span>}</p>
    </div>
  );
}

function Story({ scene, noteIndex, activeId, setActiveId, setNoteIndex }: { scene: Scene; noteIndex: number | null; activeId: string | null; setActiveId: (id: string | null) => void; setNoteIndex: (index: number | null) => void }) {
  const { stage, read, shortlist, top, notes, scope } = scene;
  const readTarget = read ? Math.min(read.inScope, read.cap) : 0;

  if (stage === 0) {
    return (
      <>
        <p className="scan-rise mt-4 font-display text-5xl font-semibold leading-none tracking-tight sm:text-6xl">
          <LiveNumber value={read?.read ?? 0} />
        </p>
        <p className="mt-2 text-sm text-fg-subtle">{read ? `of ${format(readTarget)} roles` : "Counting roles"}</p>
        <p className="mt-4 max-w-md text-sm leading-6 text-fg-muted">
          {read
            ? read.inScope > read.cap
              ? `${format(read.inScope)} roles are open in ${scope}. We read the newest ${format(read.cap)} and check each one against your profile.`
              : `Pulling every open role in ${scope} so each one can be checked against your profile.`
            : `Counting open roles in ${scope ?? "your hub"}.`}
        </p>
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-fg-subtle">Roles coming in now</p>
          <RoleTicker items={scene.ticker} />
        </div>
      </>
    );
  }

  if (stage === 1) {
    const ratio = shortlist && read ? shortlist.count / Math.max(1, read.read) : 0;
    return (
      <>
        <div className="mt-4 flex items-center gap-5">
          <Gauge ratio={ratio} size={112}>
            <span className="font-display text-2xl font-semibold leading-none">
              <LiveNumber value={shortlist?.count ?? 0} />
            </span>
          </Gauge>
          <p className="min-w-0 text-sm leading-6 text-fg-muted">
            <span className="font-medium text-fg">{format(shortlist?.count ?? 0)}</span> of {format(read?.read ?? 0)} roles share a skill or a kind of work with you. The rest were dropped.
          </p>
        </div>
        <p className="mb-3 mt-6 text-xs font-medium text-fg-subtle">Your skills in role titles</p>
        <SkillBars hits={shortlist?.skillHits ?? []} />
      </>
    );
  }

  if (stage === 2) {
    return (
      <>
        <p className="scan-short-hide mt-2 max-w-md text-sm leading-6 text-fg-muted">Every shortlisted role gets a score out of 100. Hover a role to find it on the map.</p>
        <div className="mt-4">{top && <RankRows top={top} activeId={activeId} onActive={setActiveId} />}</div>
      </>
    );
  }

  if (stage === 3) {
    return (
      <>
        <div className="scan-short-hide mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {notes && <SourceBadge source={notes.source} />}
          <p className="text-xs text-fg-muted">{notes?.source === "ai" ? "Short reasons for your top roles, from their title, team, level and place." : "AI notes were unavailable, so these come from how your profile lines up."}</p>
        </div>
        <div className="mt-3">{notes && <NotesPanel samples={notes.samples} onFocusIndex={setNoteIndex} />}</div>
        <span className="sr-only" aria-live="off">
          {noteIndex}
        </span>
      </>
    );
  }

  const best = top?.[0];
  return (
    <>
      {best && (
        <div className="scan-rise mt-4 flex items-center gap-5 rounded-2xl border border-accent/40 bg-accent-soft/50 p-4">
          <Gauge ratio={best.score / 100} size={104}>
            <span className="font-display text-3xl font-semibold leading-none">
              <LiveNumber value={best.score} duration={800} />
            </span>
          </Gauge>
          <div className="min-w-0">
            <Badge variant="accent" size="sm">
              Best match
            </Badge>
            <div className="mt-2 flex items-start gap-2.5">
              <CompanyBrandAvatar title={best.company} website={best.website} size={36} />
              <div className="min-w-0">
                <p className="break-words text-base font-medium leading-snug">{best.title}</p>
                <p className="mt-0.5 text-sm text-fg-muted">{best.company}</p>
              </div>
            </div>
            {best.location && (
              <p className="mt-1 flex items-center gap-1 text-xs text-fg-subtle">
                <MapPinIcon className="size-3.5" />
                {best.location}
              </p>
            )}
          </div>
        </div>
      )}
      <p className="mt-4 text-sm text-fg-muted">{scene.ranked != null ? `${format(scene.ranked)} matches are saved. Opening them now.` : "Opening your matches."}</p>
      <span aria-hidden="true" className="relative mt-3 block h-px overflow-hidden bg-line-strong">
        <span className="rail-scan absolute inset-y-0 left-0 w-1/3 bg-accent" />
      </span>
    </>
  );
}

type MatchScanProps = {
  /** Called once the final stage has been shown; the parent should reload its data. */
  onFinished: () => void;
  /** Leaves the scan after a failure. */
  onExit: () => void;
};

export function MatchScan({ onFinished, onExit }: MatchScanProps) {
  const [scene, setScene] = useState<Scene>(emptyScene);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [noteIndex, setNoteIndex] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const queue = useRef<MatchRunEvent[]>([]);
  const wake = useRef<(() => void) | null>(null);
  const closed = useRef(false);
  const alive = useRef(false);
  const skip = useRef(false);
  const pausedRef = useRef(false);
  const clock = useRef(0);
  const stageStart = useRef(0);
  const waiters = useRef<{ at: number; resolve: () => void }[]>([]);
  const tickerId = useRef(0);
  const started = useRef(false);
  const finishedRef = useRef(onFinished);

  const logoRequests = useMemo(
    () => (scene.top ?? []).flatMap((item) => (item.listingId ? [{ key: item.listingId, title: item.company, website: item.website }] : [])),
    [scene.top],
  );
  const logos = useLogoWarmup(logoRequests);

  useEffect(() => {
    finishedRef.current = onFinished;
  }, [onFinished]);

  const flush = useCallback(() => {
    waiters.current = waiters.current.filter((waiter) => {
      if (skip.current || clock.current >= waiter.at) {
        waiter.resolve();
        return false;
      }
      return true;
    });
  }, []);

  // The scan keeps its own clock so pausing really stops the stage holds.
  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) clock.current += TICK_MS;
      flush();
    }, TICK_MS);
    return () => clearInterval(id);
  }, [flush]);

  const sleepUntil = useCallback(
    (at: number) =>
      new Promise<void>((resolve) => {
        if (skip.current || clock.current >= at) return resolve();
        waiters.current.push({ at, resolve });
      }),
    [],
  );
  const sleep = useCallback((ms: number) => sleepUntil(clock.current + ms), [sleepUntil]);
  const hold = useCallback((minimum: number) => sleepUntil(stageStart.current + minimum), [sleepUntil]);

  const enter = useCallback((stage: number) => {
    stageStart.current = clock.current;
    setScene((current) => ({ ...current, stage }));
  }, []);

  const play = useCallback(async () => {
    for (;;) {
      while (queue.current.length === 0) {
        if (closed.current) return;
        await new Promise<void>((resolve) => {
          wake.current = resolve;
        });
      }
      if (!alive.current) return;
      const event = queue.current.shift()!;

      if (event.type === "start") {
        setScene({ ...emptyScene, scope: event.scope, skills: event.skills });
        stageStart.current = clock.current;
        await sleep(INTRO_MS);
      } else if (event.type === "read") {
        setScene((current) => ({ ...current, read: { inScope: event.inScope, read: event.read, cap: event.cap } }));
        for (const sample of event.sample) {
          const item: TickerItem = { ...sample, id: (tickerId.current += 1) };
          setScene((current) => ({ ...current, ticker: [...current.ticker.slice(-11), item] }));
          await sleep(READ_GAP_MS / Math.max(1, event.sample.length));
        }
        if (event.sample.length === 0) await sleep(READ_GAP_MS);
      } else if (event.type === "shortlist") {
        await hold(HOLD.read);
        setScene((current) => ({ ...current, shortlist: { count: event.count, skillHits: event.skillHits } }));
        enter(1);
      } else if (event.type === "pins") {
        setScene((current) => ({ ...current, pins: event.pins }));
      } else if (event.type === "rank") {
        await hold(HOLD.shortlist);
        setScene((current) => ({ ...current, top: event.top }));
        enter(2);
      } else if (event.type === "notes") {
        await hold(HOLD.rank);
        setScene((current) => ({ ...current, notes: { source: event.source, samples: event.samples } }));
        setNoteIndex(null);
        enter(3);
      } else if (event.type === "done") {
        const typing = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : notesDuration(sceneRef.current.notes?.samples ?? []) + 900;
        await hold(Math.max(HOLD.explain, typing));
        setScene((current) => ({ ...current, ranked: event.ranked }));
        enter(4);
        try {
          navigator.vibrate?.(12);
        } catch {
          // Haptics are optional.
        }
        await hold(HOLD.reveal);
        if (alive.current) finishedRef.current();
        return;
      }
    }
  }, [enter, hold, sleep]);

  const sceneRef = useRef(scene);
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  const run = useCallback(async () => {
    queue.current = [];
    closed.current = false;
    skip.current = false;
    pausedRef.current = false;
    setPaused(false);
    setError(null);
    setScene(emptyScene);
    setHoverId(null);
    setActiveId(null);
    setNoteIndex(null);

    const push = (event: MatchRunEvent) => {
      queue.current.push(event);
      wake.current?.();
    };
    const fail = (message: string) => {
      queue.current = [];
      closed.current = true;
      skip.current = true;
      flush();
      wake.current?.();
      setError(message);
    };

    const player = play();
    try {
      const response = await fetch("/api/matches/run", { method: "POST" });
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        return fail(data?.error || "Could not start matching. Try again in a moment.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const outcome = { sawDone: false, failure: null as string | null };

      const handle = (line: string) => {
        if (!line.trim()) return;
        let event: MatchRunEvent;
        try {
          event = JSON.parse(line) as MatchRunEvent;
        } catch {
          return;
        }
        if (event.type === "error") outcome.failure = event.message;
        else {
          if (event.type === "done") outcome.sawDone = true;
          push(event);
        }
      };

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        lines.forEach(handle);
        if (outcome.failure) break;
      }
      handle(buffer);

      if (outcome.failure) return fail(outcome.failure);
      if (!outcome.sawDone) return fail("The connection closed before matching finished. Try again.");
      closed.current = true;
      wake.current?.();
    } catch {
      fail("Could not reach the server. Check your connection and try again.");
    }
    await player;
  }, [play, flush]);

  useEffect(() => {
    alive.current = true;
    if (!started.current) {
      started.current = true;
      void run();
    }
    return () => {
      alive.current = false;
      wake.current?.();
    };
  }, [run]);

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  };

  const skipAhead = () => {
    skip.current = true;
    pausedRef.current = false;
    setPaused(false);
    flush();
  };

  if (error) {
    return (
      <section className="rounded-2xl border border-line bg-surface-1 p-6 elev-sm sm:p-8">
        <p role="alert" className="flex items-start gap-2 text-sm text-danger">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => void run()}>Try again</Button>
          <Button variant="ghost" onClick={onExit}>
            Back to matches
          </Button>
        </div>
      </section>
    );
  }

  const { stage } = scene;
  const hub = scene.scope ?? "your hub";
  const readTarget = scene.read ? Math.min(scene.read.inScope, scene.read.cap) : 0;
  const readDone = Boolean(scene.read) && scene.read!.read >= readTarget;
  const title = stage > 3 ? "Best match" : STAGES[stage].title;
  const stageName = stage > 3 ? "Matching finished" : `${STAGES[stage].name}, step ${stage + 1} of ${STAGES.length}`;

  const highlightId = hoverId ?? activeId ?? (stage === 3 && noteIndex != null ? (scene.top?.[noteIndex]?.listingId ?? null) : stage === 4 ? (scene.top?.[0]?.listingId ?? null) : null);

  const lines: LogLine[] = [
    { id: "read", label: "Read open roles", detail: scene.read ? `${format(scene.read.read)} of ${format(readTarget)} in ${hub}` : null, state: stage > 0 ? "done" : "active" },
    { id: "shortlist", label: "Shortlisted", detail: scene.shortlist && stage > 0 ? `${format(scene.shortlist.count)} relate to your profile` : null, state: stage > 1 ? "done" : stage === 1 ? "active" : "pending" },
    { id: "rank", label: "Ranked by fit", detail: scene.top && stage > 1 ? `best fit ${scene.top[0]?.score ?? 0} out of 100` : null, state: stage > 2 ? "done" : stage === 2 ? "active" : "pending" },
    { id: "explain", label: "Wrote fit notes", detail: scene.notes && stage > 2 ? (scene.notes.source === "ai" ? "by AI for your top roles" : "from your profile") : null, state: stage > 3 ? "done" : stage === 3 ? "active" : "pending" },
  ];

  return (
    <section aria-labelledby="scan-title" aria-busy={stage < 4} className={cn("animate-fade-up overflow-hidden rounded-2xl border border-line bg-surface-1 elev-sm", paused && "scan-paused")}>
      <p role="status" aria-live="polite" className="sr-only">
        {scene.scope ? stageName : "Starting"}
      </p>

      <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
        <StageRail stage={stage} />
        <div className="flex shrink-0 items-center gap-1">
          {stage < 4 && (
            <Button variant="ghost" size="sm" onClick={togglePause} aria-pressed={paused} leadingIcon={paused ? <PlayIcon className="size-4" /> : <PauseIcon className="size-4" />}>
              <span className="hidden sm:inline">{paused ? "Resume" : "Pause"}</span>
              <span className="sr-only sm:hidden">{paused ? "Resume" : "Pause"}</span>
            </Button>
          )}
          {stage < 4 && (
            <Button variant="ghost" size="sm" onClick={skipAhead} leadingIcon={<SkipForwardIcon className="size-4" />}>
              <span className="hidden sm:inline">Skip</span>
              <span className="sr-only sm:hidden">Skip to results</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:h-[clamp(22rem,calc(100dvh-10rem),44rem)] lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="order-2 flex min-w-0 flex-col p-5 sm:p-6 lg:order-1 lg:min-h-0 lg:overflow-y-auto lg:border-r lg:border-line">
          <div key={stage} className="scan-rise">
            <p className="text-xs font-medium text-accent-text">
              {stage > 3 ? "Done" : `Step ${stage + 1} of ${STAGES.length}`}
              {paused && <span className="ml-2 text-fg-subtle">Paused</span>}
            </p>
            <h1 id="scan-title" className="mt-1 font-display text-2xl font-semibold tracking-tight">
              {title}
            </h1>
            <Story scene={scene} noteIndex={noteIndex} activeId={activeId} setActiveId={setActiveId} setNoteIndex={setNoteIndex} />
          </div>
        </div>

        <div className="order-1 border-b border-line p-4 sm:p-6 lg:order-2 lg:flex lg:min-h-0 lg:items-center lg:justify-center lg:border-b-0">
          <div
            className="relative mx-auto aspect-square w-full max-w-[22rem] overflow-hidden rounded-2xl border border-line bg-surface-2 lg:mx-0 lg:h-full lg:max-h-[34rem] lg:w-auto lg:max-w-full"
            style={{ backgroundImage: "radial-gradient(60% 60% at 50% 45%, color-mix(in oklab, var(--accent) 12%, transparent), transparent)" } as CSSProperties}
          >
            <AtlasMap pins={scene.pins} top={stage >= 2 ? scene.top : null} stage={stage} hubLabel={hub} highlightId={highlightId} onHover={setHoverId} logos={logos} className="size-full" />
            <div className="pointer-events-none absolute left-3 top-3 flex gap-2">
              <Counter label="Roles read" value={scene.read?.read ?? 0} show={Boolean(scene.read)} />
              <Counter label="Shortlisted" value={scene.shortlist?.count ?? 0} show={Boolean(scene.shortlist) && stage > 0} />
            </div>
            <p className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg bg-surface-1/85 px-3 py-1.5 text-center text-xs text-fg-muted backdrop-blur-sm">
              {stage === 0
                ? `Scanning ${hub}`
                : scene.pins.length > 0
                  ? `${format(scene.pins.length)} ${scene.pins.length === 1 ? "company" : "companies"} with matching roles, placed by their listed address`
                  : "No listed addresses to place on the map for this search"}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-line px-4 py-3 sm:px-6">
        <RunLog lines={lines.map((line) => (line.id === "read" && stage === 0 && readDone ? { ...line, state: "active" as const } : line))} />
      </div>
    </section>
  );
}
