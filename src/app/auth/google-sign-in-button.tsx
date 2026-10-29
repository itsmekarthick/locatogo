"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GoogleLogo } from "@/components/ui/brand-logos";
import { AlertCircleIcon } from "@/components/ui/icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function GoogleSignInButton({
  text = "Continue with Google",
}: {
  text?: string;
  next?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const supabase = createSupabaseBrowserClient();
      const origin = window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to start Google sign-in.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        fullWidth
        loading={isLoading}
        leadingIcon={isLoading ? undefined : <GoogleLogo className="size-5" />}
        onClick={handleGoogleSignIn}
      >
        {isLoading ? "Connecting to Google" : text}
      </Button>

      <div aria-live="polite">
        {errorMsg && (
          <p role="alert" className="flex items-start gap-1.5 text-[13px] text-danger">
            <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}
