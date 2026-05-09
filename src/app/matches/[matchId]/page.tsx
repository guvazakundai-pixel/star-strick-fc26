import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ConfirmMatchButton } from "./ConfirmMatchButton";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;

  const match = await prisma.matchReport.findUnique({
    where: { id: matchId },
    include: {
      player1: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      player2: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      winner: { select: { id: true, username: true, displayName: true } },
      club: { select: { id: true, name: true, tag: true } },
      submittedBy: { select: { id: true, username: true } },
      approvedBy: { select: { id: true, username: true } },
    },
  });

  if (!match) notFound();

  const p1Name = match.player1.displayName || match.player1.username;
  const p2Name = match.player2.displayName || match.player2.username;
  const isP1Win = match.winnerId === match.player1.id;
  const isP2Win = match.winnerId === match.player2.id;
  const isDraw = !match.winnerId;

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "Pending", color: "text-gold", bg: "bg-gold/8 border-gold/20" },
    CONFIRMED: { label: "Confirmed", color: "text-cyan", bg: "bg-cyan/8 border-cyan/20" },
    APPROVED: { label: "Approved", color: "text-accent", bg: "bg-accent/8 border-accent/20" },
    DISPUTED: { label: "Disputed", color: "text-negative", bg: "bg-negative/8 border-negative/20" },
  };

  const status = statusConfig[match.status] ?? { label: match.status, color: "text-muted-soft", bg: "bg-surface border-border" };
  const disputedStatus = match.isDisputed ? statusConfig.DISPUTED : null;

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <Link href="/matches/history" className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-soft hover:text-accent transition-colors duration-200">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Match History
        </Link>

        <header className="text-center space-y-3">
          <div className="inline-flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider rounded-full px-3 py-1 border ${status.bg} ${status.color}`}>
              {status.label}
            </span>
            {disputedStatus && (
              <span className={`text-[10px] font-bold uppercase tracking-wider rounded-full px-3 py-1 border ${disputedStatus.bg} ${disputedStatus.color}`}>
                {disputedStatus.label}
              </span>
            )}
          </div>
        </header>

        <section className="glass p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center space-y-2">
              <Link href={`/player/${match.player1.username}`} className="group">
                <div className="mx-auto h-16 w-16 rounded-[16px] border border-border-faint bg-bg-elevated bg-cover bg-center flex items-center justify-center" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.25)", ...(match.player1.avatarUrl ? { backgroundImage: `url(${match.player1.avatarUrl})` } : {}) }}>
                  {!match.player1.avatarUrl && (
                    <span className="bc-headline text-2xl text-accent">{p1Name[0]}</span>
                  )}
                </div>
              </Link>
              <Link href={`/player/${match.player1.username}`} className="block">
                <p className={`bc-headline text-lg truncate ${isP1Win ? "text-accent" : "text-ink"} group-hover:text-accent transition-colors duration-200`}>
                  {p1Name}
                </p>
                <p className="font-mono text-[10px] text-muted-soft">@{match.player1.username}</p>
              </Link>
            </div>

            <div className="shrink-0 flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <span className={`bc-headline text-4xl tabular-nums ${isP1Win ? "text-accent" : "text-ink"}`}>
                  {match.score1}
                </span>
                <span className="text-muted-faint text-lg font-light">:</span>
                <span className={`bc-headline text-4xl tabular-nums ${isP2Win ? "text-accent" : "text-ink"}`}>
                  {match.score2}
                </span>
              </div>
              {isDraw && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Draw</span>
              )}
              {!isDraw && match.winner && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                  Winner: {match.winner.displayName || match.winner.username}
                </span>
              )}
            </div>

            <div className="flex-1 text-center space-y-2">
              <Link href={`/player/${match.player2.username}`} className="group">
                <div className="mx-auto h-16 w-16 rounded-[16px] border border-border-faint bg-bg-elevated bg-cover bg-center flex items-center justify-center" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.25)", ...(match.player2.avatarUrl ? { backgroundImage: `url(${match.player2.avatarUrl})` } : {}) }}>
                  {!match.player2.avatarUrl && (
                    <span className="bc-headline text-2xl text-accent">{p2Name[0]}</span>
                  )}
                </div>
              </Link>
              <Link href={`/player/${match.player2.username}`} className="block">
                <p className={`bc-headline text-lg truncate ${isP2Win ? "text-accent" : "text-ink"} group-hover:text-accent transition-colors duration-200`}>
                  {p2Name}
                </p>
                <p className="font-mono text-[10px] text-muted-soft">@{match.player2.username}</p>
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <div className="frosted-card-sm p-4 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-soft">Submitted By</p>
            <p className="bc-headline text-lg text-ink mt-1">@{match.submittedBy.username}</p>
          </div>
          <div className="frosted-card-sm p-4 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-soft">Date</p>
            <p className="bc-headline text-lg text-ink mt-1">
              {match.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </p>
          </div>
          {match.club && (
            <>
              <div className="frosted-card-sm p-4 text-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-soft">Club</p>
                <Link href={`/club/${match.club.tag ?? match.club.id}`} className="bc-headline text-lg text-ink hover:text-accent transition-colors duration-200 mt-1 block">
                  [{match.club.tag}]
                </Link>
              </div>
              <div className="frosted-card-sm p-4 text-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-soft">Approved By</p>
                <p className="bc-headline text-lg text-ink mt-1">
                  {match.approvedBy ? `@${match.approvedBy.username}` : "—"}
                </p>
              </div>
            </>
          )}
        </div>

        {match.status === "PENDING" && (
          <ConfirmMatchButton matchId={match.id} player1Id={match.player1.id} player2Id={match.player2.id} submittedById={match.submittedById} />
        )}

        {match.notes && (
          <div className="frosted-card-sm p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-soft mb-2">Notes</p>
            <p className="text-sm text-ink leading-relaxed">{match.notes}</p>
          </div>
        )}

        <div className="text-center pt-2">
          <Link href="/matches/find" className="text-sm text-accent hover:text-ink transition-colors duration-200">
            Find a Match →
          </Link>
        </div>
      </div>
    </div>
  );
}