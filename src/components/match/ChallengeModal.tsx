"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthModal } from "@/lib/auth-context";

type ModalStep = "type-select" | "configure" | "sharing";

interface ShareUrl {
  app: string;
  shareUrl: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  opponentId?: string;
  opponentName?: string;
}

export function ChallengeModal({ open, onClose, opponentId, opponentName }: Props) {
  const [step, setStep] = useState<ModalStep>("type-select");
  const { openAuth } = useAuthModal();

  const [matchType, setMatchType] = useState<string>("RANKED");
  const [platform, setPlatform] = useState<string>("PS5");
  const [region, setRegion] = useState<string>("ZW");
  const [wager, setWager] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [shareData, setShareData] = useState<{ shareToken: string; shareUrl: string; shareUrls: ShareUrl[] } | null>(null);

  const matchTypes = [
    { id: "RANKED", label: "Ranked Match", desc: "Full XP & ELO on the line", icon: "🏆", glow: "rgba(0,255,133,0.25)" },
    { id: "FRIEND_CHALLENGE", label: "Friend Challenge", desc: "Casual match, no rank impact", icon: "🤝", glow: "rgba(34,211,238,0.25)" },
    { id: "QUICK_XP", label: "Quick XP Match", desc: "Fast match for XP grinding", icon: "⚡", glow: "rgba(168,85,247,0.25)" },
    { id: "CLUB_BATTLE", label: "Club Battle", desc: "Represent your club", icon: "⚑", glow: "rgba(255,184,0,0.25)" },
  ];

  const platforms = ["PS5", "PS4", "XBOX", "PC"];
  const regions = [
    { id: "ZW", label: "Zimbabwe" },
    { id: "AFRICA", label: "Africa" },
    { id: "EU", label: "Europe" },
    { id: "NA", label: "North America" },
    { id: "ASIA", label: "Asia" },
  ];

  const reset = useCallback(() => {
    setStep("type-select");
    setMatchType("RANKED");
    setPlatform("PS5");
    setRegion("ZW");
    setWager(0);
    setError("");
    setShareData(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    setError("");

    const me = await fetch("/api/auth/me").then(r => r.ok ? r.json() : null).catch(() => null);
    if (!me?.user) { openAuth("signin"); setCreating(false); return; }

    try {
      const res = await fetch("/api/matches/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponentId: opponentId ?? null,
          matchType,
          platform,
          region,
          wagerAmount: wager * 100,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create challenge"); setCreating(false); return; }

      setShareData(data);
      setStep("sharing");
    } catch {
      setError("Connection error. Try again.");
    }
    setCreating(false);
  }, [matchType, platform, region, wager, opponentId, openAuth]);

  const copyLink = useCallback(async () => {
    if (!shareData) return;
    try {
      await navigator.clipboard.writeText(shareData.shareUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = shareData.shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  }, [shareData]);

  const shareNative = useCallback(async (url: string) => {
    if (navigator.share && url === shareData?.shareUrl) {
      await navigator.share({ url, title: "STAR STRICK Challenge", text: "Join my match on STAR STRICK FC26!" });
    } else {
      window.open(url, "_blank", "noopener");
    }
  }, [shareData]);

  const wagerAmount = useMemo(() => {
    if (wager <= 0) return 0;
    return Math.min(wager, 50);
  }, [wager]);

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
            className="relative z-10 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] border border-border-faint bg-bg-elevated/95 backdrop-blur-2xl shadow-2xl"
            style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.4)" }}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.9 }}
          >
            <div className="sticky top-0 z-20 flex items-center justify-center pt-3 pb-1 bg-bg-elevated/80 backdrop-blur-lg sm:hidden">
              <span className="h-1 w-10 rounded-full bg-border-strong" />
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 h-9 w-9 rounded-full grid place-items-center bg-bg-highlight/60 hover:bg-bg-highlight border border-border-faint transition-all duration-200"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-ink-soft">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <AnimatePresence mode="wait">
              {step === "type-select" && (
                <motion.div
                  key="type-select"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="px-5 sm:px-6 pb-6 sm:pb-8 pt-2"
                >
                  <h2 className="cinematic-heading text-2xl text-ink mb-1">Start Match</h2>
                  <p className="text-[11px] text-muted-soft mb-5">Choose your battle type</p>

                  <div className="space-y-2">
                    {matchTypes.map((mt) => (
                      <motion.button
                        key={mt.id}
                        whileHover={{ scale: 1.005 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setMatchType(mt.id); setStep("configure"); }}
                        className="w-full text-left flex items-center gap-4 p-4 rounded-[16px] border transition-all duration-200 group"
                        style={{
                          background: "linear-gradient(135deg, rgba(18,20,24,0.60), rgba(14,16,20,0.70))",
                          borderColor: "rgba(255,255,255,0.06)",
                        }}
                      >
                        <span className="text-2xl shrink-0">{mt.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-ink group-hover:text-accent transition-colors duration-200">
                            {mt.label}
                          </p>
                          <p className="text-[10px] text-muted-soft mt-0.5">{mt.desc}</p>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-faint group-hover:text-accent transition-colors duration-200 shrink-0">
                          <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
                        </svg>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === "configure" && (
                <motion.div
                  key="configure"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="px-5 sm:px-6 pb-6 sm:pb-8 pt-2"
                >
                  <div className="flex items-center gap-2 mb-5">
                    <button type="button" onClick={() => setStep("type-select")} className="h-8 w-8 rounded-full grid place-items-center text-muted-soft hover:text-ink hover:bg-bg-highlight transition-all duration-200 shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="cinematic-heading text-xl text-ink truncate">Configure Match</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] font-black tracking-[0.22em] uppercase text-muted-faint mb-2">Platform</p>
                      <div className="flex gap-1.5">
                        {platforms.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPlatform(p)}
                            className={`flex-1 h-10 rounded-[12px] text-[10px] font-black tracking-[0.14em] uppercase transition-all duration-200 border ${
                              platform === p
                                ? "bg-accent/15 text-accent border-accent/25"
                                : "bg-bg-elevated/50 text-muted-soft border-border-faint hover:text-ink hover:border-border-strong"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-black tracking-[0.22em] uppercase text-muted-faint mb-2">Region</p>
                      <div className="flex flex-wrap gap-1.5">
                        {regions.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setRegion(r.id)}
                            className={`h-9 px-3 rounded-[10px] text-[10px] font-black tracking-[0.14em] uppercase transition-all duration-200 border ${
                              region === r.id
                                ? "bg-accent/15 text-accent border-accent/25"
                                : "bg-bg-elevated/50 text-muted-soft border-border-faint hover:text-ink hover:border-border-strong"
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {opponentName && (
                      <div className="rounded-[12px] bg-accent/5 border border-accent/15 p-3">
                        <p className="text-[9px] font-black tracking-[0.2em] uppercase text-accent/70 mb-1">Challenging</p>
                        <p className="text-sm font-bold text-ink">{opponentName}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-[9px] font-black tracking-[0.22em] uppercase text-muted-faint mb-2">Wager (optional)</p>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-muted-soft font-mono text-sm">$</span>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={wager || ""}
                          onChange={(e) => setWager(Math.max(0, Math.min(50, Number(e.target.value))))}
                          placeholder="0"
                          className="w-full h-12 rounded-[14px] bg-bg-elevated/60 border border-border-faint pl-8 pr-3 text-lg font-mono tabular-nums text-ink placeholder:text-muted-faint focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
                        />
                      </div>
                      {wagerAmount > 0 && (
                        <p className="text-[10px] text-muted-soft mt-1.5">
                          Platform fee: ${(wagerAmount * 0.05).toFixed(2)} · You receive: ${(wagerAmount * 1.9).toFixed(2)} per win
                        </p>
                      )}
                    </div>

                    {error && (
                      <p className="text-negative text-[11px] text-center">{error}</p>
                    )}

                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={creating}
                      className="w-full h-14 rounded-[18px] font-bold text-base tracking-[0.14em] uppercase transition-all duration-200 bg-accent text-bg border border-accent hover:bg-accent/90 active:scale-[0.97] disabled:opacity-50 mt-2"
                      style={{ boxShadow: "0 0 40px rgba(0,255,133,0.2), 0 4px 20px rgba(0,0,0,0.3)" }}
                    >
                      {creating ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 rounded-full border-2 border-bg/30 border-t-bg animate-spin" />
                          Creating...
                        </span>
                      ) : (
                        `Create ${opponentId ? "Challenge" : "Battle Link"}`
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "sharing" && shareData && (
                <motion.div
                  key="sharing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="px-5 sm:px-6 pb-6 sm:pb-8 pt-2"
                >
                  <div className="text-center mb-6 pt-2">
                    <motion.span
                      className="text-5xl block mb-2"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      ⚡
                    </motion.span>
                    <h2 className="cinematic-heading text-3xl text-accent mb-1">Challenge Created!</h2>
                    <p className="text-[11px] text-muted-soft">Share the link to start the battle</p>
                  </div>

                  <div className="frosted-card-sm rounded-[16px] p-4 mb-4 border border-accent/15 bg-accent/5">
                    <p className="text-[8px] font-black tracking-[0.22em] uppercase text-muted-faint mb-1.5">Battle Link</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0 bg-bg/60 rounded-[10px] px-3 py-2 border border-border-faint">
                        <p className="text-[11px] font-mono text-accent truncate">{shareData.shareUrl}</p>
                      </div>
                      <button
                        type="button"
                        onClick={copyLink}
                        className="h-10 w-10 rounded-[10px] grid place-items-center bg-accent/15 text-accent border border-accent/25 hover:bg-accent/25 transition-all duration-200 shrink-0"
                        aria-label="Copy link"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <p className="text-[9px] font-black tracking-[0.22em] uppercase text-muted-faint mb-3 text-center">Share Via</p>
                  <div className="grid grid-cols-2 gap-2">
                    {shareData.shareUrls.map((s) => (
                      <button
                        key={s.app}
                        type="button"
                        onClick={() => shareNative(s.shareUrl)}
                        className="flex items-center gap-2 h-12 px-4 rounded-[14px] text-[10px] font-bold tracking-[0.1em] uppercase transition-all duration-200 bg-bg-elevated/60 text-ink-soft border border-border-faint hover:bg-bg-highlight hover:text-ink hover:border-border-strong"
                      >
                        {s.app === "WhatsApp" && (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-accent shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                        )}
                        {s.app === "Telegram" && (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-cyan shrink-0"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                        )}
                        {s.app === "Discord" && (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#5865F2] shrink-0"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" /></svg>
                        )}
                        {s.app === "Copy Link" && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-ink shrink-0"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                        )}
                        <span className="truncate">{s.app}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 text-center">
                    <p className="text-[9px] text-muted-faint">
                      Link expires in 30 minutes
                      <span className="mx-1.5">·</span>
                      Waiting for opponent
                    </p>
                    <div className="flex justify-center gap-1 mt-2">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-accent"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
