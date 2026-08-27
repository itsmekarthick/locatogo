import { requireTenantContext } from "@/lib/auth/tenant-context";

function csv(value: unknown) {
  const text = String(value ?? "").replaceAll('"', '""');
  return `"${text}"`;
}

export async function GET() {
  const { supabase, tenant } = await requireTenantContext();
  const { data, error } = await supabase.from("listings").select("title, slug, status, verification_status, city, administrative_area, country_code, postal_code, website, phone, email, created_at, updated_at").eq("tenant_id", tenant.id).order("created_at", { ascending: false });
  if (error) return new Response("Export unavailable", { status: 500 });
  const headers = ["title", "slug", "status", "verification_status", "city", "administrative_area", "country_code", "postal_code", "website", "phone", "email", "created_at", "updated_at"];
  const rows = (data ?? []).map((listing) => headers.map((header) => csv(listing[header as keyof typeof listing])).join(","));
  return new Response([headers.join(","), ...rows].join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${tenant.slug}-listings.csv"` } });
}
