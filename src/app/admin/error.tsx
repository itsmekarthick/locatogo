"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Workspace Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center font-sans text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-2xl">
          ⚙️
        </div>
        <h2 className="mt-4 font-serif text-2xl font-bold text-slate-950 dark:text-slate-50">
          Admin Console Notice
        </h2>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          We encountered an issue loading this administrative view or dataset.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto rounded-full bg-[#e26a4f] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#d8583c] transition-all cursor-pointer"
          >
            ↻ Retry Query
          </button>
          <Link
            href="/admin"
            className="w-full sm:w-auto rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all text-center"
          >
            Admin Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
