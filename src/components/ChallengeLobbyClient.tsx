"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthModal } from "@/lib/auth-context";

type MatchResult = {
  id: string;
  challenge_id: string;
  submitted_by: string;
  challenger_score: number;
  opponent_score: number;
  screenshot_url: string | null;
  notes: string | null;
  submitted_at: string;
  counter_submitted_by: string | null;
  counter_challenger_score: number | null;
  counter_opponent_score: number | null;
  counter_screenshot_url: string | null;
  counter_notes: string | null;
  dispute_reason: string | null;
  final_challenger_score: number | null;
  final_opponent_score: number | null;
  resolved_by: string | null;
};

type ChallengeData = {
  id: string;
  challenge_code: string;
  challenger_id: string;
  opponent_id: string;
  status: string;
  platform: string | null;
  game_mode: string | null;
  message: string | null;
  created_at: string;
  accepted_at: string | null;
  resolved_at: string | null;
  challenger_username: string;
  challenger_display: string | null;
  challenger_avatar: string | null;
  opponent_username: string;
  opponent_display: string | null;
  opponent_avatar: string | null;
  challenger_rank: number | null;
  challenger_points: number | null;
  opponent_rank: number | null;
  opponent_points: number | null;
  matchResult: MatchResult | null;
  results: Record<string, unknown>[];
};

type Props = {
  code: string;
  initialChallenge: ChallengeData | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  PENDING_ACCEPTANCE: { label: "Waiting for Acceptance", color: "#ffb800", icon: "⏳" },
  MATCH_READY: { label: "Match Ready — Play Now", color: "#00ff85", icon: "⚔" },
  AWAITING_VERIFICATION: { label: "Awaiting Verification", color: "#22d3ee", icon: "📋" },
  VERIFIED: { label: "Match Verified", color: "#00ff85", icon: "✓" },
  DISPUTED: { label: "Under Admin Review", color: "#ff4d4d", icon: "⚠" },
  ADMIN_REVIEW: { label: "Admin Review", color: "#ff4d4d", icon: "⚠" },
  RESOLVED: { label: "Resolved by Admin", color: "#00ff85", icon: "✓" },
  CANCELLED: { label: "Cancelled", color: "#8E909A", icon: "✕" },
  EXPIRED: { label: "Expired", color: "#8E909A", icon: "⏰" },
};

