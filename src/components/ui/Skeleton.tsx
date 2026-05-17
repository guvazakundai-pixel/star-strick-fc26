"use client";

import { useEffect, useState } from "react";

type SkeletonPulseProps = {
  className?: string;
  delay?: number;
};

export function SkeletonPulse({ className = "", delay = 0 }: SkeletonPulseProps) {
  const [visible, setVisible] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  if (!visible) return null;

  return (
    <div
      className={`skeleton ${className}`}
      aria-hidden="true"
      role="presentation"
    />
  );
}

export function SkeletonLine({ width = "60%", className = "" }: { width?: string; className?: string }) {
  return (
    <div
      className={`skeleton skeleton-text ${className}`}
      style={{ width }}
      aria-hidden="true"
      role="presentation"
    />
  );
}

export function SkeletonHeading({ width = "50%", className = "" }: { width?: string; className?: string }) {
  return (
    <div
      className={`skeleton skeleton-heading ${className}`}
      style={{ width }}
      aria-hidden="true"
      role="presentation"
    />
  );
}

export function SkeletonAvatar({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`skeleton skeleton-avatar ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
      role="presentation"
    />
  );
}

type SkeletonCardProps = {
  rows?: number;
  hasAvatar?: boolean;
  className?: string;
};

export function SkeletonCard({ rows = 2, hasAvatar = false, className = "" }: SkeletonCardProps) {
  return (
    <div className={`skeleton-card p-5 ${className}`} aria-hidden="true" role="presentation">
      <div className="flex items-center gap-3">
        {hasAvatar && <SkeletonAvatar size={48} />}
        <div className="flex-1 space-y-2.5">
          <SkeletonLine width="55%" />
          {rows > 1 && <SkeletonLine width="80%" />}
        </div>
      </div>
    </div>
  );
}

type SkeletonGridProps = {
  count?: number;
  columns?: number;
  cardType?: "player" | "stat" | "match";
};

export function SkeletonGrid({ count = 6, columns = 3, cardType = "player" }: SkeletonGridProps) {
  const colClass = columns === 2 ? "grid-cols-1 md:grid-cols-2" : columns === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1";

  return (
    <div className={`grid gap-4 sm:gap-5 ${colClass} skeleton-stagger`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
          {cardType === "player" ? (
            <PlayerSkeletonContent />
          ) : cardType === "stat" ? (
            <StatSkeletonContent />
          ) : (
            <MatchSkeletonContent />
          )}
        </div>
      ))}
    </div>
  );
}

function PlayerSkeletonContent() {
  return (
    <div className="p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <SkeletonAvatar size={56} />
        <div className="flex-1 min-w-0 space-y-2.5">
          <SkeletonLine width="65%" />
          <SkeletonLine width="40%" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="space-y-1.5">
          <SkeletonLine width="50%" />
          <SkeletonLine width="70%" />
        </div>
        <div className="space-y-1.5">
          <SkeletonLine width="40%" />
          <SkeletonLine width="60%" />
        </div>
        <div className="space-y-1.5">
          <SkeletonLine width="45%" />
          <SkeletonLine width="55%" />
        </div>
      </div>
    </div>
  );
}

function StatSkeletonContent() {
  return (
    <div className="p-5 space-y-3">
      <SkeletonAvatar size={20} />
      <SkeletonLine width="50%" />
      <SkeletonHeading width="70%" />
    </div>
  );
}

function MatchSkeletonContent() {
  return (
    <div className="p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonLine width="30%" />
        <SkeletonLine width="20%" />
      </div>
      <div className="flex items-center justify-center gap-8">
        <div className="text-center space-y-2">
          <SkeletonAvatar size={48} />
          <SkeletonLine width="60%" />
        </div>
        <div className="skeleton skeleton-heading" style={{ width: 24, height: 24 }} />
        <div className="text-center space-y-2">
          <SkeletonAvatar size={48} />
          <SkeletonLine width="60%" />
        </div>
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="broadcast-theme min-h-screen bc-grain" aria-hidden="true" role="presentation">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16 space-y-8">
        <div className="space-y-4">
          <div className="skeleton rounded-full" style={{ width: 120, height: 28 }} />
          <SkeletonHeading width="75%" />
          <SkeletonLine width="50%" />
        </div>
        <div className="skeleton-card p-6 sm:p-8 rounded-[28px] space-y-4">
          <SkeletonHeading width="60%" />
          <SkeletonLine width="80%" />
          <div className="flex gap-3 mt-4">
            <div className="skeleton rounded-[18px]" style={{ width: 160, height: 48 }} />
            <div className="skeleton rounded-[18px]" style={{ width: 140, height: 48 }} />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 skeleton-stagger">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-card p-5 rounded-[22px] space-y-3" style={{ animationDelay: `${i * 60}ms` }}>
              <SkeletonLine width="40%" />
              <SkeletonHeading width="60%" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RankingsSkeleton() {
  return (
    <div className="broadcast-theme min-h-screen bc-grain bc-noise" aria-hidden="true" role="presentation">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <div className="space-y-2">
          <div className="skeleton rounded-full" style={{ width: 80, height: 20 }} />
          <SkeletonHeading width="60%" />
        </div>
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton rounded-full" style={{ width: 64, height: 32 }} />
          ))}
        </div>
        <div className="space-y-2.5 skeleton-stagger">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton-card p-4 rounded-[20px] flex items-center gap-4" style={{ animationDelay: `${i * 55}ms` }}>
              <SkeletonAvatar size={48} />
              <div className="flex-1 min-w-0 space-y-2.5">
                <SkeletonLine width="55%" />
                <SkeletonLine width="75%" />
              </div>
              <div className="skeleton skeleton-heading" style={{ width: 56, height: 24 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}