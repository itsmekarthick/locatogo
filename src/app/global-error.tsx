"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Global Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center font-sans text-white antialiased">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-900/40 text-2xl">
            🚨
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">System Notice</h2>
          <p className="mt-2 text-xs text-slate-400">
            A critical layout error occurred. Click below to reload the workspace safely.
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => reset()}
              className="rounded-full bg-[#06b6d4] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg hover:bg-[#0891b2] transition-all cursor-pointer"
            >
              ↻ Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
