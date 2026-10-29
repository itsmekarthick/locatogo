"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { PasswordField } from "@/app/auth/password-field";
import { emailError, nameError, passwordError } from "@/app/auth/validation";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, CheckCircleIcon, MailIcon, UserIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/validation/directory";

type AuthAction = (state: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;

type Values = { displayName: string; email: string; password: string };
type Field = keyof Values;

export function AuthForm({ action, signup = false }: { action: AuthAction; signup?: boolean }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  // Controlled values survive the form reset React applies after an action finishes.
  const [values, setValues] = useState<Values>({ displayName: "", email: "", password: "" });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors: Partial<Record<Field, string>> = {
    ...(signup ? { displayName: nameError(values.displayName) } : {}),
    email: emailError(values.email),
    password: passwordError(values.password),
  };
  const visibleError = (field: Field) => (touched[field] || submitted ? errors[field] : undefined);

  const update = (field: Field) => (event: React.ChangeEvent<HTMLInputElement>) => setValues((prev) => ({ ...prev, [field]: event.target.value }));
  const blur = (field: Field) => () => setTouched((prev) => ({ ...prev, [field]: true }));

  function handleSubmit(formData: FormData) {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    formAction(formData);
  }

  const passwordLongEnough = values.password.length >= 8;

  return (
    <form ref={formRef} action={handleSubmit} noValidate className="space-y-4">
      {signup && (
        <Input
          label="Full name"
          name="displayName"
          required
          autoComplete="name"
          placeholder="Jordan Miller"
          value={values.displayName}
          onChange={update("displayName")}
          onBlur={blur("displayName")}
          error={visibleError("displayName")}
          leading={<UserIcon />}
        />
      )}

      <Input
        label="Email address"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="name@company.com"
        value={values.email}
        onChange={update("email")}
        onBlur={blur("email")}
        error={visibleError("email")}
        leading={<MailIcon />}
      />

      <div>
        <PasswordField
          label="Password"
          name="password"
          required
          autoComplete={signup ? "new-password" : "current-password"}
          placeholder="At least 8 characters"
          value={values.password}
          onChange={update("password")}
          onBlur={blur("password")}
          error={visibleError("password")}
          hint={signup ? "Use at least 8 characters." : undefined}
        />
        {signup && values.password && (
          <p className={`mt-1.5 flex items-center gap-1.5 text-[13px] ${passwordLongEnough ? "text-success" : "text-fg-subtle"}`}>
            <CheckCircleIcon className="size-3.5" />
            {passwordLongEnough ? "Long enough" : `${8 - values.password.length} more to go`}
          </p>
        )}
        {!signup && (
          <div className="mt-2 text-right">
            <Link href="/auth/forgot-password" prefetch={false} className="focus-ring rounded text-sm font-medium text-accent-text hover:underline">
              Forgot password?
            </Link>
          </div>
        )}
      </div>

      <div aria-live="polite">
        {state?.error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-soft p-3.5 text-sm text-danger">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}
        {state?.success && (
          <div role="status" className="flex items-start gap-2.5 rounded-xl border border-success/30 bg-success-soft p-3.5 text-sm text-success">
            <CheckCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{state.success}</span>
          </div>
        )}
      </div>

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {pending ? (signup ? "Creating account" : "Signing in") : signup ? "Create free account" : "Sign in"}
      </Button>
    </form>
  );
}
