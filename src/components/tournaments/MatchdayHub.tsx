"use client";

import { motion } from "framer-motion";

type MatchdayHubProps = {
  tournament: {
    id: string;
    name: string;
    type: string;
    status: string;
    settings?: {
      halfLengthMinutes?: number;
      gameSpeed?: string;
      cameraAngle?: string;
      squadType?: string;
    } | null;
  };
  participants: {
    userId: string;
    username: string;
    displayName?: string | null;
    seed: number;
    assignedTeam?: string | null;
    status: string;
  }[];
  groups?: {
    id: string;
    name: string;
    standings: {
      userId: string;
      username?: string;
      displayName?: string | null;
      points: number;
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDifference: number;
    }[];
  }[];
  matches: {
    id: string;
    round: number;
    player1?: { id: string; username: string; displayName?: string | null } | null;
    player2?: { id: string; username: string; displayName?: string | null } | null;
    winner?: { id: string; username: string; displayName?: string | null } | null;
    score1?: number | null;
    score2?: number | null;
    status: string;
    groupId?: string | null;
    scheduledAt?: string | null;
  }[];
  currentUserId?: string;
  isOrganizer?: boolean;
};

function FormIndicator({ results }: { results: string }) {
  const dots = results.slice(-5).padEnd(5, "—");
  return (
    <div className="flex gap-0.5">
      {dots.split("").map((r, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            r === "W" ? "bg-accent" : r === "D" ? "bg-gold" : r === "L" ? "bg-negative" : "bg-surface-2"
          }`}
        />
      ))}
    </div>
  );
}

function SplashScreenWidget({ match, participants }: {
  match: MatchdayHubProps["matches"][0];
  participants: MatchdayHubProps["participants"];
}) {
  if (!match.player1 || !match.player2) return null;

  const p1Assign = participants.find((p) => p.userId === match.player1?.id)?.assignedTeam;
  const p2Assign = participants.find((p) => p.userId === match.player2?.id)?.assignedTeam;

  return (
    <div className="relative overflow-hidden rounded-[20px] p-6 border border-accent/20"
      style={{
        background: "linear-gradient(135deg, rgba(0,255,133,0.08), rgba(18,20,24,0.6))",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(600px 300px at 50% 20%, rgba(0,255,133,0.06), transparent 70%)",
        }}
      />
      <div className="relative z-10">
        <div className="text-center mb-4">
          <span className="text-[9px] font-black tracking-[0.25em] uppercase text-accent">
            Next Match
          </span>
        </div>

        <div className="flex items-center justify-center gap-6 sm:gap-12">
          <div className="text-center flex-1 max-w-[180px]">
            <div className="h-12 w-12 rounded-full bg-accent/10 border border-accent/20 mx-auto mb-2 grid place-items-center text-lg font-bold text-accent">
              {match.player1.displayName?.[0] ?? match.player1.username[0]}
            </div>
            <p className="text-sm font-bold text-ink truncate">
              {match.player1.displayName ?? match.player1.username}
            </p>
            {p1Assign && (
              <p className="text-[9px] text-muted-faint uppercase tracking-wider truncate mt-0.5">
                {p1Assign}
              </p>
            )}
          </div>

          <div className="shrink-0 text-center">
            <span className="text-2xl font-black text-ink">VS</span>
            <div className="mt-1 text-[9px] font-black tracking-[0.2em] uppercase text-muted-soft">
              {match.status === "COMPLETED" && match.score1 != null && match.score2 != null
                ? `${match.score1} - ${match.score2}`
                : match.status === "LIVE"
                ? "Live"
                : "Upcoming"}
            </div>
          </div>

          <div className="text-center flex-1 max-w-[180px]">
            <div className="h-12 w-12 rounded-full bg-accent/10 border border-accent/20 mx-auto mb-2 grid place-items-center text-lg font-bold text-accent">
              {match.player2.displayName?.[0] ?? match.player2.username[0]}
            </div>
            <p className="text-sm font-bold text-ink truncate">
              {match.player2.displayName ?? match.player2.username}
            </p>
            {p2Assign && (
              <p className="text-[9px] text-muted-faint uppercase tracking-wider truncate mt-0.5">
                {p2Assign}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type ParticipantEntry = MatchdayHubProps["participants"][number];

function VirtualTeamSheet({ participant }: { participant: ParticipantEntry }) {
  return (
    <div className="frosted-card-sm p-4 rounded-[16px]">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-[10px] bg-accent/10 border border-accent/20 grid place-items-center text-sm font-bold text-accent">
          {participant.displayName?.[0] ?? participant.username[0]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink truncate">
            {participant.displayName ?? participant.username}
          </p>
          {participant.assignedTeam && (
            <p className="text-[9px] text-muted-faint uppercase tracking-wider truncate">
              {participant.assignedTeam}
            </p>
          )}
        </div>
        <span className="ml-auto text-[9px] font-mono text-muted-faint">#{participant.seed}</span>
      </div>

      <div className="relative aspect-[3/4] rounded-[12px] overflow-hidden border border-border"
        style={{
          background: "linear-gradient(180deg, rgba(0,255,133,0.03) 0%, rgba(18,20,24,0.4) 100%)",
        }}
      >
        <div className="absolute inset-0 grid grid-rows-4 gap-2 p-3">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="flex items-center justify-center gap-2">
              {Array.from({ length: row === 1 ? 1 : row === 4 ? 4 : row === 3 ? 3 : 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-5 w-5 rounded-full bg-accent/10 border border-accent/20 grid place-items-center"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-accent/60" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <span className="text-[7px] font-black tracking-[0.25em] uppercase text-muted-faint">
            {participant.assignedTeam || "TBD"}
          </span>
        </div>
      </div>
    </div>
  );
}

function GroupStandingsTable({ group }: {
  group: NonNullable<MatchdayHubProps["groups"]>[0];
}) {
  const sorted = [...group.standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    return b.goalsFor - a.goalsFor;
  });

  return (
    <div className="frosted-card-sm rounded-[16px] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border">
        <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-accent">{group.name}</h3>
      </div>
      <div className="overflow-x-auto bc-no-scrollbar">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border text-[9px] font-bold uppercase tracking-wider text-muted-faint">
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-center">P</th>
              <th className="px-3 py-2 text-center">W</th>
              <th className="px-3 py-2 text-center">D</th>
              <th className="px-3 py-2 text-center">L</th>
              <th className="px-3 py-2 text-center">GF</th>
              <th className="px-3 py-2 text-center">GA</th>
              <th className="px-3 py-2 text-center">GD</th>
              <th className="px-3 py-2 text-center">Pts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => {
              const isCurrentUser = false;
              const rowBg = isCurrentUser ? "bg-accent/5" : i % 2 === 0 ? "bg-white/[0.02]" : "";
              const qualified = i < 2;
              return (
                <tr key={s.userId} className={`${rowBg} ${qualified ? "border-l-2 border-accent" : ""} transition-colors hover:bg-white/[0.03]`}>
                  <td className={`px-3 py-2 font-mono tabular-nums ${qualified ? "text-accent" : "text-muted-faint"}`}>
                    {i + 1}
                  </td>
                  <td className="px-3 py-2 font-medium text-ink truncate max-w-[120px]">
                    {s.displayName ?? s.username ?? "Player"}
                  </td>
                  <td className="px-3 py-2 text-center font-mono tabular-nums text-muted-soft">{s.played}</td>
                  <td className="px-3 py-2 text-center font-mono tabular-nums text-accent">{s.wins}</td>
                  <td className="px-3 py-2 text-center font-mono tabular-nums text-gold">{s.draws}</td>
                  <td className="px-3 py-2 text-center font-mono tabular-nums text-negative">{s.losses}</td>
                  <td className="px-3 py-2 text-center font-mono tabular-nums text-ink">{s.goalsFor}</td>
                  <td className="px-3 py-2 text-center font-mono tabular-nums text-muted-soft">{s.goalsAgainst}</td>
                  <td className={`px-3 py-2 text-center font-mono tabular-nums ${
                    s.goalDifference > 0 ? "text-accent" : s.goalDifference < 0 ? "text-negative" : "text-muted-soft"
                  }`}>
                    {s.goalDifference > 0 ? "+" : ""}{s.goalDifference}
                  </td>
                  <td className="px-3 py-2 text-center font-mono tabular-nums font-bold text-ink">{s.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MatchdayHub({
  tournament,
  participants,
  groups,
  matches,
  currentUserId,
  isOrganizer,
}: MatchdayHubProps) {
  const liveMatches = matches.filter((m) => m.status === "LIVE");
  const upcoming = matches.filter((m) => m.status === "PENDING" || m.status === "READY");
  const completed = matches.filter((m) => m.status === "COMPLETED");

  return (
    <div className="space-y-6">
      {/* Splash Screen - Show first live or upcoming match */}
      {liveMatches.length > 0 && (
        <SplashScreenWidget match={liveMatches[0]} participants={participants} />
      )}
      {liveMatches.length === 0 && upcoming.length > 0 && (
        <SplashScreenWidget match={upcoming[0]} participants={participants} />
      )}

      {/* Matches Grid */}
      <div>
        <h2 className="bc-headline text-sm font-bold uppercase tracking-wider text-ink mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {liveMatches.length > 0 ? "Live Matches" : "Upcoming Matches"}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {(liveMatches.length > 0 ? liveMatches : upcoming.slice(0, 4)).map((match, i) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`frosted-card-sm p-4 rounded-[16px] transition-all ${
                match.status === "LIVE" ? "border-accent/30" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-muted-faint">
                  R{match.round}
                </span>
                {match.status === "LIVE" && (
                  <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-accent">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    Live
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0 text-right">
                  <p className={`text-sm font-bold truncate ${
                    match.winner?.id === match.player1?.id ? "text-accent" : "text-ink"
                  }`}>
                    {match.player1?.displayName ?? match.player1?.username ?? "TBD"}
                  </p>
                  <p className="text-[9px] text-muted-faint truncate">
                    {participants.find((p) => p.userId === match.player1?.id)?.assignedTeam ?? ""}
                  </p>
                </div>

                <div className="shrink-0 min-w-[48px] text-center">
                  {match.status === "COMPLETED" && match.score1 != null ? (
                    <span className="font-mono text-base font-bold tabular-nums text-ink">
                      {match.score1}–{match.score2}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-muted-faint uppercase tracking-wider">VS</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${
                    match.winner?.id === match.player2?.id ? "text-accent" : "text-ink"
                  }`}>
                    {match.player2?.displayName ?? match.player2?.username ?? "TBD"}
                  </p>
                  <p className="text-[9px] text-muted-faint truncate">
                    {participants.find((p) => p.userId === match.player2?.id)?.assignedTeam ?? ""}
                  </p>
                </div>
              </div>

              {match.scheduledAt && !match.score1 && (
                <p className="mt-2 text-[8px] font-mono text-muted-faint text-center">
                  {new Date(match.scheduledAt).toLocaleDateString(undefined, {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Group Standings */}
      {groups && groups.length > 0 && (
        <div>
          <h2 className="bc-headline text-sm font-bold uppercase tracking-wider text-ink mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Group Standings
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((group) => (
              <GroupStandingsTable key={group.id} group={group} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {completed.length > 0 && (
        <div>
          <h2 className="bc-headline text-sm font-bold uppercase tracking-wider text-ink mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-soft" />
            Recent Results
          </h2>
          <div className="space-y-1">
            {completed.slice(-5).reverse().map((match) => (
              <div key={match.id} className="frosted-card-sm px-4 py-2.5 rounded-[12px] opacity-70">
                <div className="flex items-center justify-between text-xs">
                  <span className={match.winner?.id === match.player1?.id ? "text-accent font-medium" : "text-muted-soft"}>
                    {match.player1?.displayName ?? match.player1?.username ?? "TBD"}
                  </span>
                  <span className="font-mono tabular-nums text-ink font-bold mx-3">
                    {match.score1}–{match.score2}
                  </span>
                  <span className={match.winner?.id === match.player2?.id ? "text-accent font-medium" : "text-muted-soft"}>
                    {match.player2?.displayName ?? match.player2?.username ?? "TBD"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participants Grid with Team Sheets */}
      <div>
        <h2 className="bc-headline text-sm font-bold uppercase tracking-wider text-ink mb-3">
          Players ({participants.length})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {participants.map((p) => (
            <VirtualTeamSheet key={p.userId} participant={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
