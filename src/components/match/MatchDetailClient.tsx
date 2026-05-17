"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/lib/auth-context";
import { useSession } from "@/lib/session-client";

interface MatchPlayer {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface MatchData {
  id: string;
  score1: number;
  score2: number;
  status: string;
  statusRaw: string;
  isDisputed: boolean;
  notes: string | null;
  createdAt: string;
  player1: MatchPlayer;
  player2: MatchPlayer;
  winnerId: string | null;
  submittedById: string;
  approvedById: string | null;
  club: { id: string; name: string; tag: string | null } | null;
  submittedBy: { id: string; username: string };
  approvedBy: { id: string; username: string } | null;
  winner: { id: string; username: string; displayName: string | null } | null;
  confirmations: any;
}

interface XPBreakdown {
  winnerXPGain: number;
  loserXPLoss: number;
  winnerPointsGain: number;
  loserPointsGain: number;
  bonuses: { giantSlayer: number; cleanSheet: number; goalMargin: number; winStreak: number };
  description: string;
  winnerNewRating: number;
  loserNewRating: number;
}

const STATUS_META: Record<string, { label: string; color: string; glow: string; badgeClass?: string }> = {
  PENDING_ACCEPTANCE: { label: "Awaiting Acceptance", color: "text-gold", glow: "rgba(255,184,0,0.15)", badgeClass: "match-badge-upcoming" },
  ACTIVE: { label: "LIVE", color: "text-accent", glow: "rgba(0,255,133,0.2)", badgeClass: "match-badge-live" },
  SCORE_SUBMITTED: { label: "Score Submitted", color: "text-cyan", glow: "rgba(34,211,238,0.15)", badgeClass: "match-badge-live" },
  PENDING_VERIFICATION: { label: "Verifying", color: "text-cyan", glow: "rgba(34,211,238,0.15)", badgeClass: "match-badge-live" },
  COMPLETED: { label: "FT", color: "text-emerald", glow: "rgba(52,211,153,0.15)", badgeClass: "match-badge-ft" },
  CONFIRMED: { label: "Confirmed", color: "text-cyan", glow: "rgba(34,211,238,0.15)", badgeClass: "match-badge-ft" },
  APPROVED: { label: "Approved", color: "text-accent", glow: "rgba(0,255,133,0.15)", badgeClass: "match-badge-ft" },
  DISPUTED: { label: "Disputed", color: "text-negative", glow: "rgba(255,77,77,0.2)" },
  CANCELLED: { label: "Cancelled", color: "text-muted-soft", glow: "transparent" },
  EXPIRED: { label: "Expired", color: "text-muted-soft", glow: "transparent" },
  AUTO_FORFEIT: { label: "Forfeit", color: "text-negative/80", glow: "rgba(255,77,77,0.1)" },
};

export function MatchDetailClient({ matchId }: { matchId: string }) {
  const router = useRouter();
  const session = useSession();
  const { openAuth } = useAuthModal();

  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState<"idle" | "confirming" | "disputing" | "done">("idle");
  const [xpResult, setXpResult] = useState<XPBreakdown | null>(null);
  const [antiCheat, setAntiCheat] = useState<{ passed: boolean; flags: string[] } | null>(null);

  const fetchMatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}`);
      const data = await res.json();
      setMatch(data.match ?? data);
    } catch {
      setError("Failed to load match");
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => { fetchMatch(); }, [fetchMatch]);

  const meta = match ? STATUS_META[match.statusRaw] ?? STATUS_META[match.status] ?? { label: match.status, color: "text-muted-soft", glow: "transparent" } : null;

  const isPlayer1 = session && match?.player1.id === session.userId;
  const isPlayer2 = session && match?.player2.id === session.userId;
  const isParticipant = isPlayer1 || isPlayer2;
  const isSubmitting = match?.statusRaw === "ACTIVE" && isParticipant;
  const isVerifying = match?.statusRaw === "SCORE_SUBMITTED" && isParticipant && match.submittedById !== session?.userId;
  const isWaiting = match?.statusRaw === "SCORE_SUBMITTED" && isParticipant && match.submittedById === session?.userId;
  const isTerminal = match && ["COMPLETED", "CONFIRMED", "APPROVED", "CANCELLED", "EXPIRED", "AUTO_FORFEIT"].includes(match.statusRaw);

  const handleSubmitScore = useCallback(async () => {
    if (!session) { openAuth("signin"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/submit-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: isPlayer1 ? myScore : opponentScore,
          opponentScore: isPlayer1 ? opponentScore : myScore,
          screenshots: [],
          rageQuit: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to submit"); return; }
      setAntiCheat(data.antiCheat);
      fetchMatch();
    } catch {
      setError("Submission failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }, [session, openAuth, matchId, isPlayer1, myScore, opponentScore, fetchMatch]);

  const handleVerify = useCallback(async (confirm: boolean) => {
    setVerified(confirm ? "confirming" : "disputing");
    try {
      const res = await fetch(`/api/matches/${matchId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm, disputeReason: confirm ? undefined : "Scores don't match" }),
      });
      const data = await res.json();
      if (res.ok && confirm) {
        setXpResult(data.xpResult);
        setVerified("done");
      } else {
        fetchMatch();
        setVerified("idle");
      }
    } catch {
      setError("Verification failed");
      setVerified("idle");
    }
  }, [matchId, fetchMatch]);

  if (loading) {
    return (
      <div className="broadcast-theme min-h-screen bc-grain">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-bg-highlight/50 mx-auto" />
            <div className="h-64 rounded-[24px] bg-bg-highlight/30" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="broadcast-theme min-h-screen bc-grain flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl block mb-4">🔮</span>
          <h1 className="cinematic-heading text-3xl text-ink mb-2">Match Not Found</h1>
          <p className="text-muted-soft text-sm mb-6">{error || "This match doesn't exist or has been removed."}</p>
          <button onClick={() => router.push("/matches")} className="h-12 rounded-[14px] cta-primary px-6 text-sm font-bold tracking-wider">
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  const p1Name = match.player1.displayName || match.player1.username;
  const p2Name = match.player2.displayName || match.player2.username;
  const isP1Win = match.winnerId === match.player1.id;
  const isP2Win = match.winnerId === match.player2.id;
  const isDraw = !match.winnerId && isTerminal;

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-28 space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-soft hover:text-accent transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="text-center space-y-2">
          {meta && (
            <div className={meta.badgeClass || "inline-flex items-center gap-2 rounded-full px-4 py-1.5 border"}>
              {meta.badgeClass?.includes("match-badge-live") || (!isTerminal && !meta.badgeClass) ? (
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              ) : null}
              <span>{meta.label}</span>
            </div>
          )}
          {match.isDisputed && (
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border border-negative/20 bg-negative/8">
              <span className="text-[10px] font-black tracking-[0.22em] uppercase text-negative">⚠ Disputed</span>
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[24px] p-6 sm:p-8 space-y-6"
          style={{ boxShadow: meta?.glow && meta.glow !== "transparent" ? `0 0 60px ${meta.glow}` : undefined }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center space-y-2">
              <div className="mx-auto h-16 w-16 rounded-[16px] border border-border-faint bg-bg-elevated grid place-items-center" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
                <span className="bc-headline text-2xl text-accent">{p1Name[0]}</span>
              </div>
              <p className={`bc-headline text-lg truncate ${isP1Win ? "text-accent" : "text-ink"}`}>{p1Name}</p>
              <p className="font-mono text-[10px] text-muted-soft">@{match.player1.username}</p>
            </div>

            <div className="shrink-0 flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <span className={`bc-headline text-4xl sm:text-5xl tabular-nums ${isP1Win ? "text-accent" : "text-ink"}`}>
                  {match.score1}
                </span>
                <span className="text-muted-faint text-lg font-light">:</span>
                <span className={`bc-headline text-4xl sm:text-5xl tabular-nums ${isP2Win ? "text-accent" : "text-ink"}`}>
                  {match.score2}
                </span>
              </div>
              {isDraw && <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Draw</span>}
              {!isDraw && match.winner && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-accent">
                  {match.winner.displayName || match.winner.username} wins
                </span>
              )}
            </div>

            <div className="flex-1 text-center space-y-2">
              <div className="mx-auto h-16 w-16 rounded-[16px] border border-border-faint bg-bg-elevated grid place-items-center" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
                <span className="bc-headline text-2xl text-accent">{p2Name[0]}</span>
              </div>
              <p className={`bc-headline text-lg truncate ${isP2Win ? "text-accent" : "text-ink"}`}>{p2Name}</p>
              <p className="font-mono text-[10px] text-muted-soft">@{match.player2.username}</p>
            </div>
          </div>
        </motion.div>

        {antiCheat && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-[16px] p-4 border ${antiCheat.passed ? "bg-accent/5 border-accent/15" : "bg-negative/8 border-negative/20"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${antiCheat.passed ? "text-accent" : "text-negative"}`}>
                Anti-Cheat {antiCheat.passed ? "Passed" : "Flagged"}
              </span>
              {!antiCheat.passed && <span className="h-2 w-2 rounded-full bg-negative animate-pulse" />}
            </div>
            {antiCheat.flags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {antiCheat.flags.map((f) => (
                  <span key={f} className="text-[9px] font-mono text-negative/80 bg-negative/5 rounded-[4px] px-1.5 py-0.5">{f}</span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {xpResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[20px] border border-accent/20 bg-accent/5 p-5 sm:p-6 space-y-4"
            style={{ boxShadow: "0 0 60px -12px rgba(0,255,133,0.2)" }}
          >
            <div className="text-center">
              <span className="text-3xl block mb-1">🏆</span>
              <h3 className="cinematic-heading text-2xl text-accent">Match Complete</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg/50 rounded-[12px] p-3 text-center">
                <p className="text-[8px] font-black tracking-[0.2em] uppercase text-muted-faint">XP Gained</p>
                <p className="cinematic-heading text-2xl text-accent tabular-nums mt-0.5">+{xpResult.winnerXPGain}</p>
              </div>
              <div className="bg-bg/50 rounded-[12px] p-3 text-center">
                <p className="text-[8px] font-black tracking-[0.2em] uppercase text-muted-faint">Rating</p>
                <p className="cinematic-heading text-2xl text-ink tabular-nums mt-0.5">{xpResult.winnerNewRating}</p>
              </div>
            </div>
            {xpResult.description && (
              <p className="text-[11px] text-muted-soft text-center leading-relaxed">{xpResult.description}</p>
            )}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {xpResult.bonuses.giantSlayer > 0 && <BonusBadge label={`Giant Slayer +${xpResult.bonuses.giantSlayer}`} />}
              {xpResult.bonuses.cleanSheet > 0 && <BonusBadge label={`Clean Sheet +${xpResult.bonuses.cleanSheet}`} />}
              {xpResult.bonuses.goalMargin > 0 && <BonusBadge label={`Dominant +${xpResult.bonuses.goalMargin}`} />}
              {xpResult.bonuses.winStreak > 0 && <BonusBadge label={`Streak +${xpResult.bonuses.winStreak}`} />}
            </div>
          </motion.div>
        )}

        {isSubmitting && !xpResult && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="frosted-card rounded-[20px] p-5 sm:p-6 space-y-5"
          >
            <div className="text-center">
              <span className="text-[10px] font-black tracking-[0.22em] uppercase text-accent">Submit Score</span>
              <p className="text-[11px] text-muted-soft mt-1">Enter the final result of your match</p>
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-[9px] font-bold tracking-wider uppercase text-muted-soft mb-2">
                  {isPlayer1 ? p1Name : p2Name}
                </p>
                <ScoreStepper value={isPlayer1 ? myScore : opponentScore} onChange={isPlayer1 ? setMyScore : setOpponentScore} />
              </div>
              <span className="text-[10px] font-black tracking-wider text-muted-faint">VS</span>
              <div className="text-center">
                <p className="text-[9px] font-bold tracking-wider uppercase text-muted-soft mb-2">
                  {isPlayer1 ? p2Name : p1Name}
                </p>
                <ScoreStepper value={isPlayer1 ? opponentScore : myScore} onChange={isPlayer1 ? setOpponentScore : setMyScore} />
              </div>
            </div>

            {error && <p className="text-negative text-[11px] text-center">{error}</p>}

            <button
              onClick={handleSubmitScore}
              disabled={submitting}
              className="w-full h-14 rounded-[18px] font-bold text-base tracking-[0.14em] uppercase transition-all duration-200 bg-accent text-bg border border-accent hover:bg-accent/90 active:scale-[0.97] disabled:opacity-50"
              style={{ boxShadow: "0 0 40px rgba(0,255,133,0.2)" }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-bg/30 border-t-bg animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit Score"
              )}
            </button>
          </motion.div>
        )}

        {isWaiting && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="frosted-card p-6 text-center space-y-3 rounded-[20px]"
          >
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-2 w-2 rounded-full bg-accent"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
                />
              ))}
            </div>
            <p className="text-sm font-semibold text-ink">Score Submitted</p>
            <p className="text-[11px] text-muted-soft">Waiting for opponent to verify the result</p>
          </motion.div>
        )}

        {isVerifying && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="frosted-card rounded-[20px] p-5 sm:p-6 space-y-4"
            style={{ borderColor: "rgba(255,184,0,0.2)", boxShadow: "0 0 40px -8px rgba(255,184,0,0.15)" }}
          >
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-gold/8 border border-gold/20 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                <span className="text-[9px] font-black tracking-[0.2em] uppercase text-gold">Action Required</span>
              </div>
              <p className="text-lg font-bold text-ink">
                {match.submittedBy.username} reported: {match.score1} - {match.score2}
              </p>
              <p className="text-[11px] text-muted-soft mt-1">Does this score match your result?</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleVerify(true)}
                disabled={verified === "confirming"}
                className="flex-1 h-14 rounded-[16px] font-bold text-sm tracking-[0.12em] uppercase transition-all duration-200 bg-accent text-bg border border-accent hover:bg-accent/90 active:scale-[0.97] disabled:opacity-50"
              >
                {verified === "confirming" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-bg/30 border-t-bg animate-spin" />
                    Confirming...
                  </span>
                ) : (
                  "✓ Confirm Result"
                )}
              </button>
              <button
                onClick={() => handleVerify(false)}
                disabled={verified === "disputing"}
                className="flex-1 h-14 rounded-[16px] font-bold text-sm tracking-[0.12em] uppercase transition-all duration-200 bg-negative/10 text-negative border border-negative/20 hover:bg-negative/20 active:scale-[0.97] disabled:opacity-50"
              >
                {verified === "disputing" ? "Disputing..." : "⚠ Dispute"}
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="frosted-card-sm p-4 text-center rounded-[16px]">
            <p className="text-[8px] font-black tracking-[0.2em] uppercase text-muted-faint">Submitted By</p>
            <p className="text-sm font-bold text-ink mt-1">@{match.submittedBy.username}</p>
          </div>
          <div className="frosted-card-sm p-4 text-center rounded-[16px]">
            <p className="text-[8px] font-black tracking-[0.2em] uppercase text-muted-faint">Date</p>
            <p className="text-sm font-bold text-ink mt-1">
              {new Date(match.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </p>
          </div>
          {match.club && (
            <div className="frosted-card-sm p-4 text-center rounded-[16px]">
              <p className="text-[8px] font-black tracking-[0.2em] uppercase text-muted-faint">Club</p>
              <p className="text-sm font-bold text-accent mt-1">{match.club.name}</p>
            </div>
          )}
          {match.approvedBy && (
            <div className="frosted-card-sm p-4 text-center rounded-[16px]">
              <p className="text-[8px] font-black tracking-[0.2em] uppercase text-muted-faint">Approved By</p>
              <p className="text-sm font-bold text-ink mt-1">@{match.approvedBy.username}</p>
            </div>
          )}
        </div>

        {match.notes && (
          <div className="frosted-card-sm p-4 rounded-[16px]">
            <p className="text-[8px] font-black tracking-[0.2em] uppercase text-muted-faint mb-1.5">Notes</p>
            <p className="text-sm text-ink leading-relaxed">{match.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="h-10 w-10 rounded-[10px] bg-bg-elevated border border-border text-ink font-bold text-lg grid place-items-center hover:bg-bg-highlight transition-all duration-150 active:scale-90"
      >
        −
      </button>
      <span className="bc-headline text-3xl tabular-nums text-ink w-12 text-center">{value}</span>
      <button
        onClick={() => onChange(Math.min(50, value + 1))}
        className="h-10 w-10 rounded-[10px] bg-bg-elevated border border-border text-ink font-bold text-lg grid place-items-center hover:bg-bg-highlight transition-all duration-150 active:scale-90"
      >
        +
      </button>
    </div>
  );
}

function BonusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 h-6 text-[9px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20">
      {label}
    </span>
  );
}
