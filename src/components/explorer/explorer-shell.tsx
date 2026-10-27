"use client";

import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { MapIcon, ListIcon } from "@/components/ui/icons";
import { useLayoutMode } from "@/components/explorer/use-layout-mode";
import { cn } from "@/lib/utils/cn";

export type Snap = "peek" | "half" | "full";
export type Pane = "list" | "map";

const WIDTH_KEY = "locatogo_explorer_list_w";
const MIN_W = 340;
const MAX_W = 720;
const KEY_STEP = 24;
const SNAPS: Snap[] = ["peek", "half", "full"];

type ExplorerShellProps = {
  list: ReactNode;
  map: ReactNode;
  mapOverlay?: ReactNode;
  /** Card shown above the sheet on phones, such as the quick view for a tapped pin. */
  peek?: ReactNode;
  snap: Snap;
  onSnapChange: (snap: Snap) => void;
  pane: Pane;
  onPaneChange: (pane: Pane) => void;
  listOpen: boolean;
};

/**
 * Desktop: resizable list | map split. Tablet: list and map toggle. Phone: full-bleed map
 * with a bottom sheet that snaps between peek, half and full. Layout is CSS; JS only drives state.
 */
export function ExplorerShell({ list, map, mapOverlay, peek, snap, onSnapChange, pane, onPaneChange, listOpen }: ExplorerShellProps) {
  const layout = useLayoutMode();
  const shellRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const resize = useRef<{ startX: number; startW: number } | null>(null);
  const drag = useRef<{ startY: number; startOffset: number; lastY: number; lastT: number; velocity: number; moved: boolean } | null>(null);

  // Sheet math needs the shell height, which CSS reads through --shell-h.
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const observer = new ResizeObserver(([entry]) => {
      shell.style.setProperty("--shell-h", `${Math.round(entry.contentRect.height)}px`);
    });
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const saved = Number(localStorage.getItem(WIDTH_KEY));
    if (saved >= MIN_W && saved <= MAX_W) shellRef.current?.style.setProperty("--list-w", `${saved}px`);
  }, []);

  function setListWidth(next: number, persist: boolean) {
    const shell = shellRef.current;
    if (!shell) return;
    const width = Math.round(Math.min(Math.max(next, MIN_W), Math.min(MAX_W, shell.clientWidth * 0.6)));
    shell.style.setProperty("--list-w", `${width}px`);
    dividerRef.current?.setAttribute("aria-valuenow", String(width));
    if (persist) localStorage.setItem(WIDTH_KEY, String(width));
  }

  function onDividerDown(event: PointerEvent<HTMLDivElement>) {
    if (!listRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    resize.current = { startX: event.clientX, startW: listRef.current.offsetWidth };
    shellRef.current?.setAttribute("data-resizing", "true");
  }

  function onDividerMove(event: PointerEvent<HTMLDivElement>) {
    if (resize.current) setListWidth(resize.current.startW + event.clientX - resize.current.startX, false);
  }

  function onDividerUp() {
    if (resize.current && listRef.current) setListWidth(listRef.current.offsetWidth, true);
    resize.current = null;
    shellRef.current?.removeAttribute("data-resizing");
  }

  function onDividerKey(event: KeyboardEvent<HTMLDivElement>) {
    const current = listRef.current?.offsetWidth ?? MIN_W;
    if (event.key === "ArrowLeft") setListWidth(current - KEY_STEP, true);
    else if (event.key === "ArrowRight") setListWidth(current + KEY_STEP, true);
    else if (event.key === "Home") setListWidth(MIN_W, true);
    else if (event.key === "End") setListWidth(MAX_W, true);
    else return;
    event.preventDefault();
  }

  const offsets = () => {
    const height = listRef.current?.offsetHeight ?? 0;
    const peekPx = parseFloat(getComputedStyle(document.documentElement).fontSize) * 6.5;
    return { peek: height - peekPx, half: height * 0.5, full: 0 } satisfies Record<Snap, number>;
  };

  function onHandleDown(event: PointerEvent<HTMLDivElement>) {
    const sheet = listRef.current;
    if (!sheet || layout !== "mobile") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startY: event.clientY, startOffset: offsets()[snap], lastY: event.clientY, lastT: event.timeStamp, velocity: 0, moved: false };
    sheet.style.transition = "none";
  }

  function onHandleMove(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    const sheet = listRef.current;
    if (!state || !sheet) return;
    const bounds = offsets();
    const offset = Math.min(Math.max(state.startOffset + event.clientY - state.startY, 0), bounds.peek);
    const dt = Math.max(1, event.timeStamp - state.lastT);
    state.velocity = (event.clientY - state.lastY) / dt;
    state.lastY = event.clientY;
    state.lastT = event.timeStamp;
    if (Math.abs(event.clientY - state.startY) > 4) state.moved = true;
    sheet.style.transform = `translateY(${offset}px)`;
  }

  function onHandleUp(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    const sheet = listRef.current;
    drag.current = null;
    if (!state || !sheet) return;
    sheet.style.transition = "";

    if (!state.moved) {
      sheet.style.transform = "";
      onSnapChange(snap === "peek" ? "half" : snap === "half" ? "full" : "half");
      return;
    }

    const bounds = offsets();
    const current = Math.min(Math.max(state.startOffset + event.clientY - state.startY, 0), bounds.peek);
    const projected = current + state.velocity * 220;
    const next = SNAPS.reduce((best, candidate) =>
      Math.abs(projected - bounds[candidate]) < Math.abs(projected - bounds[best]) ? candidate : best,
    );
    sheet.style.transform = "";
    onSnapChange(next);
  }

  function onHandleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowUp") onSnapChange(snap === "peek" ? "half" : "full");
    else if (event.key === "ArrowDown") onSnapChange(snap === "full" ? "half" : "peek");
    else if (event.key === "Enter" || event.key === " ") onSnapChange(snap === "peek" ? "half" : snap === "half" ? "full" : "half");
    else return;
    event.preventDefault();
  }

  const showMapLabel = layout === "mobile" ? snap === "full" : pane === "list";

  return (
    <div ref={shellRef} className="group/shell relative flex h-full w-full overflow-hidden bg-surface-0 data-[resizing=true]:select-none">
      <section
        ref={listRef}
        data-snap={snap}
        aria-label="Companies"
        className={cn(
          "ex-sheet flex min-h-0 flex-col bg-surface-1",
          "max-md:absolute max-md:inset-x-0 max-md:bottom-0 max-md:z-20 max-md:rounded-t-3xl max-md:border max-md:border-b-0 max-md:border-line max-md:elev-lg",
          "md:max-lg:absolute md:max-lg:inset-0 md:max-lg:z-10",
          "lg:relative lg:w-[var(--list-w,26.25rem)] lg:shrink-0",
          pane === "map" && "md:max-lg:hidden",
          !listOpen && "lg:hidden",
        )}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label="Resize list. Use arrow keys to change height."
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
          onKeyDown={onHandleKey}
          className="focus-ring flex h-7 shrink-0 cursor-grab touch-none select-none items-center justify-center md:hidden"
        >
          <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-line-strong" />
        </div>
        {list}
      </section>

      {listOpen && (
        <div
          ref={dividerRef}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize list"
          aria-valuemin={MIN_W}
          aria-valuemax={MAX_W}
          aria-valuenow={420}
          tabIndex={0}
          onPointerDown={onDividerDown}
          onPointerMove={onDividerMove}
          onPointerUp={onDividerUp}
          onPointerCancel={onDividerUp}
          onKeyDown={onDividerKey}
          className="group/divider focus-ring relative z-30 hidden w-0 shrink-0 cursor-col-resize touch-none lg:block"
        >
          <span aria-hidden="true" className="absolute inset-y-0 -left-2 w-4" />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-12 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-line-strong opacity-0 transition-opacity duration-200 group-hover/divider:opacity-100 group-focus-visible/divider:opacity-100 group-data-[resizing=true]/shell:opacity-100"
          />
        </div>
      )}

      <div className="max-lg:absolute max-lg:inset-0 lg:relative lg:h-full lg:min-w-0 lg:flex-1">
        {map}
        {mapOverlay}
      </div>

      <div
        data-snap={snap}
        className="ex-pill pointer-events-none absolute inset-x-3 bottom-3 z-30 flex flex-col items-center gap-2 lg:hidden"
      >
        {peek && <div className="pointer-events-auto w-full max-w-md">{peek}</div>}
        <button
          type="button"
          onClick={() => {
            if (layout === "mobile") onSnapChange(snap === "full" ? "peek" : "full");
            else onPaneChange(pane === "list" ? "map" : "list");
          }}
          className="glass elev-lg focus-ring pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-fg transition-ui active:scale-[0.97]"
        >
          {showMapLabel ? <MapIcon className="size-4" /> : <ListIcon className="size-4" />}
          {showMapLabel ? "Map" : "List"}
        </button>
      </div>
    </div>
  );
}
