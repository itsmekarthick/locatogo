"use client";

import { useActionState, useState } from "react";
import { updateProfessionalProfile, type ProfileActionState } from "./actions";

type ProfileEditorProps = {
  displayName: string;
  bio: string | null;
  skills: string[];
  preferredLocation: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
};

export function ProfileEditor({
  displayName,
  bio,
  skills,
  preferredLocation,
  githubUrl,
  linkedinUrl,
  portfolioUrl,
}: ProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState<ProfileActionState | undefined, FormData>(
    updateProfessionalProfile,
    undefined,
  );

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-700 transition-colors hover:bg-cyan-100 dark:border-cyan-900/70 dark:bg-cyan-950/40 dark:text-cyan-300 dark:hover:bg-cyan-950/70"
      >
        Edit profile
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{state.error}</p>}
      {state?.success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">{state.success}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Display name" name="displayName" defaultValue={displayName} required />
        <Field label="Preferred location" name="preferredLocation" defaultValue={preferredLocation || ""} placeholder="e.g. Bengaluru or Remote" />
      </div>
      <div>
        <label htmlFor="bio" className="mb-1.5 block text-xs font-bold text-[var(--ink-muted)]">Bio</label>
        <textarea id="bio" name="bio" rows={4} defaultValue={bio || ""} placeholder="Tell employers what you build and the problems you enjoy solving." className="w-full resize-y rounded-lg border border-[var(--line)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10" />
      </div>
      <div>
        <label htmlFor="skills" className="mb-1.5 block text-xs font-bold text-[var(--ink-muted)]">Skills</label>
        <input id="skills" name="skills" defaultValue={skills.join(", ")} placeholder="React, TypeScript, PostgreSQL" className="w-full rounded-lg border border-[var(--line)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10" />
        <p className="mt-1 text-[11px] text-[var(--ink-muted)]">Separate skills with commas.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="GitHub URL" name="githubUrl" defaultValue={githubUrl || ""} type="url" />
        <Field label="LinkedIn URL" name="linkedinUrl" defaultValue={linkedinUrl || ""} type="url" />
        <Field label="Portfolio URL" name="portfolioUrl" defaultValue={portfolioUrl || ""} type="url" />
      </div>
      <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--line)] pt-4">
        <button type="button" onClick={() => setIsEditing(false)} disabled={pending} className="rounded-lg px-3 py-2 text-xs font-bold text-[var(--ink-muted)] transition hover:bg-[var(--background)] disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={pending} className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Saving..." : "Save changes"}</button>
      </div>
    </form>
  );
}

function Field({ label, name, defaultValue, placeholder, type = "text", required = false }: { label: string; name: string; defaultValue: string; placeholder?: string; type?: "text" | "url"; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-bold text-[var(--ink-muted)]">{label}</label>
      <input id={name} name={name} type={type} required={required} defaultValue={defaultValue} placeholder={placeholder} className="w-full rounded-lg border border-[var(--line)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10" />
    </div>
  );
}