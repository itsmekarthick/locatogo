"use client";

import React, { Component, type ReactNode } from "react";

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
        <div className="relative flex h-full w-full flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-xl mb-3">
            🗺️
          </div>
          <h3 className="font-serif text-base font-bold text-slate-900 dark:text-slate-100">
            Map View Unavailable
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            {this.props.fallbackText || "The interactive map canvas encountered a rendering issue."}
          </p>
          <button
            onClick={this.handleReset}
            className="mt-4 rounded-full bg-[#06b6d4] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#0891b2] transition-colors cursor-pointer"
          >
            ↻ Reload Map
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
