"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { updateProfessionalProfile, type ProfileActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, CheckCircleIcon, PencilIcon } from "@/components/ui/icons";
import { controlClasses, Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";

type ProfileEditorProps = {
  displayName: string;
  bio: string | null;
  skills: string[];
  preferredLocation: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
};

type Values = {
  displayName: string;
  preferredLocation: string;
  bio: string;
  skills: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
};

type Errors = Partial<Record<keyof Values, string>>;

const AUTOSAVE_MS = 1200;
const MAX_SKILLS = 30;

// Mirrors the limits in updateProfessionalProfile's schema; the server remains the authority.
function validate(values: Values): Errors {
  const errors: Errors = {};
  const name = values.displayName.trim();
  if (name.length < 2) errors.displayName = "Display name must be at least 2 characters.";
  else if (name.length > 120) errors.displayName = "Display name must be 120 characters or fewer.";
  if (values.preferredLocation.trim().length > 120) errors.preferredLocation = "Preferred location must be 120 characters or fewer.";
  if (values.bio.trim().length > 2000) errors.bio = "Bio must be 2,000 characters or fewer.";
  if (values.skills.trim().length > 1000) errors.skills = "Skills must be 1,000 characters or fewer.";
  for (const key of ["githubUrl", "linkedinUrl", "portfolioUrl"] as const) {
    const raw = values[key].trim();
    if (!raw) continue;
    try {
      new URL(raw);
      if (raw.length > 500) errors[key] = "Use a link of 500 characters or fewer.";
    } catch {
      errors[key] = "Enter a full link, like https://example.com.";
    }
  }
  return errors;
}

const snapshotOf = (values: Values) => JSON.stringify(values);

function skillCount(value: string) {
  return new Set(value.split(",").map((skill) => skill.trim().toLowerCase()).filter(Boolean)).size;
}

export function ProfileEditor({ displayName, bio, skills, preferredLocation, githubUrl, linkedinUrl, portfolioUrl }: ProfileEditorProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ProfileActionState | undefined, FormData>(updateProfessionalProfile, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const initial: Values = {
    displayName,
    preferredLocation: preferredLocation || "",
    bio: bio || "",
    skills: skills.join(", "),
    githubUrl: githubUrl || "",
    linkedinUrl: linkedinUrl || "",
    portfolioUrl: portfolioUrl || "",
  };
  const [values, setValues] = useState<Values>(initial);
  const [baseline] = useState(() => snapshotOf(initial));
  const [submittedSnapshot, setSubmittedSnapshot] = useState<string | null>(null);

  const errors = useMemo(() => validate(values), [values]);
  const hasErrors = Object.keys(errors).length > 0;
  const snapshot = snapshotOf(values);

  const saved = !pending && submittedSnapshot === snapshot && Boolean(state?.success);
  const failed = !pending && submittedSnapshot === snapshot && Boolean(state?.error);
  // After a successful save the server holds the submitted values; before that, the ones the page loaded with.
  const committed = state?.success ? submittedSnapshot : baseline;
  const dirty = snapshot !== committed;

  // Autosave once typing pauses; a snapshot that already failed isn't retried until it changes.
  useEffect(() => {
    if (!open || !dirty || hasErrors || pending || failed) return;
    const timer = window.setTimeout(() => formRef.current?.requestSubmit(), AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [open, dirty, hasErrors, pending, failed, snapshot]);

  const set = (key: keyof Values) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((prev) => ({ ...prev, [key]: event.target.value }));

  function handleSubmit(formData: FormData) {
    if (hasErrors) return;
    setSubmittedSnapshot(snapshot);
    formAction(formData);
  }

  let status: { tone: "muted" | "success" | "danger" | "accent"; label: string; icon: React.ReactNode };
  if (pending) status = { tone: "accent", label: "Saving…", icon: <Spinner className="size-3.5" /> };
  else if (hasErrors) status = { tone: "danger", label: "Fix the highlighted fields to save", icon: <AlertCircleIcon className="size-3.5" /> };
  else if (failed) status = { tone: "danger", label: state?.error || "Couldn't save", icon: <AlertCircleIcon className="size-3.5" /> };
  else if (saved) status = { tone: "success", label: "Saved", icon: <CheckCircleIcon className="size-3.5" /> };
  else if (dirty) status = { tone: "muted", label: "Unsaved changes", icon: <span className="size-1.5 rounded-full bg-fg-subtle" /> };
  else status = { tone: "muted", label: "Changes save automatically", icon: <CheckCircleIcon className="size-3.5" /> };

  const indicator = (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 text-sm",
        status.tone === "success" && "text-success",
        status.tone === "danger" && "text-danger",
        status.tone === "accent" && "text-accent-text",
        status.tone === "muted" && "text-fg-muted",
      )}
    >
      {status.icon}
      {status.label}
    </span>
  );

  const fieldError = (key: keyof Values) => errors[key];
  const skillsOver = skillCount(values.skills) > MAX_SKILLS;

  return (
    <>
      <Button variant="secondary" size="sm" leadingIcon={<PencilIcon className="size-4" />} onClick={() => setOpen(true)}>
        Edit profile
      </Button>

      <Sheet
        open={open}
        onOpenChange={setOpen}
        side="right"
        width="34rem"
        title="Edit professional profile"
        description={indicator}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Done
            </Button>
            <Button type="submit" form="profile-form" loading={pending} disabled={hasErrors || !dirty}>
              Save now
            </Button>
          </>
        }
      >
        <form id="profile-form" ref={formRef} action={handleSubmit} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Display name" name="displayName" required value={values.displayName} onChange={set("displayName")} error={fieldError("displayName")} autoComplete="name" />
            <Input
              label="Preferred location"
              name="preferredLocation"
              value={values.preferredLocation}
              onChange={set("preferredLocation")}
              error={fieldError("preferredLocation")}
              placeholder="Bengaluru or Remote"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-bio" className="text-sm font-medium text-fg">
              Bio
            </label>
            <textarea
              id="profile-bio"
              name="bio"
              rows={4}
              value={values.bio}
              onChange={set("bio")}
              aria-invalid={fieldError("bio") ? true : undefined}
              aria-describedby="profile-bio-meta"
              placeholder="Tell employers what you build and the problems you enjoy solving."
              className={cn(controlClasses, "h-auto resize-y py-2.5")}
            />
            <p id="profile-bio-meta" className={cn("flex justify-between gap-3 text-[13px]", fieldError("bio") ? "text-danger" : "text-fg-subtle")}>
              <span>{fieldError("bio") ?? "A concise summary works best."}</span>
              <span className="tabular-nums">{values.bio.trim().length.toLocaleString("en-US")} / 2,000</span>
            </p>
          </div>

          <Input
            label="Skills"
            name="skills"
            value={values.skills}
            onChange={set("skills")}
            error={fieldError("skills")}
            placeholder="React, TypeScript, PostgreSQL"
            hint={skillsOver ? `Only the first ${MAX_SKILLS} skills are kept.` : "Separate skills with commas."}
          />

          <div className="grid gap-4">
            <Input label="GitHub URL" name="githubUrl" type="url" inputMode="url" value={values.githubUrl} onChange={set("githubUrl")} error={fieldError("githubUrl")} placeholder="https://github.com/you" />
            <Input label="LinkedIn URL" name="linkedinUrl" type="url" inputMode="url" value={values.linkedinUrl} onChange={set("linkedinUrl")} error={fieldError("linkedinUrl")} placeholder="https://linkedin.com/in/you" />
            <Input label="Portfolio URL" name="portfolioUrl" type="url" inputMode="url" value={values.portfolioUrl} onChange={set("portfolioUrl")} error={fieldError("portfolioUrl")} placeholder="https://your-site.com" />
          </div>
        </form>
      </Sheet>
    </>
  );
}
