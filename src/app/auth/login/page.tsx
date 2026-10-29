import type { Metadata } from "next";
import Link from "next/link";
import { login } from "@/app/auth/actions";
import { AuthForm } from "@/app/auth/auth-form";
import { AuthShell } from "@/app/auth/auth-shell";
import { GoogleSignInButton } from "@/app/auth/google-sign-in-button";
import { AlertCircleIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Sign In to the Global Tech Atlas | LocaToGo",
  description: "Sign in to LocaToGo to explore technology companies, tech hubs, live jobs, and your saved Atlas activity.",
  keywords: ["LocaToGo login", "Tech Atlas login", "technology companies", "live tech jobs"],
  alternates: { canonical: "/auth/login" },
  robots: { index: false, follow: true },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <AuthShell
      eyebrow="Secure sign in"
      title="Welcome back"
      description="Sign in to continue exploring companies, tech hubs and live opportunities."
      brand={{
        headline: "Discover the companies shaping the next tech economy.",
        text: "Explore global tech hubs, company profiles, technology stacks and active roles from one searchable map.",
      }}
      legal="By signing in, you agree to our"
      footer={
        <>
          Don&apos;t have an account yet?{" "}
          <Link href="/auth/signup" className="focus-ring rounded font-medium text-accent-text hover:underline">
            Create a free account
          </Link>
        </>
      }
    >
      {error && (
        <div role="alert" className="mb-6 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-soft p-3.5 text-sm text-danger">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <GoogleSignInButton text="Continue with Google" next="/admin" />

      <div className="my-6 flex items-center gap-3" role="separator" aria-label="or">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs font-medium uppercase tracking-wider text-fg-subtle">or continue with email</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <AuthForm action={login} />
    </AuthShell>
  );
}
