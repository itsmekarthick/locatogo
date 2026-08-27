import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const eventSchema = z.object({ domainSlug: z.string().trim().min(1).max(80), listingId: z.string().uuid().optional(), eventType: z.enum(["listing_view", "search", "map_interaction", "website_click", "phone_click", "whatsapp_click"]) });

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid analytics event" }, { status: 400 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { data: allowed } = await supabase.rpc("consume_rate_limit", { target_key: `analytics:${ip}`, window_seconds: 60, max_requests: 60 });
  if (!allowed) return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  const { data: domain } = await supabase.from("domains").select("id, tenant_id").eq("slug", parsed.data.domainSlug).eq("status", "published").single();
  if (!domain) return Response.json({ error: "Directory not found" }, { status: 404 });
  const { error } = await supabase.from("analytics_events").insert({ tenant_id: domain.tenant_id, domain_id: domain.id, listing_id: parsed.data.listingId ?? null, event_type: parsed.data.eventType, metadata: { ip_hash: ip === "unknown" ? null : "present" } });
  if (error) return Response.json({ error: "Event unavailable" }, { status: 500 });
  return Response.json({ accepted: true }, { status: 202 });
}
