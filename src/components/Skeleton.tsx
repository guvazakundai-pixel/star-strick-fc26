import type { ReactNode } from "react";

export function PageSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-4">
          <div className="h-6 w-28 rounded-full bc-skeleton" />
          <div className="h-16 w-3/4 bc-skeleton rounded-2xl" />
          <div className="h-4 w-1/2 bc-skeleton rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bc-skeleton-card p-5 rounded-[24px] space-y-3">
              <div className="bc-skeleton h-4 w-16 rounded" />
              <div className="bc-skeleton h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bc-skeleton-card p-4 rounded-[20px] flex items-center gap-4">
              <div className="bc-skeleton h-12 w-12 rounded-[14px]" />
              <div className="flex-1 space-y-2">
                <div className="bc-skeleton h-4 w-2/5 rounded" />
                <div className="bc-skeleton h-3 w-3/5 rounded" />
              </div>
              <div className="bc-skeleton h-6 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        <div className="bc-skeleton-card rounded-[28px] p-6 flex items-center gap-4">
          <div className="bc-skeleton h-20 w-20 rounded-[20px]" />
          <div className="flex-1 space-y-3">
            <div className="bc-skeleton h-6 w-40 rounded" />
            <div className="bc-skeleton h-3 w-60 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bc-skeleton-card p-4 rounded-[22px] space-y-2">
              <div className="bc-skeleton h-3 w-12 rounded" />
              <div className="bc-skeleton h-7 w-16 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bc-skeleton-card p-3 rounded-[16px] text-center space-y-1">
              <div className="bc-skeleton h-5 w-8 rounded mx-auto" />
              <div className="bc-skeleton h-2 w-10 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ErrorFallback({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] px-6 text-center space-y-4">
      <div
        className="h-20 w-20 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(255,77,77,0.06)",
          border: "1px solid rgba(255,77,77,0.12)",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-9 w-9 text-negative/70">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      </div>
      <div className="space-y-1.5">
        <h3 className="bc-headline text-2xl text-ink">Failed to load</h3>
        <p className="text-sm text-muted max-w-xs">
          {message || "Something went wrong. Please try again."}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-[14px] cta-primary px-6 py-2.5 text-sm font-bold text-[#0D0D0F]"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="glass p-12 text-center space-y-4">
      <div
        className="mx-auto h-16 w-16 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {icon || (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="h-8 w-8 text-muted-soft">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
          </svg>
        )}
      </div>
      <h3 className="bc-headline text-2xl text-ink">{title}</h3>
      <p className="text-sm text-muted leading-relaxed max-w-sm mx-auto">{description}</p>
      {action}
    </div>
  );
}