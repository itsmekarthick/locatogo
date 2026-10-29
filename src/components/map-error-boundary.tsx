"use client";

import React, { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { MapIcon, RefreshIcon } from "@/components/ui/icons";

interface Props {
  children: ReactNode;
  fallbackText?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Map Canvas Error Caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="relative flex h-full w-full flex-col items-center justify-center bg-surface-2 p-6 text-center">
          <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-warning-soft text-[1.5rem] text-warning">
            <MapIcon />
          </div>
          <h3 className="font-display text-base font-semibold tracking-tight text-fg">Map view unavailable</h3>
          <p className="mt-1 max-w-xs text-sm text-fg-muted">
            {this.props.fallbackText || "The interactive map canvas encountered a rendering issue."}
          </p>
          <Button variant="secondary" size="sm" className="mt-4" leadingIcon={<RefreshIcon className="size-4" />} onClick={this.handleReset}>
            Reload map
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
