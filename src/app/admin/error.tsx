"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertCircleIcon, RefreshIcon } from "@/components/ui/icons";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Workspace Error:", error);
  }, [error]);

  return (
    <div role="alert" className="flex min-h-[60vh] items-center justify-center px-4 text-center">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface-1 p-8 elev-md">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-danger-soft text-[1.75rem] text-danger">
          <AlertCircleIcon />
        </span>
        <h2 className="mt-5 font-display text-xl font-semibold tracking-tight text-fg">This view couldn&apos;t load</h2>
        <p className="mt-2 text-sm text-fg-muted">Something went wrong fetching this administrative view. Your data is safe; try again in a moment.</p>
        {error.digest && <p className="mt-3 font-mono text-xs text-fg-subtle">Reference {error.digest}</p>}

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button onClick={() => reset()} leadingIcon={<RefreshIcon className="size-4" />} fullWidth className="sm:w-auto">
            Retry
          </Button>
          <Link href="/admin" className={buttonVariants({ variant: "secondary", fullWidth: true, className: "sm:w-auto" })}>
            Admin overview
          </Link>
        </div>
      </div>
    </div>
  );
}
