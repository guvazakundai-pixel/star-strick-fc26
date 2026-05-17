import { db } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Match History · ZIM FCPRO",
  description: "Browse confirmed and approved match results.",
};

type MatchRow = {
  id: string;
  score1: number;
  score2: number;
  status: string;
  is_disputed: number;
  created_at: string;
  player1_id: string;
  player1_username: string;
  player1_display_name: string | null;
  player1_avatar_url: string | null;
  player2_id: string;
  player2_username: string;
  player2_display_name: string | null;
  player2_avatar_url: string | null;
  winner_id: string | null;
  winner_username: string | null;
  winner_display_name: string | null;
};

export default async function MatchHistoryPage() {
  const result = await db.execute(`
    SELECT
      mr.id, mr.score1, mr.score2, mr.status, mr.is_disputed,
      mr.created_at, mr.winner_id,
      p1.id as player1_id, u1.username as player1_username, u1.display_name as player1_display_name, u1.avatar_url as player1_avatar_url,
      p2.id as player2_id, u2.username as player2_username, u2.display_name as player2_display_name, u2.avatar_url as player2_avatar_url,
      w.username as winner_username, w.display_name as winner_display_name
    FROM match_reports mr
    JOIN player_stats p1 ON p1.user_id = mr.player1_id
    JOIN users u1 ON u1.id = mr.player1_id
    JOIN player_stats p2 ON p2.user_id = mr.player2_id
    JOIN users u2 ON u2.id = mr.player2_id
    LEFT JOIN users w ON w.id = mr.winner_id
    WHERE mr.status IN ('CONFIRMED', 'APPROVED')
    ORDER BY mr.created_at DESC
    LIMIT 50
  `);

  const matches = result.rows as unknown as MatchRow[];

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 space-y-8">
        <header>
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
            Match History
          </p>
          <h1 className="bc-headline mt-1 text-3xl sm:text-5xl text-ink">
            Results
          </h1>
          <p className="mt-1 text-sm text-muted">
            All confirmed and approved match results
          </p>
        </header>

        {matches.length === 0 ? (
          <div className="glass p-12 text-center space-y-3">
            <p className="cinematic-heading text-3xl text-ink">No results yet</p>
            <p className="text-sm text-muted">
              Matches will appear here once they are confirmed.
            </p>
            <Link href="/matches/find" className="inline-flex items-center justify-center h-10 rounded-[14px] cta-primary px-4 text-sm font-bold tracking-wider">
              Find a Match
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((match, idx) => {
              const p1Name = match.player1_display_name || match.player1_username;
              const p2Name = match.player2_display_name || match.player2_username;
              const isP1Win = match.winner_id === match.player1_id;
              const isP2Win = match.winner_id === match.player2_id;
              const isDraw = !match.winner_id;

              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="block frosted-card-sm p-4 sm:p-5 hover:border-accent/15 transition-all duration-200 group bc-stagger-in"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1 text-right">
                      <p className={`text-sm font-semibold truncate ${isP1Win ? "text-accent" : "text-ink"} group-hover:text-accent transition-colors duration-200`}>
                        {p1Name}
                      </p>
                      <p className="font-mono text-[10px] text-muted-soft">@{match.player1_username}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`bc-headline text-xl tabular-nums ${isP1Win ? "text-accent" : "text-ink"}`}>
                          {match.score1}
                        </span>
                        <span className="text-[10px] text-muted-faint font-mono">:</span>
                        <span className={`bc-headline text-xl tabular-nums ${isP2Win ? "text-accent" : "text-ink"}`}>
                          {match.score2}
                        </span>
                      </div>
                      {isDraw && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gold">Draw</span>
                      )}
                      {match.is_disputed && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-negative">Disputed</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isP2Win ? "text-accent" : "text-ink"} group-hover:text-accent transition-colors duration-200`}>
                        {p2Name}
                      </p>
                      <p className="font-mono text-[10px] text-muted-soft">@{match.player2_username}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="font-mono text-[10px] text-muted-faint">
                      {new Date(match.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}