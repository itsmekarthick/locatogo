"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, FileTextIcon, SparklesIcon, UploadIcon, XIcon } from "@/components/ui/icons";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

const HUBS = ["Bangalore", "San Francisco", "New York", "Seattle", "Austin", "London", "Remote"];

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResumeOnboarding({ hasResume = false }: { hasResume?: boolean }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [location, setLocation] = useState("Bangalore");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearSelectedFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Choose a PDF that is 5MB or smaller.");
      clearSelectedFile();
      return;
    }

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("location", location);

    try {
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process resume");

      // Reload dashboard to show recommended jobs
      clearSelectedFile();
      setIsProcessing(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process resume");
      clearSelectedFile();
      setIsProcessing(false);
    }
  };

  return (
    <section id="resume" className="relative scroll-mt-24 overflow-hidden rounded-2xl border border-line bg-surface-1 p-5 elev-sm sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative">
        <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-[1.25rem] text-accent-text">
          <SparklesIcon />
        </span>
        <h2 className="mt-4 font-display text-xl font-semibold tracking-tight">{hasResume ? "Refresh your matches" : "Unlock personalized matches"}</h2>
        <p className="mt-1.5 text-sm leading-6 text-fg-muted">
          {hasResume ? "Upload an updated resume and we will re-read your skills and refresh the roles on this page." : "Upload your resume and we will extract your core skills to find open roles in your preferred city."}
        </p>

        {isProcessing ? (
          <div role="status" aria-live="polite" className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-4">
            <span aria-hidden="true" className="size-5 shrink-0 animate-spin rounded-full border-2 border-accent/25 border-t-accent" />
            <div>
              <p className="text-sm font-medium">Analyzing your resume…</p>
              <p className="text-xs text-fg-subtle">Extracting skills and matching roles. This takes a moment.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="mt-5 space-y-4">
            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-sm text-danger">
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}

            <div>
              <label htmlFor="resume-file" className="mb-1.5 block text-sm font-medium">
                Resume (PDF)
              </label>
              <div
                className={cn(
                  "relative rounded-xl border-2 border-dashed p-5 text-center transition-ui focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15",
                  isDragging ? "border-accent bg-accent-soft" : "border-line-strong bg-surface-2 hover:border-accent/50",
                )}
              >
                <input
                  id="resume-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] || null;
                    if (selectedFile && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
                      clearSelectedFile();
                      setError("Choose a PDF file.");
                      return;
                    }
                    setFile(selectedFile);
                    setError(null);
                  }}
                  onDragEnter={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={() => setIsDragging(false)}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                  required
                />
                <span className="mx-auto grid size-10 place-items-center rounded-full bg-surface-3 text-[1.2rem] text-fg-muted">
                  <UploadIcon />
                </span>
                <p className="mt-2 text-sm font-medium">{isDragging ? "Drop to upload" : "Click to upload or drag and drop"}</p>
                <p className="mt-0.5 text-xs text-fg-subtle">PDF up to 5MB</p>
              </div>

              {file && (
                <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-line bg-surface-1 py-2 pl-3 pr-2">
                  <FileTextIcon className="size-5 shrink-0 text-accent-text" />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</p>
                  <span className="shrink-0 text-xs text-fg-subtle">{formatSize(file.size)}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={clearSelectedFile}
                    className="focus-ring grid size-7 shrink-0 place-items-center rounded-lg text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
              )}
            </div>

            <Select label="Preferred hub" value={location} onChange={(e) => setLocation(e.target.value)} hint="Where would you like to work next?">
              {HUBS.map((hub) => (
                <option key={hub} value={hub}>
                  {hub === "Remote" ? "Remote anywhere" : hub}
                </option>
              ))}
            </Select>

            <Button type="submit" fullWidth disabled={!file}>
              {hasResume ? "Re-analyze resume" : "Analyze resume & find matches"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
