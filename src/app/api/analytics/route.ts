import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const eventSchema = z.object({
  domainSlug: z.string().trim().optional(),
  domainId: z.string().uuid().optional(),
  listingId: z.string().uuid().optional(),
  eventType: z.enum([
    "page_view",
    "listing_view",
    "search",
    "map_interaction",
    "website_click",
    "phone_click",
    "whatsapp_click",
    "uber_click",
    "favorite_click",
  ]),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const rawBody = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(rawBody);

  if (!parsed.success) {
    return Response.json({ error: "Invalid analytics event", details: parsed.error }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Rate limit: Max 120 analytics beacons per minute per IP
  const { data: allowed } = await supabase.rpc("consume_rate_limit", {
    target_key: `analytics:${ip}`,
    window_seconds: 60,
    max_requests: 120,
  });

  if (allowed === false) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Resolve domain and tenant
  let domainId = parsed.data.domainId;
  let tenantId: string | null = null;

  if (parsed.data.domainSlug) {
    const { data: domain } = await supabase
      .from("domains")
      .select("id, tenant_id")
      .eq("slug", parsed.data.domainSlug)
      .maybeSingle();

    if (domain) {
      domainId = domain.id;
      tenantId = domain.tenant_id;
    }
  }

  if (!domainId && !tenantId) {
    // If listingId is supplied, lookup its domain & tenant
    if (parsed.data.listingId) {
      const { data: listing } = await supabase
        .from("listings")
        .select("domain_id, tenant_id")
        .eq("id", parsed.data.listingId)
        .maybeSingle();

      if (listing) {
        domainId = listing.domain_id;
        tenantId = listing.tenant_id;
      }
    }
  }

  if (!domainId || !tenantId) {
    // Fallback: lookup any default active domain
    const { data: defaultDomain } = await supabase
      .from("domains")
      .select("id, tenant_id")
      .limit(1)
      .maybeSingle();

    if (defaultDomain) {
      domainId = defaultDomain.id;
      tenantId = defaultDomain.tenant_id;
    }
  }

  if (!tenantId || !domainId) {
    return Response.json({ error: "No target directory found" }, { status: 404 });
  }

  const { error } = await supabase.from("analytics_events").insert({
    tenant_id: tenantId,
    domain_id: domainId,
    listing_id: parsed.data.listingId ?? null,
    event_type: parsed.data.eventType,
    metadata: {
      ...(parsed.data.metadata || {}),
      ip_present: ip !== "unknown",
      userAgent: request.headers.get("user-agent")?.slice(0, 100) || null,
    },
  });

  if (error) {
    return Response.json({ error: "Event could not be logged" }, { status: 500 });
  }

  return Response.json({ accepted: true }, { status: 202 });
}
