import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runMatching } from "@/lib/matching/run";
import { loadMatchProfile } from "@/lib/matching/profile";
import type { MatchRunEvent } from "@/lib/matching/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const COOLDOWN_MS = 15000;

/** Streams newline-delimited JSON events while the signed-in user's matches are computed and saved. */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: lastRun } = await supabase.from("match_runs").select("completed_at, profile_hash").eq("user_id", user.id).maybeSingle();
  if (lastRun?.completed_at && Date.now() - new Date(lastRun.completed_at).getTime() < COOLDOWN_MS) {
    // A changed profile is a new request, not a repeat, so it skips the cooldown.
    const current = await loadMatchProfile(supabase, user.id).catch(() => null);
    if (!current || current.hash === lastRun.profile_hash) {
      return NextResponse.json({ error: "Matches were just refreshed. Try again in a few seconds." }, { status: 429 });
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: MatchRunEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        await runMatching(supabase, user.id, emit);
      } catch (error) {
        console.error("Match run error:", error);
        emit({ type: "error", message: "Something went wrong while matching. Try again in a moment." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
