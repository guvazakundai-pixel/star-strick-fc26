"use client";

import { useAuthModal } from "@/lib/auth-context";

export function SignInButton() {
  const { openAuth } = useAuthModal();

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

  return (
    <button
      onClick={() => openAuth("join")}
      className={className ?? "rounded-[14px] cta-primary px-5 py-2.5 font-bold uppercase tracking-wider"}
    >
      Enter Rankings
    </button>
  );
}