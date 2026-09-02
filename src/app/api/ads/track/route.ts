import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adSlotId, eventType, metadata = {} } = body;

    if (!adSlotId || !eventType || !["impression", "click"].includes(eventType)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // 1. Fetch ad slot tenant_id
    const { data: slot, error: slotError } = await supabase
      .from("ad_slots")
      .select("tenant_id")
      .eq("id", adSlotId)
      .maybeSingle();

    if (slotError || !slot) {
      return NextResponse.json({ error: "Ad slot not found" }, { status: 404 });
    }

    // 2. Insert ad_events row
    const userAgent = req.headers.get("user-agent") || "";
    const referer = req.headers.get("referer") || "";

    const { error: insertError } = await supabase.from("ad_events").insert({
      tenant_id: slot.tenant_id,
      ad_slot_id: adSlotId,
      event_type: eventType,
      occurred_at: new Date().toISOString(),
      metadata: {
        ...metadata,
        user_agent: userAgent.slice(0, 150),
        referer: referer.slice(0, 200),
      },
    });

    if (insertError) {
      console.warn("Ad event tracking error:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Tracking failed" }, { status: 500 });
  }
}
