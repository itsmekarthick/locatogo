"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/validation/directory";

type AuthAction = (state: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;

export function AuthForm({ action, signup = false }: { action: AuthAction; signup?: boolean }) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {signup && (
        <>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Your Full Name <span className="text-[var(--coral)]">*</span>
            </label>
            <input
              name="displayName"
              required
              placeholder="e.g. Jordan Miller"
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:bg-[var(--paper)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Workspace / Organization Name <span className="text-[var(--coral)]">*</span>
            </label>
            <input
              name="tenantName"
              required
              placeholder="e.g. City Pulse Media"
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:bg-[var(--paper)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Workspace Slug <span className="text-[var(--coral)]">*</span>
            </label>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">Unique identifier (lowercase & hyphens only).</p>
            <input
              name="tenantSlug"
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              placeholder="e.g. city-pulse"
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:bg-[var(--paper)] focus:outline-none"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
          Email Address <span className="text-[var(--coral)]">*</span>
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder="name@company.com"
          className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:bg-[var(--paper)] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
          Password <span className="text-[var(--coral)]">*</span>
        </label>
        {signup && <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">Must be at least 8 characters.</p>}
        <input
          name="password"
          type="password"
          minLength={8}
          required
          placeholder="••••••••"
          className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:bg-[var(--paper)] focus:outline-none"
        />
      </div>

      {state?.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          ⚠️ {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-800">
          ✓ {state.success}
        </div>
      )}

      <button
        disabled={pending}
        className="mt-2 w-full rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--paper)] shadow-sm transition-all hover:bg-[var(--foreground)]/90 hover:shadow disabled:opacity-50"
      >
        {pending ? "Authenticating..." : signup ? "Create directory workspace →" : "Sign in to workspace →"}
      </button>
    </form>
  );
}
