"use client";

import { useState } from "react";

type Dispute = Record<string, unknown>;

export function AdminDisputesClient({ disputes: initial }: { disputes: Dispute[] }) {
  const [disputes, setDisputes] = useState(initial);
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showScoreInput, setShowScoreInput] = useState<string | null>(null);
  const [adminScore1, setAdminScore1] = useState("");
  const [adminScore2, setAdminScore2] = useState("");

  const handleResolve = async (code: string, action: string, finalScores?: { challengerScore: number; opponentScore: number }) => {
    setResolving(code);
    setError("");
    try {
      const res = await fetch("/api/challenges/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, action, finalScores }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to resolve"); setResolving(null); return; }
      setDisputes((prev) => prev.filter((d) => d.challenge_code !== code));
      setShowScoreInput(null);
    } catch {
      setError("Connection error");
    }
    setResolving(null);
  };

  if (disputes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0c0c10" }}>
        <div className="text-center">
          <p className="text-4xl mb-4">✓</p>
          <h1 className="text-2xl font-bold text-white mb-2">No Disputes</h1>
          <p className="text-gray-400 text-sm">All challenges are resolved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0c0c10" }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Disputed Matches</h1>
            <p className="text-sm text-gray-400 mt-1">{disputes.length} dispute(s) pending review</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 p-3 mb-4 text-center" style={{ background: "rgba(255,77,77,0.05)" }}>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {disputes.map((d) => {
            const code = d.challenge_code as string;
            const isResolving = resolving === code;
            const hasCounter = d.counter_challenger_score != null;
            const disputeReason = (d.dispute_reason as string) || "No reason provided";

            return (
              <div key={code} className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(18,20,24,0.6)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Disputed Match</p>
                    <p className="text-lg font-mono font-bold" style={{ color: "#22d3ee" }}>{code}</p>
                    <p className="text-xs text-red-400 mt-1">Reason: {disputeReason}</p>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(d.created_at as string).toLocaleDateString()}</span>
                </div>

                {/* Side by side: original vs counter */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Original Submission */}
                  <div className="rounded-xl p-3 text-center" style={{ background: "rgba(0,255,133,0.04)", border: "1px solid rgba(0,255,133,0.12)" }}>
                    <p className="text-[8px] font-black tracking-[0.2em] uppercase text-green-400 mb-1">Original Submission</p>
                    <p className="text-xs text-gray-400 mb-1">by {d.challenger_username === d.submitted_by ? d.challenger_username : d.opponent_username}</p>
                    <p className="text-2xl font-mono font-bold" style={{ color: "#00ff85" }}>
                      {d.challenger_score as number} - {d.opponent_score as number}
                    </p>
                    {(d.screenshot_url as string) && (
                      <p className="text-[10px] text-cyan-400 mt-1 truncate">📷 Screenshot</p>
                    )}
                  </div>

                  {/* Counter Submission */}
                  <div className="rounded-xl p-3 text-center" style={hasCounter
                    ? { background: "rgba(255,184,0,0.04)", border: "1px solid rgba(255,184,0,0.12)" }
                    : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }
                  }>
                    <p className="text-[8px] font-black tracking-[0.2em] uppercase text-yellow-400 mb-1">Counter Submission</p>
                    {hasCounter ? (
                      <>
                        <p className="text-xs text-gray-400 mb-1">by {d.counter_submitted_by === d.challenger_id ? d.challenger_username : d.opponent_username}</p>
                        <p className="text-2xl font-mono font-bold" style={{ color: "#ffb800" }}>
                          {d.counter_challenger_score as number} - {d.counter_opponent_score as number}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No counter-submission</p>
                    )}
                  </div>
                </div>

                {/* Players info */}
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="text-center">
                    <p className="text-sm font-bold text-white uppercase">{d.challenger_username as string}</p>
                    <p className="text-[10px] text-gray-500">Challenger</p>
                  </div>
                  <span className="text-lg font-black text-gray-400">VS</span>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white uppercase">{d.opponent_username as string}</p>
                    <p className="text-[10px] text-gray-500">Opponent</p>
                  </div>
                </div>

                {/* Admin score input form */}
                {showScoreInput === code && (
                  <div className="rounded-xl border border-cyan-500/20 p-4 mb-4" style={{ background: "rgba(34,211,238,0.05)" }}>
                    <p className="text-xs text-cyan-400 mb-3 font-bold uppercase tracking-wider">Enter Final Score</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[10px] text-gray-400 mb-1 block">Challenger Score</label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={adminScore1}
                          onChange={(e) => setAdminScore1(e.target.value)}
                          className="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-3 text-white font-mono text-center focus:outline-none focus:border-cyan-400/30"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 mb-1 block">Opponent Score</label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={adminScore2}
                          onChange={(e) => setAdminScore2(e.target.value)}
                          className="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-3 text-white font-mono text-center focus:outline-none focus:border-cyan-400/30"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const cs = parseInt(adminScore1);
                          const os = parseInt(adminScore2);
                          if (isNaN(cs) || isNaN(os)) { setError("Enter valid scores"); return; }
                          handleResolve(code, "enter_score", { challengerScore: cs, opponentScore: os });
                        }}
                        disabled={isResolving}
                        className="flex-1 h-10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 text-black hover:opacity-90 disabled:opacity-50"
                        style={{ background: "#22d3ee" }}
                      >
                        Confirm Score
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowScoreInput(null); setAdminScore1(""); setAdminScore2(""); }}
                        className="flex-1 h-10 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-400 border border-white/10 hover:bg-white/5 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleResolve(code, "approve_original")}
                    disabled={isResolving}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:opacity-80 disabled:opacity-50"
                    style={{ background: "rgba(0,255,133,0.1)", border: "1px solid rgba(0,255,133,0.2)", color: "#00ff85" }}
                  >
                    ✓ Approve Original
                  </button>
                  {hasCounter && (
                    <button
                      type="button"
                      onClick={() => handleResolve(code, "approve_counter")}
                      disabled={isResolving}
                      className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:opacity-80 disabled:opacity-50"
                      style={{ background: "rgba(255,184,0,0.1)", border: "1px solid rgba(255,184,0,0.2)", color: "#ffb800" }}
                    >
                      ⚡ Approve Counter
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowScoreInput(code);
                      setAdminScore1("");
                      setAdminScore2("");
                    }}
                    disabled={isResolving}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:opacity-80 disabled:opacity-50"
                    style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)", color: "#22d3ee" }}
                  >
                    ✎ Enter Score
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolve(code, "cancel")}
                    disabled={isResolving}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:opacity-80 disabled:opacity-50"
                    style={{ background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.2)", color: "#ff4d4d" }}
                  >
                    ✕ Cancel Match
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
