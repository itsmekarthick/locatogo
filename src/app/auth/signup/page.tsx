import Link from "next/link";
import { signup } from "@/app/auth/actions";
import { AuthForm } from "@/app/auth/auth-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-12">
      <div className="w-full max-w-lg">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="font-display text-2xl font-bold tracking-tight text-[var(--foreground)]">
            mapora<span className="text-[var(--coral)]">.</span>
          </Link>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">Directory Platform</p>
        </div>

        {/* Card Container */}
        <div className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-7 sm:p-10 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Get Started Free</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.05em] text-[var(--foreground)]">
            Create Your Workspace
          </h1>
          <p className="mt-2 mb-6 text-sm text-[var(--ink-muted)]">
            Create your account and first directory to begin curating places.
          </p>

          <AuthForm action={signup} signup />

          <p className="mt-6 text-center text-xs text-[var(--ink-muted)]">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-[var(--foreground)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
