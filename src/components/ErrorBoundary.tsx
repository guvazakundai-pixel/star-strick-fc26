"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  scope?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const scopeLabel = this.props.scope ? `[${this.props.scope}]` : "[App]";
    console.error(`${scopeLabel} ErrorBoundary caught:`, error);
    console.error(`${scopeLabel} Component stack:`, errorInfo.componentStack);

    this.setState({ errorInfo });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      try {
        const payload = {
          message: error.message,
          stack: error.stack?.slice(0, 500),
          componentStack: errorInfo.componentStack?.slice(0, 500),
          scope: this.props.scope || "unknown",
          url: window.location.href,
          timestamp: new Date().toISOString(),
        };
        navigator.sendBeacon?.("/api/admin/error-log", JSON.stringify(payload));
      } catch {}
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const scope = this.props.scope;
      const message = this.state.error?.message || "An unexpected error occurred";
      const isDataError = /fetch|network|database|query|rows|undefined|null/i.test(message);

      return (
        <div className="flex flex-col items-center justify-center min-h-[280px] px-6 text-center space-y-5">
          <div
            className="h-20 w-20 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,77,77,0.06)",
              border: "1px solid rgba(255,77,77,0.12)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-9 w-9 text-negative/70">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="bc-headline text-xl text-ink">
              {isDataError ? "Failed to load data" : "Something went wrong"}
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              {isDataError
                ? "We couldn't fetch the latest data. This might be a temporary issue."
                : "An unexpected error occurred. Please try again."}
            </p>
            {scope && (
              <p className="text-[10px] font-mono text-muted-faint tracking-wider uppercase">
                {scope}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={this.handleRetry}
              className="btn-primary rounded-[14px] px-6 py-2.5 text-sm"
            >
              Try Again
            </button>
            <a
              href="/"
              className="btn-ghost rounded-[14px] px-6 py-2.5 text-sm"
            >
              Go Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ScopedErrorBoundary({
  scope,
  label,
  children,
}: {
  scope: string;
  label?: string;
  children: ReactNode;
}) {
  return (
    <ErrorBoundary
      scope={scope}
      fallback={
        <div
          className="frosted-card-sm p-6 rounded-[22px] text-center space-y-3"
          role="alert"
          aria-live="polite"
        >
          <div
            className="mx-auto h-12 w-12 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,77,77,0.06)",
              border: "1px solid rgba(255,77,77,0.10)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6 text-negative/60">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <p className="text-sm text-muted">
            Failed to load{label ? ` ${label}` : ""}.{" "}
            <button
              onClick={() => window.location.reload()}
              className="text-accent hover:underline underline-offset-2"
            >
              Retry
            </button>
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}