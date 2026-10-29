"use client";

import { useActionState, useState } from "react";
import { updatePassword } from "@/app/auth/actions";
import { PasswordField } from "@/app/auth/password-field";
import { confirmError, passwordError } from "@/app/auth/validation";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon } from "@/components/ui/icons";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, undefined);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [submitted, setSubmitted] = useState(false);

  const errors = { password: passwordError(password), confirm: confirmError(password, confirm) };
  const show = (field: "password" | "confirm") => (touched[field] || submitted ? errors[field] : undefined);

  function handleSubmit(formData: FormData) {
    setSubmitted(true);
    if (errors.password || errors.confirm) return;
    formAction(formData);
  }

  return (
    <form action={handleSubmit} noValidate className="space-y-4">
      <PasswordField
        label="New password"
        name="password"
        required
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
        error={show("password")}
        hint="Use at least 8 characters."
      />
      <PasswordField
        label="Confirm new password"
        name="confirmPassword"
        required
        autoComplete="new-password"
        placeholder="Re-enter your password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        onBlur={() => setTouched((prev) => ({ ...prev, confirm: true }))}
        error={show("confirm")}
      />

      <div aria-live="polite">
        {state?.error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-soft p-3.5 text-sm text-danger">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}
      </div>

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {pending ? "Updating password" : "Save new password"}
      </Button>
    </form>
  );
}
