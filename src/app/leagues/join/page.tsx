"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function JoinLeaguePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) { setError("Enter an invite code"); return; }
    setJoining(true);
    setError("");

    try {
      const res = await fetch(`/api/invites/${code.trim().toUpperCase()}`);
      if (!res.ok) { setError("Invalid or expired code"); setJoining(false); return; }
      const data = await res.json();
      if (data.data?.leagueId) {
        const joinRes = await fetch(`/api/leagues/${data.data.leagueId}/join`, { method: "POST" });
        if (!joinRes.ok) { const e = await joinRes.json(); setError(e.error || "Failed to join"); setJoining(false); return; }
        router.push(`/leagues/${data.data.leagueId}`);
      } else {
        setError("Invalid invite");
        setJoining(false);
      }
    } catch { setError("Network error"); setJoining(false); }
  }

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-md px-4 sm:px-6 py-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">Join</p>
          <h1 className="cinematic-heading text-4xl sm:text-5xl text-ink mt-1">Join League</h1>
          <p className="text-muted-soft text-sm mt-1">Enter an invite code to join a league.</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleJoin}
          className="mt-8 space-y-4"
        >
          {error && (
            <div className="rounded-[16px] border border-negative/25 px-4 py-3 text-sm text-negative/90" style={{ background: "rgba(255,51,51,0.06)" }}>
              {error}
            </div>
          )}
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft block mb-1.5">Invite Code</label>
            <input className="input-premium w-full text-center text-lg uppercase tracking-widest" placeholder="XXXXXXXX"
              value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8} />
          </div>
          <button type="submit" disabled={joining || code.length < 4}
            className="btn-primary w-full h-12 text-sm rounded-[16px]">
            {joining ? "Joining..." : "Join League"}
          </button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-muted-soft text-sm">Or browse <Link href="/leagues" className="text-accent hover:underline">public leagues</Link></p>
        </motion.div>
      </div>
    </div>
  );
}
