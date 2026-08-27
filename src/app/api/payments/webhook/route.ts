import { createHmac, timingSafeEqual } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function validSignature(body: string, signature: string) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const received = Buffer.from(signature, "utf8");
  const computed = Buffer.from(expected, "utf8");
  return received.length === computed.length && timingSafeEqual(received, computed);
}

export async function POST(request: Request) {
  const body = await request.text();
  if (!validSignature(body, request.headers.get("x-payment-signature") ?? "")) return Response.json({ error: "Invalid signature" }, { status: 401 });
  let event: { gatewayReference?: string; status?: string };
  try { event = JSON.parse(body) as { gatewayReference?: string; status?: string }; } catch { return Response.json({ error: "Invalid payload" }, { status: 400 }); }
  if (!event.gatewayReference || !["succeeded", "failed", "refunded", "cancelled", "pending"].includes(event.status ?? "")) return Response.json({ error: "Invalid event" }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("payments").update({ status: event.status }).eq("gateway_ref", event.gatewayReference);
  if (error) return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  return Response.json({ received: true });
}
