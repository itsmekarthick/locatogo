"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const PARTITIONS = [
  { label: "Part 1 (10,000)", file: "/datasets/bangalore_it_companies_part1_10k.csv" },
  { label: "Part 2 (10,000)", file: "/datasets/bangalore_it_companies_part2_10k.csv" },
  { label: "Part 3 (10,000)", file: "/datasets/bangalore_it_companies_part3_10k.csv" },
  { label: "Part 4 (10,000)", file: "/datasets/bangalore_it_companies_part4_10k.csv" },
  { label: "Part 5 (10,000)", file: "/datasets/bangalore_it_companies_part5_10k.csv" },
  { label: "Part 6 (10,000)", file: "/datasets/bangalore_it_companies_part6_10k.csv" },
  { label: "Part 7 (7,000)", file: "/datasets/bangalore_it_companies_part7_7k.csv" },
];

export function AdminTechAtlasSeederButton() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const router = useRouter();

  function handleSeed() {
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/seed-tech-atlas", {
          method: "POST",
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load companies");
        }

        setFeedback({
          type: "success",
          message: `🎉 ${data.message}`,
        });
        router.refresh();
      } catch (err) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Error loading tech companies dataset",
        });
      }
    });
  }

  return (
    <div className="rounded-3xl border border-cyan-200/80 dark:border-cyan-900/60 bg-gradient-to-r from-cyan-50/90 via-sky-50/70 to-white dark:from-cyan-950/40 dark:via-slate-900 dark:to-slate-900 p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-600 text-white font-bold text-2xl shadow-md">
            🚀
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Bangalore 67,000 IT Companies Dataset Hub
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Partitioned into 10k-record batches with exact Bangalore pincode coordinates, sectors, stages, and tech stacks.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={handleSeed}
          className="rounded-full bg-cyan-600 hover:bg-cyan-500 px-5 py-2 text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
        >
          {isPending ? (
            <>
              <span className="animate-spin text-sm">⏳</span>
              <span>Ingesting Top 32 Employers...</span>
            </>
          ) : (
            <>
              <span>⚡ Load Top 32 Tech Giants</span>
            </>
          )}
        </button>
      </div>

      {/* 10K Batch Download Strip */}
      <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 p-4 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          📥 Download 67,000 Companies in 10k Batches (Ready for CSV Importer):
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {PARTITIONS.map((part, idx) => (
            <a
              key={idx}
              href={part.file}
              download={part.file.split("/").pop()}
              className="rounded-full border border-cyan-200 dark:border-cyan-800 bg-cyan-50/60 dark:bg-cyan-950/40 px-3 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition-colors shadow-2xs"
            >
              📄 {part.label}
            </a>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
          }`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
