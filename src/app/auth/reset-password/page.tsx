import { AuthShell } from "@/app/auth/auth-shell";
import { ResetPasswordForm } from "@/app/auth/reset-password/reset-password-form";
import { LockIcon, ShieldCheckIcon } from "@/components/ui/icons";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account security"
      title="Choose a new password"
      description="Enter your new password below. It must be at least 8 characters."
      brand={{
        headline: "One last step back into your account.",
        text: "Pick a strong password you don't use anywhere else.",
        points: [
          { icon: LockIcon, title: "At least 8 characters", text: "Longer is better. A short phrase works well." },
          { icon: ShieldCheckIcon, title: "Signed in right after", text: "Once saved, you'll go straight to your workspace." },
        ],
      }}
      legal="By continuing, you agree to our"
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
