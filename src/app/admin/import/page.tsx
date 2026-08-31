import { processCsvImport } from "@/app/admin/actions";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminOnlinePlaceFetcher } from "@/components/admin-online-place-fetcher";

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
  const { supabase, tenant } = await requireTenantContext();
  const { job: jobId } = await searchParams;
  const [{ data: domains }, { data: categories }, { data: job }] = await Promise.all([
    supabase.from("domains").select("id, name, slug").eq("tenant_id", tenant.id).order("name"),
    supabase.from("categories").select("id, name").eq("tenant_id", tenant.id).neq("is_active", false).order("sort_order"),
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
    <div className="space-y-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Data Operations & Ingestion</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.05em] text-[var(--foreground)] sm:text-4xl">
          Directory Data Hub
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Fetch real live places online with exact GPS coordinates or upload bulk CSV datasets to seed your directory atlas.
        </p>
      </div>

      {/* 1. Live Online Place Discovery & Fetcher Tool */}
      <AdminOnlinePlaceFetcher
        domains={domains ?? []}
        categories={categories ?? []}
      />

      {/* 2. Bulk CSV Upload Container */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--foreground)]">📄 Upload Offline CSV Dataset</h2>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Upload custom CSV spreadsheets with bulk listings.</p>
          </div>
          <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-mono text-[var(--ink-muted)]">
            Up to 10,000 rows
          </span>
        </div>

        <form action={processCsvImport} className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Target Directory <span className="text-[var(--coral)]">*</span>
              </label>
              <select
                name="domainId"
                required
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-xs font-semibold focus:outline-none"
              >
                <option value="">Choose directory</option>
                {domains?.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name} (/{domain.slug})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                CSV File (.csv) <span className="text-[var(--coral)]">*</span>
              </label>
              <input
                name="file"
                type="file"
                accept=".csv,text/csv"
                required
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-1.5 text-xs text-[var(--ink-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--foreground)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[var(--paper)] cursor-pointer"
              />
            </div>
          </div>

          {/* Expected Columns Pill List */}
          <div className="rounded-2xl bg-[var(--background)] p-4 text-xs">
            <p className="font-bold text-[var(--foreground)]">Supported CSV Header Columns:</p>
            <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[11px] text-[var(--ink-muted)]">
              {["Name", "Category", "Address", "City", "State", "CountryCode", "PostalCode", "Website", "Phone", "Email", "Description"].map((col) => (
                <span key={col} className="rounded-md border border-[var(--line)] bg-[var(--paper)] px-2 py-0.5">
                  {col}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              disabled={!domains?.length}
              className="rounded-full bg-[var(--foreground)] px-6 py-2.5 text-xs font-bold text-[var(--paper)] shadow-xs hover:bg-[var(--foreground)]/85 transition-all disabled:opacity-50 cursor-pointer"
            >
              Start Batch CSV Import →
            </button>
          </div>
        </form>
      </div>

      {/* Results Section if job exists */}
      {job && (
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Import Job Results</h2>
              <p className="text-xs text-[var(--ink-muted)]">Job ID: {job.id}</p>
            </div>
            <span className="rounded-full bg-[var(--leaf)] px-3 py-1 text-xs font-bold text-[var(--leaf-dark)] uppercase">
              {job.status}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total Rows", val: job.total_rows, color: "text-[var(--foreground)]" },
              { label: "Successfully Added", val: job.success_count, color: "text-green-700" },
              { label: "Skipped / Failed", val: job.failure_count, color: "text-red-700" },
              { label: "Duplicate Conflicts", val: job.duplicate_count, color: "text-amber-700" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-[var(--line)] bg-[var(--background)] p-4">
                <p className="text-xs font-bold text-[var(--ink-muted)]">{stat.label}</p>
                <p className={`mt-2 font-display text-2xl font-bold ${stat.color}`}>{stat.val}</p>
              </div>
            ))}
          </div>

          {Array.isArray(job.errors_json) && job.errors_json.length > 0 && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              <p className="font-bold">Row Errors Encountered ({job.errors_json.length}):</p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                {job.errors_json.slice(0, 5).map((err, idx) => (
                  <li key={idx}>{typeof err === "string" ? err : JSON.stringify(err)}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
