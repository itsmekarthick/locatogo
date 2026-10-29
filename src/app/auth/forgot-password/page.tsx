import Link from "next/link";
import { AuthShell } from "@/app/auth/auth-shell";
import { ForgotPasswordForm } from "@/app/auth/forgot-password/forgot-password-form";
import { LockIcon, MailIcon, ShieldCheckIcon } from "@/components/ui/icons";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your registered email and we'll send you a secure link to choose a new password."
      brand={{
        headline: "Locked out? It happens to everyone.",
        text: "A reset link gets you back into your account in a minute.",
        points: [
          { icon: MailIcon, title: "Check your inbox", text: "The link is sent to your registered address. Look in spam if it doesn't arrive." },
          { icon: LockIcon, title: "Choose a new password", text: "Pick something at least 8 characters long." },
          { icon: ShieldCheckIcon, title: "Private by design", text: "We never confirm whether an email has an account." },
        ],
      }}
      legal="By continuing, you agree to our"
      footer={
        <>
          Remember your password?{" "}
          <Link href="/auth/login" prefetch={false} className="focus-ring rounded font-medium text-accent-text hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
