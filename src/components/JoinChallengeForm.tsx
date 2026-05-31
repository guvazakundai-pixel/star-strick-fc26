"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinChallengeForm() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length === 6) {
      router.push(`/challenges/${trimmed}`);
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 p-4" style={{ background: "rgba(18,20,24,0.6)" }}>
      <p className="text-[9px] font-black tracking-[0.22em] text-gray-500 uppercase mb-2">Have a challenge code?</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={6}
          className="flex-1 h-10 rounded-xl bg-black/40 border border-white/10 px-3 text-white font-mono text-sm tracking-widest text-center focus:outline-none focus:border-green-400/30 placeholder:text-gray-600"
        />
        <button
          type="submit"
          disabled={code.trim().length !== 6}
          className="h-10 px-4 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-200 text-black disabled:opacity-30"
          style={{ background: code.trim().length === 6 ? "#00ff85" : "rgba(255,255,255,0.05)" }}
        >
          Join &rarr;
        </button>
      </form>
    </div>
  );
}