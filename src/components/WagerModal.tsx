"use client";

import { useState, useTransition } from "react";
import { useAuthModal } from "@/lib/auth-context";

interface WagerModalProps {
  opponentId: string;
  opponentName: string;
  onClose: () => void;
  onDone: () => void;
}

export function WagerModal({ opponentId, opponentName, onClose, onDone }: WagerModalProps) {
  const [amount, setAmount] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { openAuth } = useAuthModal();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const meRes = await fetch("/api/auth/me");
    if (!meRes.ok) { openAuth("signin"); return; }

    const res = await fetch("/api/wagers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: opponentId, amount: amount * 100 }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Failed to create wager");
      return;
    }
    startTransition(onDone);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ background: "rgba(10,10,12,0.82)", backdropFilter: "blur(12px)" }}>
      <div className="w-full max-w-sm rounded-[24px] border border-border-faint bg-bg-elevated/95 backdrop-blur-2xl p-6" style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.50)" }}>
        <h3 className="cinematic-heading text-xl text-ink mb-1">Challenge Wager</h3>
        <p className="text-sm text-muted-soft mb-4">vs {opponentName}</p>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-[12px] border border-negative/25 px-3 py-2.5 text-sm text-negative/90 bg-negative/6">{error}</div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">Wager Amount (USD)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted-soft text-sm">$</span>
              <input
                type="number"
                min={1}
                max={50}
                step={0.5}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full apple-input pl-7 pr-3 py-2.5 text-ink text-sm"
              />
            </div>
            <p className="text-[10px] text-muted-faint mt-1">Min $1 · Max $50 · 5% platform fee</p>
          </div>

          <div className="rounded-[12px] bg-bg-highlight/40 border border-border-faint px-3 py-2.5">
            <div className="flex justify-between text-sm text-ink">
              <span>Wager</span>
              <span className="font-mono tabular-nums">${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-soft mt-1">
              <span>Winner receives</span>
              <span className="font-mono tabular-nums">${(amount * 2 * 0.95).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-faint mt-0.5">
              <span>Platform fee (5%)</span>
              <span className="font-mono tabular-nums">${(amount * 2 * 0.05).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 h-11 rounded-[14px] font-bold text-[11px] tracking-[0.18em] uppercase bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 hover:border-accent/30 active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              {pending ? "Sending..." : `Send Wager — $${amount.toFixed(2)}`}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 rounded-[14px] font-bold text-[11px] tracking-[0.18em] uppercase text-muted-soft hover:text-ink border border-border-faint hover:border-border-strong transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
