"use client";

import { useState } from "react";
import { useAuthModal } from "@/lib/auth-context";
import { useSession } from "@/lib/session-client";

export function ConfirmMatchButton({
  matchId,
  player1Id,
  player2Id,
  submittedById,
}: {
  matchId: string;
  player1Id: string;
  player2Id: string;
  submittedById: string;
}) {
  const session = useSession();
  const { openAuth } = useAuthModal();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!session) {
    return (
      <div className="text-center">
        <button
          onClick={() => openAuth("signin")}
          className="inline-flex items-center justify-center h-12 rounded-[14px] cta-primary px-6 text-sm font-bold tracking-wider"
        >
          Sign In to Confirm
        </button>
      </div>
    );
  }

  const isPlayer = session.userId === player1Id || session.userId === player2Id;
  const isSubmitter = session.userId === submittedById;

  if (!isPlayer) {
    return (
      <div className="frosted-card-sm p-4 text-center">
        <p className="text-sm text-muted-soft">Only match participants can confirm results.</p>
      </div>
    );
  }

  if (isSubmitter) {
    return (
      <div className="frosted-card-sm p-4 text-center">
        <p className="text-sm text-muted-soft">You submitted this match. Waiting for opponent confirmation.</p>
      </div>
    );
  }

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: "Match confirmed successfully!" });
      } else {
        setResult({ ok: false, message: data.error || "Failed to confirm match" });
      }
    } catch {
      setResult({ ok: false, message: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="frosted-card-sm p-4 text-center">
        <p className={`text-sm font-semibold ${result.ok ? "text-accent" : "text-negative"}`}>
          {result.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-center">
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="inline-flex items-center justify-center h-12 rounded-[14px] cta-primary px-8 text-sm font-bold tracking-wider disabled:opacity-50 bc-pulse-cta"
      >
        {loading ? "Confirming..." : "Confirm Result"}
      </button>
      <p className="text-[10px] text-muted-soft">Confirm that the reported score is correct</p>
    </div>
  );
}