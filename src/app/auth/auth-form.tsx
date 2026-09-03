"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { ActionResult } from "@/lib/validation/directory";

type AuthAction = (state: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;

export function AuthForm({ action, signup = false }: { action: AuthAction; signup?: boolean }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {signup && (
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              name="displayName"
              required
              autoComplete="name"
              placeholder="e.g. Jordan Miller"
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none select-none">
              👤
            </span>
          </div>
        </div>
      )}

      {/* Email Address */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          Email Address <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="name@company.com"
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none select-none">
            ✉️
          </span>
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Password <span className="text-rose-500">*</span>
          </label>
          {!signup && (
            <Link
              href="/auth/forgot-password"
              prefetch={false}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Forgot password?
            </Link>
          )}
        </div>
        {signup && <p className="text-[11px] text-slate-400 mb-1">Must be at least 8 characters.</p>}
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            minLength={8}
            required
            autoComplete={signup ? "new-password" : "current-password"}
            placeholder="••••••••••••"
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pl-11 pr-11 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none select-none">
            🔒
          </span>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-xs cursor-pointer select-none transition-colors"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      {/* Error Feedback */}
      {state?.error && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-150">
          <span className="text-sm">⚠️</span>
          <span>{state.error}</span>
        </div>
      )}

      {/* Success Feedback */}
      {state?.success && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5 animate-in fade-in duration-150">
          <span className="text-sm">✓</span>
          <span>{state.success}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-950 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-sm py-3.5 px-6 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 transition-all cursor-pointer select-none"
      >
        {pending ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span>Authenticating...</span>
          </>
        ) : (
          <>
            <span>{signup ? "Create Free Account" : "Sign In"}</span>
            <span className="text-xs">→</span>
          </>
        )}
      </button>
    </form>
  );
}
