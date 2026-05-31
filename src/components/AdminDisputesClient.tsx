"use client";

import { useState } from "react";

type Dispute = Record<string, unknown>;

export function AdminDisputesClient({ disputes: initial }: { disputes: Dispute[] }) {
  const [disputes, setDisputes] = useState(initial);
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleResolve = async (code: string, action: string) => {
    setResolving(code);
    setError("");
    try {
      const res = await fetch("/api/challenges/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, action }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to resolve"); setResolving(null); return; }
      setDisputes(prev => prev.filter(d => d.challenge_code !== code));
    } catch { setError("Connection error"); }
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
            return (
              <div key={code} className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(18,20,24,0.6)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Disputed Match</p>
                    <p className="text-lg font-mono font-bold" style={{ color: "#22d3ee" }}>{code}</p>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(d.created_at as string).toLocaleDateString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="rounded-xl border border-white/5 p-3 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-sm font-bold text-white uppercase">{d.challenger_username as string}</p>
                    <p className="text-xs text-gray-400 mb-1">Challenger</p>
                    <p className="text-2xl font-mono font-bold" style={{ color: "#00ff85" }}>{d.challenger_goals as number} - {d.challenger_conceded as number}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 p-3 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-sm font-bold text-white uppercase">{d.opponent_username as string}</p>
                    <p className="text-xs text-gray-400 mb-1">Opponent</p>
                    <p className="text-2xl font-mono font-bold" style={{ color: "#22d3ee" }}>{d.opponent_goals as number} - {d.opponent_conceded as number}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleResolve(code, "approve_challenger")}
                    disabled={isResolving}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200"
                    style={{ background: "rgba(0,255,133,0.1)", border: "1px solid rgba(0,255,133,0.2)", color: "#00ff85" }}
                  >
                    ✓ Approve {d.challenger_username as string}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolve(code, "approve_opponent")}
                    disabled={isResolving}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200"
                    style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)", color: "#22d3ee" }}
                  >
                    ✓ Approve {d.opponent_username as string}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolve(code, "cancel")}
                    disabled={isResolving}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 text-red-400"
                    style={{ background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.2)" }}
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