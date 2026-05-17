"use client";

import { useAuthModal, useUser } from "@/lib/auth-context";
import Link from "next/link";

export function SignInButton() {
  const { openAuth } = useAuthModal();
  const { isAuthenticated, loading } = useUser();

  if (loading) return <div className="h-7 w-20 rounded-[10px] bg-white/5 animate-pulse" />;

  if (isAuthenticated) {
    return (
      <Link
        href="/dashboard"
        className="hidden sm:inline-flex rounded-[10px] border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-soft hover:bg-bg-highlight hover:text-ink transition-all duration-200"
      >
        Dashboard
      </Link>
    );
  }

  return (
    <button
      onClick={() => openAuth("signin")}
      className="hidden sm:inline-flex rounded-[10px] border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-soft hover:bg-bg-highlight hover:text-ink transition-all duration-200"
    >
      Sign in
    </button>
  );
}

export function JoinButton({ className }: { className?: string }) {
  const { openAuth } = useAuthModal();
  const { isAuthenticated, loading } = useUser();

  if (loading) return <div className="h-10 w-24 rounded-[14px] bg-white/5 animate-pulse" />;

  if (isAuthenticated) {
    return (
      <Link
        href="/dashboard"
        className={className ?? "rounded-[14px] cta-primary px-5 py-2.5 font-bold uppercase tracking-wider inline-flex items-center justify-center"}
      >
        Dashboard
      </Link>
    );
  }

  return (
    <button
      onClick={() => openAuth("join")}
      className={className ?? "rounded-[14px] cta-primary px-5 py-2.5 font-bold uppercase tracking-wider"}
    >
      Join
    </button>
  );
}

export function EnterRankingsButton({ className }: { className?: string }) {
  const { openAuth } = useAuthModal();
  const { isAuthenticated, loading } = useUser();

  if (loading) return <div className="h-10 w-32 rounded-[14px] bg-white/5 animate-pulse" />;

  if (isAuthenticated) {
    return (
      <Link
        href="/rankings"
        className={className ?? "rounded-[14px] cta-primary px-5 py-2.5 font-bold uppercase tracking-wider inline-flex items-center justify-center"}
      >
        View Rankings
      </Link>
    );
  }

  return (
    <button
      onClick={() => openAuth("join")}
      className={className ?? "rounded-[14px] cta-primary px-5 py-2.5 font-bold uppercase tracking-wider"}
    >
      Join to Compete
    </button>
  );
}