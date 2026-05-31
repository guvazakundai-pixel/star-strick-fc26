"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthModal } from "@/lib/auth-context";

type ChallengeData = {
  id: string;
  challenge_code: string;
  challenger_id: string;
  opponent_id: string;
  status: string;
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
  results: Record<string, unknown>[];
};

type Props = {
  code: string;
  initialChallenge: ChallengeData | null;
};

export function ChallengeLobbyClient({ code, initialChallenge }: Props) {
  const [challenge, setChallenge] = useState<ChallengeData | null>(initialChallenge);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [scoreFor, setScoreFor] = useState("");
  const [scoreAgainst, setScoreAgainst] = useState("");
  const { openAuth } = useAuthModal();

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.user) { setLoggedIn(true); setUserId(d.user.id); }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!challenge || challenge.status === "completed" || challenge.status === "cancelled" || challenge.status === "expired") return;
    const interval = setInterval(() => {
      fetch(`/api/challenges/${code}`).then(r => r.json()).then(d => {
        if (d.challenge) setChallenge(d.challenge);
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [code, challenge?.status]);

  const handleAccept = useCallback(async () => {
    if (!loggedIn) { openAuth("signin"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/challenges/accept/${code}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to accept"); setLoading(false); return; }
      const fresh = await fetch(`/api/challenges/${code}`).then(r => r.json());
      if (fresh.challenge) setChallenge(fresh.challenge);
    } catch { setError("Connection error"); }
    setLoading(false);
  }, [code, loggedIn, openAuth]);

  const handleDecline = useCallback(async () => {
    if (!loggedIn) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/challenges/decline/${code}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to decline"); setLoading(false); return; }
      const fresh = await fetch(`/api/challenges/${code}`).then(r => r.json());
      if (fresh.challenge) setChallenge(fresh.challenge);
    } catch { setError("Connection error"); }
    setLoading(false);
  }, [code]);

  const handleSubmitScore = useCallback(async () => {
    const gf = parseInt(scoreFor);
    const ga = parseInt(scoreAgainst);
    if (isNaN(gf) || isNaN(ga) || gf < 0 || ga < 0 || gf > 20 || ga > 20) {
      setError("Invalid scores (0-20)");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/challenges/score/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalsFor: gf, goalsAgainst: ga }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to submit score"); setLoading(false); return; }
      const fresh = await fetch(`/api/challenges/${code}`).then(r => r.json());
      if (fresh.challenge) setChallenge(fresh.challenge);
    } catch { setError("Connection error"); }
    setLoading(false);
  }, [code, scoreFor, scoreAgainst]);

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0c0c10" }}>
        <div className="text-center">
          <p className="text-4xl mb-4">⚔</p>
          <h1 className="text-2xl font-bold text-white mb-2">Challenge Not Found</h1>
          <p className="text-gray-400 text-sm">This challenge code doesn&apos;t exist or has expired.</p>
        </div>
      </div>
    );
  }

  const isChallenger = userId === challenge.challenger_id;
  const isOpponent = userId === challenge.opponent_id;
  const isParticipant = isChallenger || isOpponent;

  const myResult = challenge.results?.find((r: any) => r.player_id === userId);
  const opponentResult = challenge.results?.find((r: any) => r.player_id !== userId);
  const hasSubmitted = !!myResult;
  const bothSubmitted = challenge.results?.length === 2;

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: "Waiting for Opponent", color: "#ffb800", icon: "⏳" },
    accepted: { label: "Match In Progress", color: "#00ff85", icon: "⚔" },
    completed: { label: "Match Complete", color: "#00ff85", icon: "✓" },
    disputed: { label: "Under Review", color: "#ff4d4d", icon: "⚠" },
    cancelled: { label: "Cancelled", color: "#8E909A", icon: "✕" },
    expired: { label: "Expired", color: "#8E909A", icon: "⏰" },
  };

  const config = statusConfig[challenge.status] || statusConfig.pending;
  const cName = challenge.challenger_display || challenge.challenger_username;
  const oName = challenge.opponent_display || challenge.opponent_username;

  return (
    <div className="min-h-screen" style={{ background: "#0c0c10" }}>
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Status badge */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-2xl">{config.icon}</span>
          <span className="text-xs font-black tracking-[0.2em] uppercase" style={{ color: config.color }}>{config.label}</span>
        </div>

        {/* VS Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex-1 text-right">
              <p className="text-lg font-bold text-white uppercase tracking-wide">{cName}</p>
              {challenge.challenger_rank && <p className="text-xs text-gray-400">#{challenge.challenger_rank} · {challenge.challenger_points || 0} PTS</p>}
            </div>
            <div className="text-3xl font-black" style={{ color: "#00ff85" }}>VS</div>
            <div className="flex-1 text-left">
              <p className="text-lg font-bold text-white uppercase tracking-wide">{oName}</p>
              {challenge.opponent_rank && <p className="text-xs text-gray-400">#{challenge.opponent_rank} · {challenge.opponent_points || 0} PTS</p>}
            </div>
          </div>
        </div>

        {/* Challenge code */}
        <div className="rounded-2xl border border-white/5 p-4 mb-6 text-center" style={{ background: "rgba(18,20,24,0.6)" }}>
          <p className="text-[9px] font-black tracking-[0.22em] text-gray-500 uppercase mb-1">Challenge ID</p>
          <p className="text-2xl font-mono font-black tracking-[0.3em]" style={{ color: "#22d3ee" }}>{challenge.challenge_code}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/challenges/${challenge.challenge_code}`);
              }}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Copy Link
            </button>
            <span className="text-gray-600">·</span>
            <span className="text-xs text-gray-500">Season 1</span>
          </div>
        </div>

        {/* Score display if both submitted */}
        {challenge.results && challenge.results.length > 0 && (
          <div className="rounded-2xl border border-white/5 p-4 mb-6" style={{ background: "rgba(18,20,24,0.6)" }}>
            <p className="text-[9px] font-black tracking-[0.22em] text-gray-500 uppercase mb-3">Scores Submitted</p>
            {challenge.results.map((r: any) => (
              <div key={r.player_id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-white">{r.player_id === challenge.challenger_id ? cName : oName}</span>
                <span className="font-mono font-bold" style={{ color: "#00ff85" }}>{r.goals_for} - {r.goals_against}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {challenge.status === "pending" && isOpponent && (
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
              onClick={handleDecline}
              disabled={loading}
              className="w-full h-12 rounded-2xl font-bold text-sm tracking-wider uppercase transition-all duration-200 text-gray-400 border border-white/10 hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        )}

        {challenge.status === "pending" && isChallenger && (
          <div className="rounded-2xl border border-yellow-500/20 p-4 mb-6 text-center" style={{ background: "rgba(255,184,0,0.05)" }}>
            <p className="text-sm text-yellow-400">Waiting for {oName} to accept...</p>
            <p className="text-xs text-gray-500 mt-1">Share this link: <span className="font-mono text-cyan-400">{window.location.origin}/challenges/{code}</span></p>
          </div>
        )}

        {challenge.status === "accepted" && isParticipant && !hasSubmitted && (
          <div className="rounded-2xl border border-white/5 p-4 mb-6" style={{ background: "rgba(18,20,24,0.6)" }}>
            <p className="text-[9px] font-black tracking-[0.22em] text-gray-500 uppercase mb-3">Submit Your Score</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Your Goals</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={scoreFor}
                  onChange={e => setScoreFor(e.target.value)}
                  className="w-full h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-white font-mono text-lg text-center focus:outline-none focus:border-green-400/30"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Opponent Goals</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={scoreAgainst}
                  onChange={e => setScoreAgainst(e.target.value)}
                  className="w-full h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-white font-mono text-lg text-center focus:outline-none focus:border-green-400/30"
                  placeholder="0"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmitScore}
              disabled={loading || !scoreFor || !scoreAgainst}
              className="w-full h-12 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-200 text-black hover:opacity-90 active:scale-[0.97] disabled:opacity-40"
              style={{ background: "#00ff85" }}
            >
              {loading ? "Submitting..." : "Submit Score"}
            </button>
          </div>
        )}

        {challenge.status === "accepted" && isParticipant && hasSubmitted && !bothSubmitted && (
          <div className="rounded-2xl border border-cyan-500/20 p-4 mb-6 text-center" style={{ background: "rgba(34,211,238,0.05)" }}>
            <p className="text-sm text-cyan-400">Score submitted! Waiting for your opponent...</p>
          </div>
        )}

        {challenge.status === "disputed" && (
          <div className="rounded-2xl border border-red-500/20 p-4 mb-6 text-center" style={{ background: "rgba(255,77,77,0.05)" }}>
            <p className="text-sm text-red-400">Score mismatch — under admin review</p>
            <p className="text-xs text-gray-500 mt-1">An admin will resolve this shortly.</p>
          </div>
        )}

        {challenge.status === "expired" && (
          <div className="rounded-2xl border border-gray-500/20 p-4 mb-6 text-center" style={{ background: "rgba(142,144,154,0.05)" }}>
            <p className="text-sm text-gray-400">This challenge has expired (48hr limit)</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/20 p-3 mb-4 text-center" style={{ background: "rgba(255,77,77,0.05)" }}>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Share section for pending */}
        {challenge.status === "pending" && !isOpponent && (
          <div className="rounded-2xl border border-white/5 p-4 text-center" style={{ background: "rgba(18,20,24,0.6)" }}>
            <p className="text-[9px] font-black tracking-[0.22em] text-gray-500 uppercase mb-2">Share Challenge</p>
            <div className="flex gap-2 justify-center">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`⚔ ${cName} challenged you on ZimFC Pro! Accept here: ${window.location.origin}/challenges/${code}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-4 rounded-xl flex items-center gap-2 text-xs font-bold text-green-400 border border-green-400/20 hover:bg-green-400/10 transition-colors"
              >
                📱 WhatsApp
              </a>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/challenges/${code}`)}
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