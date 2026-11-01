import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EXPERIENCE_LEVELS } from "@/lib/matching/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  headline: z.string().trim().max(120).nullable(),
  level: z.enum(EXPERIENCE_LEVELS).nullable(),
  yearsExperience: z.number().min(0).max(60).nullable(),
  location: z.string().trim().min(1).max(120),
  skills: z.array(z.string().trim().min(1).max(60)).min(1).max(30),
});

/** Saves the profile fields the matcher reads after the person has reviewed what was read from their resume. */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the profile fields and try again." }, { status: 400 });
  }

  const { headline, level, yearsExperience, location, skills } = parsed.data;
  const uniqueSkills = Array.from(new Map(skills.map((skill) => [skill.toLowerCase(), skill] as const)).values());

  const { data, error } = await supabase
    .from("tech_profiles")
    .update({
      headline: headline || null,
      experience_level: level,
      years_experience: yearsExperience == null ? null : Math.round(yearsExperience * 10) / 10,
      preferred_location: location,
      skills: uniqueSkills,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id");

  if (error) {
    console.error("Match profile save error:", error);
    return NextResponse.json({ error: "Could not save your profile." }, { status: 500 });
  }
  if (!data?.length) return NextResponse.json({ error: "Upload a resume first." }, { status: 404 });

  return NextResponse.json({ success: true });
}
