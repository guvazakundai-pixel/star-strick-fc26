"use client";

import { useAuthModal } from "@/lib/auth-context";

export function SignInButton() {
  const { openAuth } = useAuthModal();

  return (
    <button
      onClick={() => openAuth("signin")}
      className="hidden sm:inline-flex rounded border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink hover:bg-surface-2"
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
      className={className ?? "rounded bg-[#00ff85] px-5 py-2.5 font-bold uppercase tracking-wider text-[#050505] hover:bg-white transition"}
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
      className={className ?? "rounded bg-[#00ff85] px-5 py-2.5 font-bold uppercase tracking-wider text-[#050505] hover:bg-white transition"}
    >
      Enter Rankings
    </button>
  );
}