"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function ClientOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback || <div className="min-h-[120px]" />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}