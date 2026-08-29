import Link from "next/link";
import { login } from "@/app/auth/actions";
import { AuthForm } from "@/app/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="font-display text-2xl font-bold tracking-tight text-[var(--foreground)]">
            locatogo<span className="text-[var(--coral)]">.</span>
          </Link>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">Directory Platform</p>
        </div>

        {/* Card Container */}
        <div className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-7 sm:p-10 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Welcome back</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.05em] text-[var(--foreground)]">
            Sign in to Workspace
          </h1>
          <p className="mt-2 mb-6 text-sm text-[var(--ink-muted)]">
            Manage your directories, listings, and moderation queue.
          </p>

          <AuthForm action={login} />

          <p className="mt-6 text-center text-xs text-[var(--ink-muted)]">
            Need a new workspace?{" "}
            <Link href="/auth/signup" className="font-semibold text-[var(--coral)] hover:underline">
              Create a workspace free
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
