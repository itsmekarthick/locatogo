"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePassword } from "@/app/auth/actions";

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(updatePassword, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="font-display text-2xl font-bold tracking-tight text-[var(--foreground)]">
            LocaToGo<span className="text-[var(--coral)]">.</span>
          </Link>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Account Security
          </p>
        </div>

        {/* Card Container */}
        <div className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-7 sm:p-10 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">
            Choose New Password
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.05em] text-[var(--foreground)]">
            Update Password
          </h1>
          <p className="mt-2 mb-6 text-sm text-[var(--ink-muted)]">
            Enter your new password below. It must be at least 8 characters.
          </p>

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                New Password <span className="text-[var(--coral)]">*</span>
              </label>
              <input
                name="password"
                type="password"
                minLength={8}
                required
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:bg-[var(--paper)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Confirm New Password <span className="text-[var(--coral)]">*</span>
              </label>
              <input
                name="confirmPassword"
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

            <button
              disabled={pending}
              className="mt-2 w-full rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--paper)] shadow-sm transition-all hover:bg-[var(--foreground)]/90 hover:shadow disabled:opacity-50 cursor-pointer"
            >
              {pending ? "Updating Password..." : "Save New Password & Enter →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

