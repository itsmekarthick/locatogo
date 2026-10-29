"use client";

import { Component, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, RefreshIcon } from "@/components/ui/icons";

export function ModuleError({ title, onRetry }: { title: string; onRetry?: () => void }) {
  const router = useRouter();

  return (
    <div role="alert" className="rounded-2xl border border-line bg-surface-1 p-5 elev-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-danger-soft text-[1.15rem] text-danger">
          <AlertCircleIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold tracking-tight text-fg">{title} is unavailable</p>
          <p className="mt-0.5 text-sm text-fg-muted">Something went wrong loading this section. The rest of the page is unaffected.</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            leadingIcon={<RefreshIcon className="size-4" />}
            onClick={() => {
              onRetry?.();
              router.refresh();
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}

type Props = { title: string; children: ReactNode };
type State = { failed: boolean; attempt: number };

/** Keeps one failing module from taking down the whole detail page. */
export class ModuleBoundary extends Component<Props, State> {
  state: State = { failed: false, attempt: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  retry = () => this.setState((prev) => ({ failed: false, attempt: prev.attempt + 1 }));

  render() {
    if (this.state.failed) return <ModuleError title={this.props.title} onRetry={this.retry} />;
    return <div key={this.state.attempt} className="contents">{this.props.children}</div>;
  }
}
