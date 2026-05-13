"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[280px] px-6 text-center space-y-4">
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-muted-soft">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h3 className="bc-headline text-xl text-ink">Something went wrong</h3>
            <p className="text-sm text-muted max-w-xs">
              This section couldn&apos;t load. Try refreshing the page.
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-[14px] cta-primary px-6 py-2.5 text-sm font-bold text-[#0D0D0F]"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}