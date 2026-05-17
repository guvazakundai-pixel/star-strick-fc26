"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Props = {
  matchId: string;
  matchStatus: string;
  player1Id: string;
  player2Id: string;
  currentUserId: string | undefined;
  onScoreSubmitted?: () => void;
};

export function MatchValidationFlow({ matchId, matchStatus, player1Id, player2Id, currentUserId, onScoreSubmitted }: Props) {
  const [myScore, setMyScore] = useState("");
  const [oppScore, setOppScore] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPlayer1 = currentUserId === player1Id;
  const isPlayer2 = currentUserId === player2Id;
  const isParticipant = isPlayer1 || isPlayer2;

  if (!isParticipant || matchStatus !== "PENDING" || submitted) return null;

  const handleSubmit = async () => {
    if (!myScore || !oppScore) { setError("Enter both scores"); return; }
    const s1 = parseInt(myScore);
    const s2 = parseInt(oppScore);
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) { setError("Invalid scores"); return; }
    setSubmitting(true);
    setError(null);

    try {
      let screenshotUrl: string | null = null;

      if (screenshot) {
        const formData = new FormData();
        formData.append("file", screenshot);
        formData.append("upload_preset", "ml_default");
        const uploadRes = await fetch("https://api.cloudinary.com/v1_1/demo/image/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          screenshotUrl = uploadData.secure_url;
        }
      }

      const res = await fetch(`/api/matches/${matchId}/submit-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score1: isPlayer1 ? s1 : s2,
          score2: isPlayer1 ? s2 : s1,
          screenshotUrl,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        onScoreSubmitted?.();
      } else {
        const err = await res.json();
        setError(err.error || "Failed to submit score");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-accent p-5 rounded-[20px] mt-4"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-accent mb-3">Submit Your Score</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Your Score</label>
          <input
            type="number"
            min="0"
            max="99"
            value={myScore}
            onChange={(e) => setMyScore(e.target.value)}
            className="w-full mt-1 px-4 py-3 rounded-[14px] text-lg font-bold text-ink text-center font-mono tabular-nums outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          />
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Opponent Score</label>
          <input
            type="number"
            min="0"
            max="99"
            value={oppScore}
            onChange={(e) => setOppScore(e.target.value)}
            className="w-full mt-1 px-4 py-3 rounded-[14px] text-lg font-bold text-ink text-center font-mono tabular-nums outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Screenshot (optional)</label>
        <div className="mt-1">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
            className="w-full text-xs text-muted-soft file:mr-3 file:py-2 file:px-4 file:rounded-[10px] file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-wider file:text-black"
            style={{ file: { background: "var(--accent)" } } as any}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-[12px] px-3 py-2 text-xs text-negative mb-3" style={{ background: "rgba(255,77,77,0.08)" }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 rounded-[14px] font-bold text-sm uppercase tracking-wider text-black disabled:opacity-50 transition-all"
        style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,255,133,0.2)" }}
      >
        {submitting ? "Submitting..." : "Submit Score"}
      </button>

      <p className="text-[10px] text-muted-faint text-center mt-2">
        Your opponent will need to confirm this result
      </p>
    </motion.div>
  );
}
