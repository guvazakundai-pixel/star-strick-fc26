"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function JoinChallengePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter a challenge code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/challenges/${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Challenge not found or expired");
        setLoading(false);
        return;
      }
      router.push(`/challenges/${trimmed}`);
    } catch {
      setError("Connection error. Try again.");
    }
    setLoading(false);
  }, [code, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(0,255,133,0.03) 0%, rgba(10,10,12,0.98) 70%)",
      }}
    >
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div
            className="h-20 w-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,255,133,0.15), rgba(34,211,238,0.10))",
              border: "2px solid rgba(0,255,133,0.20)",
            }}
          >
            <span className="text-3xl">&#x2694;&#xFE0F;</span>
          </div>
          <h1 className="text-2xl font-black text-ink uppercase tracking-wider">
            Join a Challenge
          </h1>
          <p className="text-muted-soft text-sm mt-2">
            Enter the challenge code shared by your opponent
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="rounded-[24px] p-6 mb-6 text-left"
            style={{
              background: "rgba(18,20,24,0.60)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <label
              htmlFor="challenge-code"
              className="text-[9px] font-black tracking-[0.22em] uppercase text-muted-soft mb-2 block"
            >
              Challenge Code
            </label>
            <input
              id="challenge-code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="e.g. ABC123"
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              className="w-full h-14 rounded-[14px] bg-black/40 border border-white/10 px-5 text-white font-mono text-xl text-center tracking-[0.3em] uppercase focus:outline-none focus:border-green-400/30 placeholder:text-white/20 transition-colors"
            />
            {error && (
              <p className="text-negative text-[11px] mt-2 text-center">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full h-14 rounded-[18px] font-bold text-base tracking-[0.14em] uppercase transition-all duration-200 bg-accent text-bg border border-accent hover:bg-accent/90 active:scale-[0.97] disabled:opacity-40"
            style={{ boxShadow: "0 0 40px rgba(0,255,133,0.15)" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-bg/30 border-t-bg animate-spin" />
                Joining...
              </span>
            ) : (
              "\u2192 Join Lobby"
            )}
          </button>
        </form>

        <p className="text-[10px] text-muted-faint mt-6">
          Don&apos;t have a code?{" "}
          <a href="/rankings" className="text-accent hover:underline">
            Challenge someone from the rankings
          </a>
        </p>
      </div>
    </div>
  );
}