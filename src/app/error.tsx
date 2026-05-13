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
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="broadcast-theme min-h-screen bc-grain flex items-center justify-center px-4">
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
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center h-12 rounded-[18px] cta-primary px-7 text-sm font-bold text-[#0D0D0F]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}