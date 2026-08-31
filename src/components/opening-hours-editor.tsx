"use client";

import { useState, useTransition } from "react";

type HourEntry = {
  day_of_week: number;
  is_closed: boolean;
  is_24_hours: boolean;
  open_time: string;
  close_time: string;
};

type Props = {
  listingId: string;
  initialHours: HourEntry[];
  saveAction: (formData: FormData) => Promise<void>;
};

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayAbbrev = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDefaultHours(): HourEntry[] {
  return daysOfWeek.map((_, i) => ({
    day_of_week: i,
    is_closed: i === 0, // Sunday closed by default
    is_24_hours: false,
    open_time: "09:00",
    close_time: "18:00",
  }));
}

export function OpeningHoursEditor({ listingId, initialHours, saveAction }: Props) {
  const [hours, setHours] = useState<HourEntry[]>(() => {
    const defaults = getDefaultHours();
    // Merge initial hours into defaults
    for (const h of initialHours) {
      const idx = defaults.findIndex((d) => d.day_of_week === h.day_of_week);
      if (idx >= 0) defaults[idx] = { ...h };
    }
    return defaults;
  });

  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function updateDay(dayIndex: number, updates: Partial<HourEntry>) {
    setHours((prev) =>
      prev.map((h) => (h.day_of_week === dayIndex ? { ...h, ...updates } : h))
    );
  }

  function handleSaveAll() {
    setSaved(false);
    startTransition(async () => {
      // Save each day sequentially
      for (const h of hours) {
        const fd = new FormData();
        fd.set("listingId", listingId);
        fd.set("dayOfWeek", String(h.day_of_week));
        fd.set("openTime", h.open_time);
        fd.set("closeTime", h.close_time);
        if (h.is_closed) fd.set("isClosed", "on");
        if (h.is_24_hours) fd.set("is24Hours", "on");
        await saveAction(fd);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  function setAllOpen() {
    setHours((prev) =>
      prev.map((h) => ({ ...h, is_closed: false, is_24_hours: false, open_time: "09:00", close_time: "18:00" }))
    );
  }

  function setWeekdayOnly() {
    setHours((prev) =>
      prev.map((h) => ({
        ...h,
        is_closed: h.day_of_week === 0 || h.day_of_week === 6,
        is_24_hours: false,
        open_time: "09:00",
        close_time: "18:00",
      }))
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Operating Hours</h2>
          <p className="text-[11px] text-[var(--ink-muted)]">Set opening hours for each day</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={setAllOpen}
            className="rounded-lg bg-[var(--background)] px-2.5 py-1 text-[10px] font-semibold text-[var(--foreground)] hover:bg-[var(--line)] transition-colors"
          >
            All Open
          </button>
          <button
            type="button"
            onClick={setWeekdayOnly}
            className="rounded-lg bg-[var(--background)] px-2.5 py-1 text-[10px] font-semibold text-[var(--foreground)] hover:bg-[var(--line)] transition-colors"
          >
            Weekdays Only
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {hours
          .sort((a, b) => {
            // Show Monday first
            const order = [1, 2, 3, 4, 5, 6, 0];
            return order.indexOf(a.day_of_week) - order.indexOf(b.day_of_week);
          })
          .map((h) => (
            <div
              key={h.day_of_week}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                h.is_closed ? "bg-red-50/50" : "bg-[var(--background)]"
              }`}
            >
              {/* Day label */}
              <span className="w-10 text-xs font-bold text-[var(--foreground)]">
                {dayAbbrev[h.day_of_week]}
              </span>

              {/* Toggle closed */}
              <button
                type="button"
                onClick={() => updateDay(h.day_of_week, { is_closed: !h.is_closed, is_24_hours: false })}
                className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ${
                  h.is_closed ? "bg-red-300" : "bg-emerald-400"
                }`}
                title={h.is_closed ? "Mark as open" : "Mark as closed"}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    h.is_closed ? "translate-x-0" : "translate-x-[18px]"
                  }`}
                />
              </button>

              {h.is_closed ? (
                <span className="flex-1 text-xs font-medium text-red-600">Closed</span>
              ) : (
                <>
                  {/* 24h toggle */}
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={h.is_24_hours}
                      onChange={(e) => updateDay(h.day_of_week, { is_24_hours: e.target.checked })}
                      className="rounded text-xs"
                    />
                    <span className="text-[10px] font-medium text-[var(--ink-muted)]">24h</span>
                  </label>

                  {!h.is_24_hours && (
                    <>
                      <input
                        type="time"
                        value={h.open_time}
                        onChange={(e) => updateDay(h.day_of_week, { open_time: e.target.value })}
                        className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2 py-1 text-xs font-mono focus:outline-none"
                      />
                      <span className="text-[10px] text-[var(--ink-muted)]">–</span>
                      <input
                        type="time"
                        value={h.close_time}
                        onChange={(e) => updateDay(h.day_of_week, { close_time: e.target.value })}
                        className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2 py-1 text-xs font-mono focus:outline-none"
                      />
                    </>
                  )}

                  {h.is_24_hours && (
                    <span className="flex-1 text-xs font-medium text-emerald-600">Open 24 hours</span>
                  )}
                </>
              )}
            </div>
          ))}
      </div>

      {/* Save all */}
      <div className="mt-4 flex items-center justify-between">
        {saved && (
          <span className="text-xs font-semibold text-emerald-600">✅ Hours saved!</span>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isPending}
          className="rounded-full bg-[var(--foreground)] px-5 py-2 text-xs font-semibold text-[var(--paper)] hover:bg-[var(--foreground)]/90 transition-all disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save All Hours"}
        </button>
      </div>
    </div>
  );
}
