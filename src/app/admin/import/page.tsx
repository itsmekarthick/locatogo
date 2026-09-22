import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminOnlinePlaceFetcher } from "@/components/admin-online-place-fetcher";
import { AdminClearListingsButton } from "@/components/admin-clear-listings-button";
import { AdminCsvUploadForm } from "@/components/admin-csv-upload-form";

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
  const { supabase, tenant } = await requireTenantContext();
  const { job: jobId } = await searchParams;
  const [{ data: domains }, { data: categories }, { count: listingsCount }, { data: job }] = await Promise.all([
    supabase.from("domains").select("id, name, slug").eq("tenant_id", tenant.id).order("name"),
    supabase.from("categories").select("id, name").eq("tenant_id", tenant.id).neq("is_active", false).order("sort_order"),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    jobId
      ? supabase
          .from("import_jobs")
          .select("id, status, total_rows, success_count, failure_count, duplicate_count, errors_json")
          .eq("id", jobId)
          .eq("tenant_id", tenant.id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400">Data Operations & Ingestion</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.05em] text-slate-900 dark:text-slate-100 sm:text-4xl">
            Directory Data Hub
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Fetch real live places online with exact GPS coordinates or upload bulk CSV datasets to seed your directory atlas.
          </p>
        </div>

        <AdminClearListingsButton listingsCount={listingsCount ?? 0} />
      </div>

      {/* 2. Live Online Place Discovery & Fetcher Tool */}
      <AdminOnlinePlaceFetcher
        domains={domains ?? []}
        categories={categories ?? []}
      />

      {/* 3. Bulk CSV Upload Container */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">📄 Upload Custom CSV Dataset</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Upload custom CSV spreadsheets with bulk listings.</p>
          </div>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-mono text-slate-600 dark:text-slate-400">
            Up to 10,000 rows / 25 MB
          </span>
        </div>

        <AdminCsvUploadForm
          domains={domains ?? []}
          categories={categories ?? []}
        />

        {job ? (
          <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs">
            <p className="font-bold text-slate-900 dark:text-slate-100">Job {job.id}</p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Status: {job.status} · Total: {job.total_rows} · Success: {job.success_count} · Failed:{" "}
              {job.failure_count} · Duplicates: {job.duplicate_count}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
