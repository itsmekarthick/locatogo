"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon, LockIcon } from "@/components/ui/icons";
import { Input, type InputProps } from "@/components/ui/input";

type PasswordFieldProps = Omit<InputProps, "type" | "leading" | "trailing"> & { name: string };

/** Password input with a show/hide toggle. */
export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      leading={<LockIcon />}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="focus-ring grid size-8 place-items-center rounded-lg text-lg text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg pointer-coarse:size-10"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}
