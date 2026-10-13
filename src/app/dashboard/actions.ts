"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  error?: string;
  success?: string;
};

const optionalUrl = z.union([z.literal(""), z.string().trim().url().max(500)]).transform((value) => value || null);

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Display name must be at least 2 characters.").max(120),
  bio: z.string().trim().max(2_000, "Bio must be 2,000 characters or fewer.").transform((value) => value || null),
  skills: z.string().trim().max(1_000, "Skills must be 1,000 characters or fewer."),
  preferredLocation: z.string().trim().max(120, "Preferred location must be 120 characters or fewer.").transform((value) => value || null),
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  portfolioUrl: optionalUrl,
});

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field : "";
}

function normalizeSkills(value: string) {
  return Array.from(
    new Map(
      value
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
        .slice(0, 30)
        .map((skill) => [skill.toLocaleLowerCase(), skill] as const),
    ).values(),
  );
}

export async function updateProfessionalProfile(
  _state: ProfileActionState | undefined,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = profileSchema.safeParse({
    displayName: value(formData, "displayName"),
    bio: value(formData, "bio"),
    skills: value(formData, "skills"),
    preferredLocation: value(formData, "preferredLocation"),
    githubUrl: value(formData, "githubUrl"),
    linkedinUrl: value(formData, "linkedinUrl"),
    portfolioUrl: value(formData, "portfolioUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check the highlighted profile details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to update your profile." };

  const { data: account, error: accountError } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();

  if (accountError || account?.platform_role !== "tech_user") {
    return { error: "Only tech professionals can update this profile." };
  }

  const skills = normalizeSkills(parsed.data.skills);
  const { error: identityError } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id);

  if (identityError) return { error: "Unable to update your display name." };

  const { error: authMetadataError } = await supabase.auth.updateUser({
    data: { display_name: parsed.data.displayName },
  });

  if (authMetadataError) return { error: "Unable to update your display name." };

  const { error: profileError } = await supabase
    .from("tech_profiles")
    .upsert({
      id: user.id,
      bio: parsed.data.bio,
      skills,
      preferred_location: parsed.data.preferredLocation,
      github_url: parsed.data.githubUrl,
      linkedin_url: parsed.data.linkedinUrl,
      portfolio_url: parsed.data.portfolioUrl,
      updated_at: new Date().toISOString(),
    });

  if (profileError) return { error: "Unable to update your professional profile." };

  revalidatePath("/dashboard");
  return { success: "Profile updated." };
}