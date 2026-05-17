"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";

type InviteType = "tournament" | "league" | "club";

type InviteSystemProps = {
  code: string;
  type: InviteType;
  onCopy?: (code: string) => void;
  className?: string;
};

const TYPE_META: Record<InviteType, { label: string; gradient: string }> = {
  tournament: { label: "Tournament", gradient: "rgba(168,85,247,0.10)" },
  league: { label: "League", gradient: "rgba(34,211,238,0.10)" },
  club: { label: "Club", gradient: "rgba(0,255,133,0.10)" },
};

const SHARE_LINKS = [
  { name: "WhatsApp", color: "#25D366", url: (c: string) => `https://wa.me/?text=Join%20my%20game%20on%20STAR%20STRICK%20FC26%21%20Code%3A%20${c}` },
  { name: "Telegram", color: "#0088CC", url: (c: string) => `https://t.me/share/url?url=zimfcpro&text=Join%20my%20game%20on%20ZIM%20FCPRO%21%20Code%3A%20${c}` },
  { name: "Discord", color: "#5865F2", url: (c: string) => `https://discord.com/app` },
];

export function InviteSystem({ code, type, onCopy, className = "" }: InviteSystemProps) {
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joined, setJoined] = useState(false);

  const meta = TYPE_META[type];

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    onCopy?.(code);
    setTimeout(() => setCopied(false), 2000);
  }, [code, onCopy]);

  const handleJoin = useCallback(() => {
    if (joinCode.trim()) {
      setJoined(true);
      setTimeout(() => setJoined(false), 2000);
    }
  }, [joinCode]);

  return (
    <div className={`frosted-card p-5 sm:p-6 rounded-[20px] ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: "var(--accent)", boxShadow: "0 0 8px rgba(0,255,133,0.5)" }}
        />
        <span className="text-[10px] font-black tracking-[0.24em] uppercase text-accent">
          Invite — {meta.label}
        </span>
      </div>

      <div
        className="rounded-[16px] p-4 mb-4"
        style={{ background: meta.gradient, border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-soft mb-2">Invite Code</p>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 rounded-[12px] px-4 py-3 font-mono text-lg tracking-[0.2em] text-accent font-bold text-center"
            style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(0,255,133,0.12)" }}
          >
            {code}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            className="h-12 w-12 rounded-[12px] grid place-items-center shrink-0 transition-all duration-200"
            style={{
              background: copied ? "rgba(0,255,133,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${copied ? "rgba(0,255,133,0.3)" : "rgba(255,255,255,0.06)"}`,
            }}
            aria-label="Copy invite code"
          >
            {copied ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted-soft">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            )}
          </motion.button>
        </div>
        {copied && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] text-accent mt-2 text-center"
          >
            Copied to clipboard!
          </motion.p>
        )}
      </div>

      <div
        className="rounded-[16px] p-4 mb-4 text-center"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
      >
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-soft mb-3">QR Code</p>
        <div
          className="w-28 h-28 mx-auto rounded-[14px] flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-muted-faint">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        <p className="text-[10px] text-muted-faint mt-2">Scan to join</p>
      </div>

      <p className="text-[9px] font-black tracking-[0.22em] uppercase text-muted-soft mb-3 text-center">Share Via</p>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {SHARE_LINKS.map((link) => (
          <a
            key={link.name}
            href={link.url(code)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 py-3 rounded-[14px] transition-all duration-200 hover:bg-white/[0.03]"
            style={{ border: "1px solid rgba(255,255,255,0.04)" }}
          >
            <span
              className="h-8 w-8 rounded-[10px] flex items-center justify-center text-xs font-bold"
              style={{ background: `${link.color}15`, color: link.color }}
            >
              {link.name[0]}
            </span>
            <span className="text-[9px] text-muted-soft font-medium">{link.name}</span>
          </a>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto px-3 bg-bg text-[9px] font-bold uppercase tracking-wider text-muted-faint">or</div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-soft mb-2">Join via Code</p>
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter code..."
            className="flex-1 h-11 px-4 rounded-[12px] text-sm text-ink font-mono tracking-wider uppercase outline-none placeholder:text-muted-faint"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            maxLength={8}
            onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleJoin}
            disabled={!joinCode.trim() || joined}
            className="h-11 px-5 rounded-[12px] text-[10px] font-bold uppercase tracking-wider text-black disabled:opacity-40 transition-all shrink-0"
            style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,255,133,0.15)" }}
          >
            {joined ? "Joined!" : "Join"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
