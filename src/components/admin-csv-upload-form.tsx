"use client";

import { useState, useTransition } from "react";
import { processCsvImport } from "@/app/admin/actions";

export function AdminCsvUploadForm({
  domains,
  categories,
}: {
  domains: { id: string; name: string; slug: string }[];
  categories: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await processCsvImport(formData);
        });
      }}
      className="mt-6 space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Target Atlas Domain
          </label>
          <select
            name="domain_id"
            required
            className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.name} (/{domain.slug})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Fallback Category
          </label>
          <select
            name="category_id"
            required
            className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          CSV Spreadsheet (Up to 10,000 Rows / 25 MB)
        </label>
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          onChange={(e) => {
            const file = e.target.files?.[0];
            setSelectedFileName(file ? `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)` : null);
          }}
          className="mt-2 block w-full text-xs text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-cyan-500 cursor-pointer"
        />
        {selectedFileName && (
          <p className="mt-2 text-xs font-mono text-cyan-600 dark:text-cyan-400">
            Selected: {selectedFileName}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-slate-900 dark:bg-cyan-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 dark:hover:bg-cyan-500 transition-ui flex items-center gap-2 disabled:opacity-50 cursor-pointer"
      >
        {isPending ? (
          <>
            <span className="animate-spin text-sm">⏳</span>
            <span>Ingesting 10,000 Records (High-Speed Batch)...</span>
          </>
        ) : (
          <span>Start CSV Import Batch</span>
        )}
      </button>
    </form>
  );
}
