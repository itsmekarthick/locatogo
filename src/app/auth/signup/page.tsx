import type { Metadata } from "next";
import Link from "next/link";
import { signup } from "@/app/auth/actions";
import { AuthForm } from "@/app/auth/auth-form";
import { AuthShell } from "@/app/auth/auth-shell";
import { GoogleSignInButton } from "@/app/auth/google-sign-in-button";
import { BuildingIcon, CheckCircleIcon, MapPinIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Create Your Tech Atlas Account | LocaToGo",
  description: "Create a free LocaToGo account to explore technology companies, global hubs, and live job opportunities.",
  keywords: ["create Tech Atlas account", "LocaToGo signup", "technology jobs", "startup ecosystem"],
  alternates: { canonical: "/auth/signup" },
  robots: { index: false, follow: true },
};

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Get started free"
      title="Create your account"
      description="Explore companies, follow live opportunities and add your company."
      brand={{
        headline: "Your next opportunity starts with the right tech hub.",
        text: "Join professionals, founders and company teams exploring the global technology ecosystem. It's free to explore.",
        points: [
          { icon: MapPinIcon, title: "Explore by country, city and hub", text: "Find technology companies wherever you want to work." },
          { icon: CheckCircleIcon, title: "Profiles, stacks and live roles", text: "Review stages, tech stacks and open positions in one place." },
          { icon: BuildingIcon, title: "Add your company", text: "Put your team on the public Tech Atlas." },
        ],
      }}
      legal="By registering, you agree to our"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="focus-ring rounded font-medium text-accent-text hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <GoogleSignInButton text="Sign up with Google" next="/admin" />

      <div className="my-6 flex items-center gap-3" role="separator" aria-label="or">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs font-medium uppercase tracking-wider text-fg-subtle">or register with email</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <AuthForm action={signup} signup />
    </AuthShell>
  );
}
