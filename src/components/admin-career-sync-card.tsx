"use client";

import { useState, useTransition } from "react";
import { syncCompanyCareers } from "@/app/admin/actions";

export type AdminCareerSyncCardProps = {
  listingId: string;
  initialProvider?: string | null;
  initialCareersUrl?: string | null;
  activeJobsCount?: number;
};

export function AdminCareerSyncCard({
  listingId,
  initialProvider = "greenhouse",
  initialCareersUrl = "",
  activeJobsCount = 0,
}: AdminCareerSyncCardProps) {
  const [provider, setProvider] = useState<"greenhouse" | "lever" | "ashby" | "custom" | "workday" | "smartrecruiters">(
    (initialProvider as any) || "greenhouse"
  );
  const [boardToken, setBoardToken] = useState<string>(initialCareersUrl || "");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [jobsCount, setJobsCount] = useState<number>(activeJobsCount);

  // Quick preset tokens for popular companies
  const tokenPresets = [
    { label: "Swiggy", provider: "greenhouse", token: "swiggy" },
    { label: "Razorpay", provider: "greenhouse", token: "razorpay" },
    { label: "Postman", provider: "lever", token: "postman" },
    { label: "OpenAI", provider: "ashby", token: "openai" },
    { label: "Linear", provider: "ashby", token: "linear" },
    { label: "Stripe", provider: "greenhouse", token: "stripe" },
    { label: "Figma", provider: "greenhouse", token: "figma" },
  ];

  function handleSync() {
    if (!boardToken.trim()) {
      setFeedback({ type: "error", message: "Please enter a valid ATS company handle or board URL" });
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await syncCompanyCareers({
          listingId,
          provider,
          boardToken,
        });

        if (!res.success) {
          throw new Error(res.error || "Failed to sync jobs");
        }

        setJobsCount(res.count);
        setFeedback({
          type: "success",
          message: `Successfully synchronized ${res.count} live job openings from ${provider}!`,
        });
      } catch (err) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Error syncing ATS careers",
        });
      }
    });
  }

  return (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400 text-2xl">
            ⚡
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Live Careers & ATS Sync
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pull live open roles directly from the company&apos;s public ATS portal into your Tech Atlas.
            </p>
          </div>
        </div>

        <div className="rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          💼 {jobsCount} Active Roles
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Preset Handles */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Quick Demo Tokens
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tokenPresets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setProvider(p.provider as any);
                setBoardToken(p.token);
              }}
              className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950/50 transition-all cursor-pointer"
            >
              {p.label} ({p.provider})
            </button>
          ))}
        </div>
      </div>

      {/* Provider Selector & Token Input */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            ATS Platform
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as any)}
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="greenhouse">Greenhouse.io</option>
            <option value="lever">Lever.co</option>
            <option value="ashby">AshbyHQ</option>
            <option value="custom">Custom URL / Workday</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            ATS Board Handle or Portal URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={boardToken}
              onChange={(e) => setBoardToken(e.target.value)}
              placeholder="e.g. swiggy, razorpay, postman, or linear"
              className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={handleSync}
              className="rounded-2xl bg-cyan-600 hover:bg-cyan-500 px-5 py-2 text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <span>⚡ Sync Live Careers</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
