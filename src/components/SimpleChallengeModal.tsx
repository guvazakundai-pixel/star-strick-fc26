"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthModal } from "@/lib/auth-context";

interface Props {
  open: boolean;
  onClose: () => void;
  opponentId?: string;
  opponentName?: string;
}

export function ChallengeModal({ open, onClose, opponentId, opponentName }: Props) {
  const { openAuth } = useAuthModal();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ code: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState("PS5");
  const [gameMode, setGameMode] = useState("Friendly");
  const [message, setMessage] = useState("");

  const handleCreate = useCallback(async () => {
    if (!opponentId) return;

    const me = await fetch("/api/auth/me").then(r => r.ok ? r.json() : null).catch(() => null);
    if (!me?.user) { openAuth("signin"); return; }

    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opponentId, platform, gameMode, message: message || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create challenge"); setCreating(false); return; }
      setResult({ code: data.code, url: data.url });
    } catch {
      setError("Connection error. Try again.");
    }
    setCreating(false);
  }, [opponentId, openAuth, platform, gameMode, message]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try { await navigator.clipboard.writeText(result.url); } catch { /* fallback */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleShareWhatsApp = useCallback(() => {
    if (!result || !opponentName) return;
    const text = encodeURIComponent(`⚔ ${opponentName} — I challenged you on ZimFC Pro! Accept here: ${result.url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
  }, [result, opponentName]);

  const handleClose = useCallback(() => {
    setResult(null);
    setError("");
    setCreating(false);
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="absolute inset-0 bg-bg/70 backdrop-blur-md" onClick={handleClose} />

          <motion.div
            className="relative z-10 w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] border border-border-faint bg-bg-elevated/95 backdrop-blur-2xl shadow-2xl"
            style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.4)" }}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.9 }}
          >
            <div className="sticky top-0 z-20 flex items-center justify-center pt-3 pb-1 bg-bg-elevated/80 backdrop-blur-lg sm:hidden">
              <span className="h-1 w-10 rounded-full bg-border-strong" />
            </div>

            <button type="button" onClick={handleClose} className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 h-9 w-9 rounded-full grid place-items-center bg-bg-highlight/60 hover:bg-bg-highlight border border-border-faint transition-all duration-200" aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-ink-soft"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>

            {!result ? (
              <div className="px-5 sm:px-6 pb-6 sm:pb-8 pt-8">
                <div className="text-center mb-6">
                  <span className="text-4xl block mb-2">⚔</span>
                  <h2 className="cinematic-heading text-2xl text-ink">
                    Challenge {opponentName || "Player"}
                  </h2>
                  <p className="text-[11px] text-muted-soft mt-2">One click. No configuration. Play FC and submit scores.</p>
                </div>

                {opponentName && (
                  <div className="rounded-[16px] p-4 mb-5 text-center" style={{ background: "rgba(0,255,133,0.04)", border: "1px solid rgba(0,255,133,0.12)" }}>
                    <p className="text-[9px] font-black tracking-[0.2em] uppercase text-accent/70 mb-1">Opponent</p>
                    <p className="text-lg font-bold text-ink uppercase">{opponentName}</p>
                  </div>
                )}

                {/* Platform & Game Mode */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-[9px] font-black tracking-[0.15em] uppercase text-muted-faint mb-1 block">Platform</label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full h-10 rounded-xl bg-bg/60 border border-border-faint px-3 text-ink text-xs focus:outline-none focus:border-accent/30"
                    >
                      <option value="PS5">PS5</option>
                      <option value="Xbox">Xbox</option>
                      <option value="PC">PC</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black tracking-[0.15em] uppercase text-muted-faint mb-1 block">Game Mode</label>
                    <select
                      value={gameMode}
                      onChange={(e) => setGameMode(e.target.value)}
                      className="w-full h-10 rounded-xl bg-bg/60 border border-border-faint px-3 text-ink text-xs focus:outline-none focus:border-accent/30"
                    >
                      <option value="Friendly">Friendly</option>
                      <option value="Ranked">Ranked</option>
                      <option value="Quick XP">Quick XP</option>
                    </select>
                  </div>
                </div>

                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full h-10 rounded-xl bg-bg/60 border border-border-faint px-4 text-ink text-xs mb-4 focus:outline-none focus:border-accent/30"
                  placeholder="Optional message..."
                  maxLength={100}
                />

                {error && <p className="text-negative text-[11px] text-center mb-3">{error}</p>}

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full h-14 rounded-[18px] font-bold text-base tracking-[0.14em] uppercase transition-all duration-200 bg-accent text-bg border border-accent hover:bg-accent/90 active:scale-[0.97] disabled:opacity-50"
                  style={{ boxShadow: "0 0 40px rgba(0,255,133,0.2), 0 4px 20px rgba(0,0,0,0.3)" }}
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-bg/30 border-t-bg animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "⚔ Challenge Player"
                  )}
                </button>
              </div>
            ) : (
              <div className="px-5 sm:px-6 pb-6 sm:pb-8 pt-8">
                <div className="text-center mb-6 pt-2">
                  <motion.span className="text-5xl block mb-2" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>⚔</motion.span>
                  <h2 className="cinematic-heading text-2xl text-accent mb-1">Challenge Created!</h2>
                  <p className="text-[11px] text-muted-soft">Send the link to your opponent</p>
                </div>

                <div className="rounded-[16px] p-4 mb-4" style={{ background: "rgba(0,255,133,0.04)", border: "1px solid rgba(0,255,133,0.12)" }}>
                  <p className="text-[8px] font-black tracking-[0.22em] uppercase text-muted-faint mb-1.5">Challenge Code</p>
                  <p className="text-3xl font-mono font-black tracking-[0.3em] text-accent text-center">{result.code}</p>
                </div>

                <div className="rounded-[12px] p-3 mb-4" style={{ background: "rgba(18,20,24,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-[8px] font-black tracking-[0.22em] uppercase text-muted-faint mb-1">Challenge Link</p>
                  <p className="text-[11px] font-mono text-accent break-all">{result.url}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-5">
                  <button type="button" onClick={handleShareWhatsApp} className="h-12 rounded-[14px] flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.1em] uppercase transition-all duration-200 bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20">
                    📱 WhatsApp
                  </button>
                  <button type="button" onClick={handleCopy} className="h-12 rounded-[14px] flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.1em] uppercase transition-all duration-200 bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20">
                    {copied ? "✓ Copied" : "📋 Copy Link"}
                  </button>
                </div>

                <a href={result.url} className="block w-full h-12 rounded-[14px] font-bold text-sm tracking-[0.1em] uppercase text-center leading-[3rem] transition-all duration-200 bg-bg-elevated/60 text-ink-soft border border-border-faint hover:text-ink hover:border-border-strong">
                  Go to Lobby
                </a>

                <div className="mt-4 text-center">
                  <p className="text-[9px] text-muted-faint">
                    Expires in 48 hours · Waiting for opponent
                  </p>
                  <div className="flex justify-center gap-1 mt-2">
                    {[0, 1, 2].map((i) => (
                      <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-accent" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}