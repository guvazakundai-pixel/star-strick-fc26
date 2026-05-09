import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

function typeLabel(type: string) {
  switch (type) {
    case "KNOCKOUT": return "Knockout";
    case "ROUND_ROBIN": return "Round Robin";
    case "GROUPS": return "Groups";
    default: return type;
  }
}

function statusPill(status: string) {
  switch (status) {
    case "LIVE":
      return (
        <span className="pill-accent inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-accent bc-pulse-red" />
          Live
        </span>
      );
    case "REGISTRATION":
      return (
        <span className="rounded-full bg-emerald/15 border border-emerald/25 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald">
          Registration Open
        </span>
      );
    case "COMPLETED":
      return (
        <span className="rounded-full bg-gold/15 border border-gold/25 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-gold">
          Completed
        </span>
      );
    default:
      return (
        <span className="rounded-full bg-surface-2 border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-soft">
          {status}
        </span>
      );
  }
}

function KnockoutBracket({ matches }: { matches: any[] }) {
  if (matches.length === 0) {
    return (
      <div className="frosted-card-sm p-6 text-center">
        <p className="text-muted-soft font-mono text-sm">Bracket not yet generated</p>
      </div>
    );
  }

  const maxRound = Math.max(...matches.map((m: any) => m.round));
  const rounds: Record<number, any[]> = {};
  for (const m of matches) {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  }

  const roundLabels: Record<number, string> = {};
  for (let r = 1; r <= maxRound; r++) {
    if (maxRound === 1) { roundLabels[r] = "Final"; break; }
    if (r === maxRound) roundLabels[r] = "Final";
    else if (r === maxRound - 1) roundLabels[r] = "Semifinals";
    else if (r === maxRound - 2) roundLabels[r] = "Quarterfinals";
    else roundLabels[r] = `Round ${r}`;
  }

  return (
    <div className="overflow-x-auto bc-no-scrollbar">
      <div className="flex gap-6 min-w-max pb-4">
        {Array.from({ length: maxRound }, (_, i) => i + 1).map((round) => (
          <div key={round} className="flex flex-col gap-3" style={{ minWidth: 220 }}>
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-soft mb-1">
              {roundLabels[round]}
            </h3>
            {(rounds[round] || []).map((match: any) => (
              <div
                key={match.id}
                className={`frosted-card-sm p-3 transition-all duration-200 ${
                  match.status === "LIVE"
                    ? "border-accent/30 bc-pulse-red"
                    : match.status === "COMPLETED"
                    ? "opacity-70"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${match.winner?.id === match.player1?.id ? "text-accent" : "text-ink"}`}>
                    {match.player1?.displayName ?? match.player1?.username ?? "TBD"}
                  </span>
                  {match.status === "COMPLETED" && match.score1 != null && (
                    <span className="font-mono text-[11px] text-muted-soft">{match.score1}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${match.winner?.id === match.player2?.id ? "text-accent" : "text-ink-soft"}`}>
                    {match.player2?.displayName ?? match.player2?.username ?? "TBD"}
                  </span>
                  {match.status === "COMPLETED" && match.score2 != null && (
                    <span className="font-mono text-[11px] text-muted-soft">{match.score2}</span>
                  )}
                </div>
                {match.status === "LIVE" && (
                  <div className="mt-1 text-center">
                    <span className="pill-accent rounded-full px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                )}
                {match.status === "PENDING" && !match.player1 && !match.player2 && (
                  <p className="mt-1 text-center font-mono text-[9px] text-muted-faint uppercase">Waiting</p>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function RoundRobinTable({ matches }: { matches: any[] }) {
  if (matches.length === 0) {
    return (
      <div className="frosted-card-sm p-6 text-center">
        <p className="text-muted-soft font-mono text-sm">Fixtures not yet generated</p>
      </div>
    );
  }

  const allPlayers = new Map<string, string>();
  for (const m of matches) {
    if (m.player1) allPlayers.set(m.player1.id, m.player1.displayName ?? m.player1.username);
    if (m.player2) allPlayers.set(m.player2.id, m.player2.displayName ?? m.player2.username);
  }

  const maxRound = Math.max(...matches.map((m: any) => m.round));
  const rounds: Record<number, any[]> = {};
  for (const m of matches) {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: maxRound }, (_, i) => i + 1).map((round) => (
        <div key={round}>
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-soft mb-2">
            Round {round}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(rounds[round] || []).map((match: any) => (
              <div
                key={match.id}
                className={`frosted-card-sm p-3 transition-all duration-200 ${
                  match.status === "LIVE" ? "border-accent/30" : match.status === "COMPLETED" ? "opacity-70" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${match.winner?.id === match.player1?.id ? "text-accent font-medium" : "text-ink"}`}>
                    {match.player1?.displayName ?? match.player1?.username ?? "TBD"}
                  </span>
                  <span className="font-mono text-[11px] text-muted-soft">
                    {match.score1 ?? "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className={`text-xs ${match.winner?.id === match.player2?.id ? "text-accent font-medium" : "text-ink-soft"}`}>
                    {match.player2?.displayName ?? match.player2?.username ?? "TBD"}
                  </span>
                  <span className="font-mono text-[11px] text-muted-soft">
                    {match.score2 ?? "-"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      organizer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      participants: {
        where: { status: { in: ["REGISTERED", "ACTIVE"] } },
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        orderBy: { seed: "asc" },
      },
      matches: {
        include: {
          player1: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          player2: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          winner: { select: { id: true, username: true, displayName: true } },
        },
        orderBy: [{ round: "asc" }, { matchIndex: "asc" }],
      },
    },
  });

  if (!tournament) notFound();

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Link
          href="/tournaments"
          className="text-muted-soft hover:text-ink text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1 mb-4"
        >
          ← Back to Tournaments
        </Link>

        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {statusPill(tournament.status)}
            <span className="rounded-full bg-surface-2 border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-soft">
              {typeLabel(tournament.type)}
            </span>
          </div>
          <h1 className="cinematic-heading text-3xl sm:text-4xl text-ink">
            {tournament.name}
          </h1>
          {(tournament.city || tournament.prizePool > 0) && (
            <div className="mt-2 flex items-center gap-4 font-mono text-xs text-muted-soft">
              {tournament.city && <span>{tournament.city}</span>}
              {tournament.prizePool > 0 && (
                <span className="pill-gold rounded-full px-2 py-0.5 text-[10px]">
                  ${tournament.prizePool.toLocaleString()} prize pool
                </span>
              )}
            </div>
          )}
          {tournament.description && (
            <p className="mt-2 text-sm text-muted max-w-2xl">{tournament.description}</p>
          )}
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            {/* Bracket / Fixtures */}
            <section>
              <h2 className="bc-headline text-sm font-bold uppercase tracking-wider text-ink mb-3">
                {tournament.type === "KNOCKOUT" ? "Bracket" : "Fixtures"}
              </h2>
              {tournament.type === "KNOCKOUT" ? (
                <KnockoutBracket matches={tournament.matches} />
              ) : (
                <RoundRobinTable matches={tournament.matches} />
              )}
            </section>

            {/* Match Schedule */}
            {tournament.matches.filter((m: any) => m.scheduledAt).length > 0 && (
              <section>
                <h2 className="bc-headline text-sm font-bold uppercase tracking-wider text-ink mb-3">
                  Schedule
                </h2>
                <div className="space-y-2">
                  {tournament.matches
                    .filter((m: any) => m.scheduledAt)
                    .sort((a: any, b: any) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
                    .map((match: any) => (
                      <div key={match.id} className="frosted-card-sm p-3 flex items-center justify-between">
                        <span className="text-xs text-ink">
                          {match.player1?.displayName ?? "TBD"} vs {match.player2?.displayName ?? "TBD"}
                        </span>
                        <span className="font-mono text-[10px] text-muted-soft">
                          {new Date(match.scheduledAt!).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Details Card */}
            <div className="frosted-card-sm p-4 space-y-3">
              <h3 className="bc-headline text-xs font-bold uppercase tracking-wider text-ink">
                Details
              </h3>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted-soft">Organizer</dt>
                  <dd className="text-ink">{tournament.organizer.displayName ?? tournament.organizer.username}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-soft">Players</dt>
                  <dd className="text-ink">{tournament.participants.length}/{tournament.maxPlayers}</dd>
                </div>
                {tournament.startAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-soft">Starts</dt>
                    <dd className="text-ink">
                      {new Date(tournament.startAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </dd>
                  </div>
                )}
                {tournament.endAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-soft">Ends</dt>
                    <dd className="text-ink">
                      {new Date(tournament.endAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </dd>
                  </div>
                )}
              </dl>

              {tournament.status === "REGISTRATION" && (
                <form action={`/api/tournaments/${tournament.id}/join`} method="POST">
                  <button
                    type="submit"
                    className="cta-primary w-full mt-2 px-4 py-2 text-sm font-bold"
                  >
                    Join Tournament
                  </button>
                </form>
              )}
            </div>

            {/* Participants */}
            <div className="frosted-card-sm p-4">
              <h3 className="bc-headline text-xs font-bold uppercase tracking-wider text-ink mb-3">
                Players ({tournament.participants.length})
              </h3>
              {tournament.participants.length === 0 ? (
                <p className="text-muted-soft font-mono text-xs">No players yet</p>
              ) : (
                <ul className="space-y-1.5">
                  {tournament.participants.map((p: any) => (
                    <li key={p.id} className="flex items-center justify-between text-xs">
                      <span className="text-ink">{p.user.displayName ?? p.user.username}</span>
                      <span className="font-mono text-[10px] text-muted-faint">
                        Seed #{p.seed}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}