import { requireTenantContext } from "@/lib/auth/tenant-context";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, tenant } = await requireTenantContext();
  const { data: job, error } = await supabase.from("import_jobs").select("errors_json").eq("id", id).eq("tenant_id", tenant.id).single();
  if (error || !job) return new Response("Import not found", { status: 404 });
  const errors = Array.isArray(job.errors_json) ? job.errors_json as Array<{ row?: number; error?: string }> : [];
  const csv = ["row,error", ...errors.map((item) => `${item.row ?? ""},"${String(item.error ?? "").replaceAll('"', '""')}"`)].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${id}-errors.csv"` } });
}