export function ChallengeLobbyClient({ code, initialChallenge }: Props) {
  const [challenge, setChallenge] = useState<ChallengeData | null>(initialChallenge);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Score submission fields
  const [myScore, setMyScore] = useState("");
  const [theirScore, setTheirScore] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [notes, setNotes] = useState("");

  // Dispute reason
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeCategory, setDisputeCategory] = useState("Incorrect Score");
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  // Adjust counter-submission
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjMyScore, setAdjMyScore] = useState("");
  const [adjTheirScore, setAdjTheirScore] = useState("");
  const [adjScreenshot, setAdjScreenshot] = useState("");
  const [adjNotes, setAdjNotes] = useState("");

  const { openAuth } = useAuthModal();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) {
          setLoggedIn(true);
          setUserId(d.user.id);
        }
      })
      .catch(() => {});
  }, []);

  // Poll for status changes
  useEffect(() => {
    if (!challenge) return;
    const terminalStatuses = ["VERIFIED", "RESOLVED", "CANCELLED", "EXPIRED"];
    if (terminalStatuses.includes(challenge.status)) return;

    const interval = setInterval(() => {
      fetch(`/api/challenges/${code}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.challenge) setChallenge(d.challenge);
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [code, challenge?.status]);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/challenges/${code}`).then((r) => r.json());
    if (res.challenge) setChallenge(res.challenge);
  }, [code]);

  const ensureAuth = useCallback((): boolean => {
    if (!loggedIn) {
      openAuth("signin");
      return false;
    }
    return true;
  }, [loggedIn, openAuth]);

  // ─── Accept ───
  const handleAccept = useCallback(async () => {
    if (!ensureAuth()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/challenges/accept/${code}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept");
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [code, ensureAuth, refresh]);

  // ─── Reject ───
  const handleReject = useCallback(async () => {
    if (!ensureAuth()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/challenges/decline/${code}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject");
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [code, ensureAuth, refresh]);

  // ─── Submit result ───
  const handleSubmitResult = useCallback(async () => {
    if (!ensureAuth()) return;
    const my = parseInt(myScore);
    const their = parseInt(theirScore);
    if (isNaN(my) || isNaN(their) || my < 0 || their < 0 || my > 20 || their > 20) {
      setError("Invalid scores (0-20)");
      return;
    }

    // Determine challenger vs opponent score based on who is submitting
    const isChallenger = userId === challenge?.challenger_id;
    const cScore = isChallenger ? my : their;
    const oScore = isChallenger ? their : my;

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/results/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          challengerScore: cScore,
          opponentScore: oScore,
          screenshotUrl: screenshotUrl || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setSuccess("Result submitted! Waiting for opponent verification.");
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [code, myScore, theirScore, screenshotUrl, notes, ensureAuth, userId, challenge, refresh]);

  // ─── Verify / Accept result ───
  const handleVerify = useCallback(async () => {
    if (!ensureAuth()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/results/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify");
      setSuccess("Match verified! Rankings updated.");
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [code, ensureAuth, refresh]);

  // ─── Dispute result ───
  const handleDispute = useCallback(async () => {
    if (!ensureAuth()) return;
    const reason = `${disputeCategory}: ${disputeReason}`;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/results/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispute");
      setShowDisputeModal(false);
      setSuccess("Result disputed. Admin will review.");
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [code, disputeCategory, disputeReason, ensureAuth, refresh]);

  // ─── Adjust result ───
  const handleAdjust = useCallback(async () => {
    if (!ensureAuth()) return;
    const adjMy = parseInt(adjMyScore);
    const adjTheir = parseInt(adjTheirScore);
    if (isNaN(adjMy) || isNaN(adjTheir) || adjMy < 0 || adjTheir < 0 || adjMy > 20 || adjTheir > 20) {
      setError("Invalid scores (0-20)");
      return;
    }

    const isChallenger = userId === challenge?.challenger_id;
    const cScore = isChallenger ? adjMy : adjTheir;
    const oScore = isChallenger ? adjTheir : adjMy;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/results/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          challengerScore: cScore,
          opponentScore: oScore,
          screenshotUrl: adjScreenshot || undefined,
          notes: adjNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit adjustment");
      setShowAdjustForm(false);
      setSuccess("Your version submitted. Admin will review both submissions.");
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [code, adjMyScore, adjTheirScore, adjScreenshot, adjNotes, ensureAuth, userId, challenge, refresh]);

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0c0c10" }}>
        <div className="text-center">
          <p className="text-4xl mb-4">⚔</p>
          <h1 className="text-2xl font-bold text-white mb-2">Challenge Not Found</h1>
          <p className="text-gray-400 text-sm">This challenge doesn&apos;t exist or has expired.</p>
        </div>
      </div>
    );
  }

  const isChallenger = userId === challenge.challenger_id;
  const isOpponent = userId === challenge.opponent_id;
  const isParticipant = isChallenger || isOpponent;
  const config = STATUS_CONFIG[challenge.status] || STATUS_CONFIG.PENDING_ACCEPTANCE;
  const cName = challenge.challenger_display || challenge.challenger_username;
  const oName = challenge.opponent_display || challenge.opponent_username;
  const matchResult = challenge.matchResult;
  const isSubmitter = matchResult?.submitted_by === userId;
  const isVerifier = matchResult && !isSubmitter && isParticipant;
  const hasCounter = !!matchResult?.counter_submitted_by;
  const status = challenge.status;

  // Determine score display
  const displayScore = matchResult
    ? `${matchResult.challenger_score} - ${matchResult.opponent_score}`
    : null;

  return (
    <div className="min-h-screen" style={{ background: "#0c0c10" }}>
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Status badge */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-2xl">{config.icon}</span>
          <span className="text-xs font-black tracking-[0.2em] uppercase" style={{ color: config.color }}>
            {config.label}
          </span>
        </div>

        {/* VS Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex-1 text-right">
              <p className="text-lg font-bold text-white uppercase tracking-wide">{cName}</p>
              {challenge.challenger_rank && (
                <p className="text-xs text-gray-400">
                  #{challenge.challenger_rank} · {challenge.challenger_points || 0} PTS
                </p>
              )}
            </div>
            <div className="text-3xl font-black" style={{ color: "#00ff85" }}>
              VS
            </div>
            <div className="flex-1 text-left">
              <p className="text-lg font-bold text-white uppercase tracking-wide">{oName}</p>
              {challenge.opponent_rank && (
                <p className="text-xs text-gray-400">
                  #{challenge.opponent_rank} · {challenge.opponent_points || 0} PTS
                </p>
              )}
            </div>
          </div>
          {challenge.platform && (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={{ background: "rgba(0,255,133,0.08)", color: "#00ff85", border: "1px solid rgba(0,255,133,0.15)" }}>
              {challenge.platform}
            </span>
          )}
          {challenge.game_mode && (
            <span className="inline-block ml-2 px-3 py-1 rounded-full text-xs text-gray-400" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {challenge.game_mode}
            </span>
          )}
        </div>

        {/* Challenge code */}
        <div className="rounded-2xl border border-white/5 p-4 mb-6 text-center" style={{ background: "rgba(18,20,24,0.6)" }}>
          <p className="text-[9px] font-black tracking-[0.22em] text-gray-500 uppercase mb-1">Challenge ID</p>
          <p className="text-2xl font-mono font-black tracking-[0.3em]" style={{ color: "#22d3ee" }}>
            {challenge.challenge_code}
          </p>
          {challenge.message && (
            <p className="text-sm text-gray-400 mt-2 italic">&ldquo;{challenge.message}&rdquo;</p>
          )}
        </div>

        {/* Score display */}
        {displayScore && status !== "MATCH_READY" && (
          <div className="rounded-2xl border border-white/5 p-4 mb-6 text-center" style={{ background: "rgba(18,20,24,0.6)" }}>
            <p className="text-[9px] font-black tracking-[0.22em] text-gray-500 uppercase mb-1">Score</p>
            <p className="text-4xl font-mono font-black" style={{ color: "#00ff85" }}>
              {displayScore}
            </p>
            {matchResult?.notes && (
              <p className="text-xs text-gray-400 mt-2">{matchResult.notes}</p>
            )}
          </div>
        )}

        {/* Counter submission display */}
        {hasCounter && (status === "DISPUTED" || status === "ADMIN_REVIEW") && (
          <div className="rounded-2xl border border-red-500/20 p-4 mb-6" style={{ background: "rgba(255,77,77,0.05)" }}>
            <p className="text-[9px] font-black tracking-[0.22em] text-red-400 uppercase mb-2">Counter Submission</p>
            <p className="text-2xl font-mono font-black text-red-400 text-center">
              {matchResult.counter_challenger_score} - {matchResult.counter_opponent_score}
            </p>
            {matchResult.counter_notes && (
              <p className="text-xs text-red-300 mt-2 text-center">{matchResult.counter_notes}</p>
            )}
          </div>
        )}

        {/* ✅ Success message */}
        {success && (
          <div className="rounded-2xl border border-green-500/20 p-4 mb-4 text-center" style={{ background: "rgba(0,255,133,0.05)" }}>
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        {/* ❌ Error */}
        {error && (
          <div className="rounded-2xl border border-red-500/20 p-3 mb-4 text-center" style={{ background: "rgba(255,77,77,0.05)" }}>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* PENDING_ACCEPTANCE — Accept / Reject */}
        {/* ════════════════════════════════════════════════════════ */}
        {status === "PENDING_ACCEPTANCE" && isOpponent && (
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleAccept}
              disabled={loading}
              className="w-full h-14 rounded-2xl font-bold text-base tracking-wider uppercase transition-all duration-200 text-black border border-green-400/30 hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
              style={{ background: "#00ff85", boxShadow: "0 0 40px rgba(0,255,133,0.2)" }}
            >
              {loading ? "..." : "⚔ Accept Challenge"}
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={loading}
              className="w-full h-12 rounded-2xl font-bold text-sm tracking-wider uppercase transition-all duration-200 text-gray-400 border border-white/10 hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        )}

        {status === "PENDING_ACCEPTANCE" && isChallenger && (
          <div className="rounded-2xl border border-yellow-500/20 p-4 mb-6 text-center" style={{ background: "rgba(255,184,0,0.05)" }}>
            <p className="text-sm text-yellow-400">Waiting for {oName} to accept...</p>
            <p className="text-xs text-gray-500 mt-1">
              Share:{" "}
              <span className="font-mono text-cyan-400">
                {typeof window !== "undefined" ? `${window.location.origin}/challenges/${code}` : `/challenges/${code}`}
              </span>
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* MATCH_READY — Submit Result */}
        {/* ════════════════════════════════════════════════════════ */}
        {status === "MATCH_READY" && isParticipant && (
          <div className="rounded-2xl border border-white/5 p-4 mb-6" style={{ background: "rgba(18,20,24,0.6)" }}>
            <p className="text-[9px] font-black tracking-[0.22em] text-gray-500 uppercase mb-3">Submit Match Result</p>
            <p className="text-xs text-gray-400 mb-4 text-center">Play your match, then submit the result here</p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {isChallenger ? "Your Goals" : "Opponent Goals (for challenger)"}
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={myScore}
                  onChange={(e) => setMyScore(e.target.value)}
                  className="w-full h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-white font-mono text-lg text-center focus:outline-none focus:border-green-400/30"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {isChallenger ? "Opponent Goals" : "Your Goals"}
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={theirScore}
                  onChange={(e) => setTheirScore(e.target.value)}
                  className="w-full h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-white font-mono text-lg text-center focus:outline-none focus:border-green-400/30"
                  placeholder="0"
                />
              </div>
            </div>

            <input
              type="text"
              value={screenshotUrl}
              onChange={(e) => setScreenshotUrl(e.target.value)}
              className="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-4 text-white text-sm mb-2 focus:outline-none focus:border-green-400/30"
              placeholder="Screenshot URL (optional)"
            />
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-4 text-white text-sm mb-4 focus:outline-none focus:border-green-400/30"
              placeholder="Notes (optional)"
            />

            <button
              type="button"
              onClick={handleSubmitResult}
              disabled={loading || !myScore || !theirScore}
              className="w-full h-12 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-200 text-black hover:opacity-90 active:scale-[0.97] disabled:opacity-40"
              style={{ background: "#00ff85" }}
            >
              {loading ? "Submitting..." : "Submit Result"}
            </button>
          </div>
        )}

        {status === "MATCH_READY" && !isParticipant && (
          <div className="rounded-2xl border border-yellow-500/20 p-4 mb-6 text-center" style={{ background: "rgba(255,184,0,0.05)" }}>
            <p className="text-sm text-yellow-400">This match is in progress. Wait for the result.</p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* AWAITING_VERIFICATION — Verify / Reject / Adjust */}
        {/* ════════════════════════════════════════════════════════ */}
        {status === "AWAITING_VERIFICATION" && isVerifier && (
          <div className="space-y-3 mb-6">
            <p className="text-center text-sm text-cyan-400">Review the result above</p>

            <button
              type="button"
              onClick={handleVerify}
              disabled={loading}
              className="w-full h-14 rounded-2xl font-bold text-base tracking-wider uppercase transition-all duration-200 text-black border border-green-400/30 hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
              style={{ background: "#00ff85", boxShadow: "0 0 40px rgba(0,255,133,0.2)" }}
            >
              ✓ Accept Result
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowDisputeModal(true)}
                disabled={loading}
                className="h-12 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-200 text-red-400 border border-red-400/20 hover:bg-red-400/10 disabled:opacity-50"
              >
                ✕ Reject
              </button>
              <button
                type="button"
                onClick={() => setShowAdjustForm(true)}
                disabled={loading}
                className="h-12 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-200 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/10 disabled:opacity-50"
              >
                ⚡ Adjust
              </button>
            </div>
          </div>
        )}

        {status === "AWAITING_VERIFICATION" && isSubmitter && (
          <div className="rounded-2xl border border-cyan-500/20 p-4 mb-6 text-center" style={{ background: "rgba(34,211,238,0.05)" }}>
            <p className="text-sm text-cyan-400">Result submitted! Waiting for opponent to verify...</p>
          </div>
        )}

        {/* Adjust form */}
        {showAdjustForm && (
          <div className="rounded-2xl border border-yellow-500/20 p-4 mb-6" style={{ background: "rgba(255,184,0,0.05)" }}>
            <p className="text-[9px] font-black tracking-[0.22em] text-yellow-400 uppercase mb-3">Your Version of the Score</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Challenger Goals</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={adjMyScore}
                  onChange={(e) => setAdjMyScore(e.target.value)}
                  className="w-full h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-white font-mono text-lg text-center focus:outline-none focus:border-yellow-400/30"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Opponent Goals</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={adjTheirScore}
                  onChange={(e) => setAdjTheirScore(e.target.value)}
                  className="w-full h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-white font-mono text-lg text-center focus:outline-none focus:border-yellow-400/30"
                  placeholder="0"
                />
              </div>
            </div>
            <input
              type="text"
              value={adjScreenshot}
              onChange={(e) => setAdjScreenshot(e.target.value)}
              className="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-4 text-white text-sm mb-2 focus:outline-none focus:border-yellow-400/30"
              placeholder="Screenshot URL (optional)"
            />
            <input
              type="text"
              value={adjNotes}
              onChange={(e) => setAdjNotes(e.target.value)}
              className="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-4 text-white text-sm mb-4 focus:outline-none focus:border-yellow-400/30"
              placeholder="Notes"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdjust}
                disabled={loading}
                className="flex-1 h-12 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-200 text-black hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
                style={{ background: "#ffb800" }}
              >
                {loading ? "Submitting..." : "Submit My Version"}
              </button>
              <button
                type="button"
                onClick={() => setShowAdjustForm(false)}
                className="flex-1 h-12 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-200 text-gray-400 border border-white/10 hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Dispute modal */}
        {showDisputeModal && (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" onClick={() => setShowDisputeModal(false)}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
              className="relative z-10 w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] border border-border-faint p-6"
              style={{ background: "rgba(20,20,26,0.95)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4">Dispute Result</h3>

              <label className="text-xs text-gray-400 mb-1 block">Reason</label>
              <select
                value={disputeCategory}
                onChange={(e) => setDisputeCategory(e.target.value)}
                className="w-full h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-white text-sm mb-3 focus:outline-none"
              >
                <option value="Incorrect Score">Incorrect Score</option>
                <option value="Wrong Screenshot">Wrong Screenshot</option>
                <option value="Match Not Played">Match Not Played</option>
                <option value="Other">Other</option>
              </select>

              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full h-24 rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white text-sm mb-4 focus:outline-none focus:border-red-400/30 resize-none"
                placeholder="Describe why you're disputing this result..."
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDispute}
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-200 text-white hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
                  style={{ background: "#ff4d4d" }}
                >
                  {loading ? "..." : "Submit Dispute"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="flex-1 h-12 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-200 text-gray-400 border border-white/10 hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* VERIFIED / RESOLVED — Final state */}
        {/* ════════════════════════════════════════════════════════ */}
        {(status === "VERIFIED" || status === "RESOLVED") && displayScore && (
          <div className="rounded-2xl border border-green-500/20 p-4 mb-6 text-center" style={{ background: "rgba(0,255,133,0.05)" }}>
            {matchResult?.resolved_by === "ai-referee" ? (
              <>
                <p className="text-2xl mb-2">🤖</p>
                <p className="text-sm text-cyan-400 font-bold uppercase tracking-wider">AI Referee Decision</p>
              </>
            ) : (
              <>
                <p className="text-2xl mb-2">🏆</p>
                <p className="text-sm text-green-400 font-bold">Match Complete</p>
              </>
            )}
            <p className="text-3xl font-mono font-black text-green-400 mt-2">{displayScore}</p>
            <p className="text-xs text-gray-500 mt-2">
              {matchResult?.resolved_by === "ai-referee"
                ? "Resolved automatically by AI referee"
                : "Rankings and stats have been updated"}
            </p>
            {matchResult?.resolved_by === "ai-referee" && matchResult?.dispute_reason && (
              <p className="text-[10px] text-cyan-400/70 mt-1 px-4">{matchResult.dispute_reason}</p>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* DISPUTED / ADMIN_REVIEW */}
        {/* ════════════════════════════════════════════════════════ */}
        {(status === "DISPUTED" || status === "ADMIN_REVIEW") && (
          <div className="rounded-2xl border border-red-500/20 p-4 mb-6 text-center" style={{ background: "rgba(255,77,77,0.05)" }}>
            <p className="text-sm text-red-400 font-bold">Under Admin Review</p>
            <p className="text-xs text-gray-500 mt-1">
              {matchResult?.dispute_reason ? `Reason: ${matchResult.dispute_reason}` : "An admin will resolve this dispute shortly."}
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* CANCELLED / EXPIRED */}
        {/* ════════════════════════════════════════════════════════ */}
        {status === "CANCELLED" && (
          <div className="rounded-2xl border border-gray-500/20 p-4 mb-6 text-center" style={{ background: "rgba(142,144,154,0.05)" }}>
            <p className="text-sm text-gray-400">This challenge was cancelled</p>
          </div>
        )}
        {status === "EXPIRED" && (
          <div className="rounded-2xl border border-gray-500/20 p-4 mb-6 text-center" style={{ background: "rgba(142,144,154,0.05)" }}>
            <p className="text-sm text-gray-400">This challenge has expired (48hr limit)</p>
          </div>
        )}

        {/* Share section */}
        {status === "PENDING_ACCEPTANCE" && isParticipant && (
          <div className="rounded-2xl border border-white/5 p-4 text-center" style={{ background: "rgba(18,20,24,0.6)" }}>
            <p className="text-[9px] font-black tracking-[0.22em] text-gray-500 uppercase mb-2">Share Challenge</p>
            <div className="flex gap-2 justify-center">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`⚔ ${cName} challenged you on ZimFC Pro! Accept here: ${typeof window !== "undefined" ? window.location.origin : "https://zimfcpro.co.zw"}/challenges/${code}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-4 rounded-xl flex items-center gap-2 text-xs font-bold text-green-400 border border-green-400/20 hover:bg-green-400/10 transition-colors"
              >
                📱 WhatsApp
              </a>
              <button
                type="button"
                onClick={() => {
                  const url = typeof window !== "undefined" ? `${window.location.origin}/challenges/${code}` : `https://zimfcpro.co.zw/challenges/${code}`;
                  navigator.clipboard.writeText(url);
                }}
                className="h-10 px-4 rounded-xl flex items-center gap-2 text-xs font-bold text-cyan-400 border border-cyan-400/20 hover:bg-cyan-400/10 transition-colors"
              >
                📋 Copy Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
