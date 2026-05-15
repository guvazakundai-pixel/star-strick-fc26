"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalErrorBoundary]", error);
  }, [error]);

  return (
    <div className="broadcast-theme min-h-screen bc-grain flex items-center justify-center px-4" suppressHydrationWarning>
      <div className="text-center space-y-6 max-w-md">
        <div
          className="mx-auto h-24 w-24 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(255,77,77,0.04)",
            border: "1px solid rgba(255,77,77,0.10)",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-negative/60">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="bc-headline text-3xl text-ink">Something went wrong</h1>
          <p className="text-muted leading-relaxed">
            An unexpected error occurred. Please try again.
          </p>
          {error?.message && process.env.NODE_ENV === "development" && (
            <p className="text-xs text-negative/60 font-mono mt-2 break-all">
              {error.message}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary rounded-[14px] px-7 h-12 text-sm"
          >
            Try Again
          </button>
          <a
            href="/"
            className="btn-ghost rounded-[14px] px-7 h-12 text-sm inline-flex items-center justify-center"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}