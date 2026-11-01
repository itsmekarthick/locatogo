"use client";

import { useState, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/badge";
import { AlertCircleIcon, PlusIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { HUBS, type ParsedResume } from "@/components/resume-onboarding";
import { EXPERIENCE_LEVELS, type ExperienceLevel } from "@/lib/matching/types";
import "./matches.css";

const rise = (index: number) => ({ "--i": index } as CSSProperties);

export const LEVEL_LABEL: Record<ExperienceLevel, string> = {
  intern: "Internship",
  entry: "Entry level",
  mid: "Mid level",
  senior: "Senior",
  lead: "Lead",
  executive: "Executive",
};

const MAX_SKILLS = 30;

type ConfirmProfileProps = {
  initial: ParsedResume;
  /** Called after the profile has been saved. */
  onSaved: () => void;
  onBack: () => void;
};

/** Lets the person correct what was read from their resume before it is used to rank roles. */
export function ConfirmProfile({ initial, onSaved, onBack }: ConfirmProfileProps) {
  const [headline, setHeadline] = useState(initial.headline ?? "");
  const [level, setLevel] = useState<ExperienceLevel | "">(initial.level ?? "");
  const [years, setYears] = useState(initial.yearsExperience == null ? "" : String(initial.yearsExperience));
  const [location, setLocation] = useState(initial.location);
  const [skills, setSkills] = useState(initial.skills);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hubs = HUBS.includes(location) ? HUBS : [location, ...HUBS];

  function addSkill() {
    const value = draft.trim().slice(0, 60);
    if (!value) return;
    if (skills.length < MAX_SKILLS && !skills.some((skill) => skill.toLowerCase() === value.toLowerCase())) setSkills([...skills, value]);
    setDraft("");
  }

  function onDraftKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addSkill();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (skills.length === 0) {
      setError("Keep at least one skill so there is something to match.");
      return;
    }
    const parsedYears = years.trim() === "" ? null : Number(years);
    if (parsedYears != null && (Number.isNaN(parsedYears) || parsedYears < 0 || parsedYears > 60)) {
      setError("Years of experience must be between 0 and 60.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/matches/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline: headline.trim() || null, level: level || null, yearsExperience: parsedYears, location, skills }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Could not save your profile.");
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your profile.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="scan-rise stagger" style={rise(0)}>
        <h2 className="font-display text-xl font-semibold tracking-tight">Check what we read</h2>
        <p className="mt-1 text-sm text-fg-muted">Corrections here change how roles are ranked. Level and years decide how senior a role should be.</p>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-sm text-danger">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="scan-rise stagger" style={rise(1)}>
        <Input label="Headline" value={headline} onChange={(event) => setHeadline(event.target.value)} maxLength={120} placeholder="Senior backend engineer" />
      </div>

      <div className="scan-rise stagger grid gap-4 sm:grid-cols-3" style={rise(2)}>
        <Select label="Level" value={level} onChange={(event) => setLevel(event.target.value as ExperienceLevel | "")}>
          <option value="">Not sure</option>
          {EXPERIENCE_LEVELS.map((value) => (
            <option key={value} value={value}>
              {LEVEL_LABEL[value]}
            </option>
          ))}
        </Select>
        <Input label="Years of experience" type="number" inputMode="decimal" min={0} max={60} step={0.5} value={years} onChange={(event) => setYears(event.target.value)} />
        <Select label="Preferred hub" value={location} onChange={(event) => setLocation(event.target.value)}>
          {hubs.map((hub) => (
            <option key={hub} value={hub}>
              {hub === "Remote" ? "Remote anywhere" : hub}
            </option>
          ))}
        </Select>
      </div>

      <div className="scan-rise stagger" style={rise(3)}>
        <p className="mb-1.5 text-sm font-medium">Skills</p>
        <ul role="list" className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <li key={skill} className="scan-rise stagger" style={rise(Math.min(index, 10) + 4)}>
              <Chip selected onRemove={() => setSkills(skills.filter((item) => item !== skill))} removeLabel="Remove skill">
                {skill}
              </Chip>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <div className="min-w-0 flex-1">
            <Input aria-label="Add a skill" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={onDraftKeyDown} placeholder="Add a skill" maxLength={60} />
          </div>
          <Button type="button" variant="secondary" onClick={addSkill} leadingIcon={<PlusIcon className="size-4" />}>
            Add
          </Button>
        </div>
      </div>

      <div className="scan-rise stagger flex flex-wrap items-center gap-2 pt-1" style={rise(5)}>
        <Button type="submit" loading={saving}>
          Find my matches
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} disabled={saving}>
          Back
        </Button>
      </div>
    </form>
  );
}
