"use client";

import { useActionState, useState } from "react";
import { requestPasswordReset } from "@/app/auth/actions";
import { emailError } from "@/app/auth/validation";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, CheckCircleIcon, MailIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const error = emailError(email);
  const shown = touched || submitted ? error : undefined;

  function handleSubmit(formData: FormData) {
    setSubmitted(true);
    if (error) return;
    formAction(formData);
  }

  return (
    <form action={handleSubmit} noValidate className="space-y-4">
      <Input
        label="Email address"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="name@company.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        onBlur={() => setTouched(true)}
        error={shown}
        leading={<MailIcon />}
      />

      <div aria-live="polite">
        {state?.error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-soft p-3.5 text-sm text-danger">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}
        {state?.success && (
          <div role="status" className="flex items-start gap-2.5 rounded-xl border border-success/30 bg-success-soft p-3.5 text-sm leading-relaxed text-success">
            <CheckCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{state.success}</span>
          </div>
        )}
      </div>

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {pending ? "Sending link" : "Send reset link"}
      </Button>
    </form>
  );
}
