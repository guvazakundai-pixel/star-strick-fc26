import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

const ReportSchema = z.object({
  winnerId: z.string().min(1),
  score1: z.number().int().min(0),
  score2: z.number().int().min(0),
});

export async function POST(req: Request, { params }: { params: Promise<{ tournamentId: string; matchId: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { tournamentId, matchId } = await params;

  const matchRes = await db.execute({
    sql: "SELECT * FROM tournament_matches WHERE id = ? AND tournament_id = ?",
    args: [matchId, tournamentId],
  });
  const match = matchRes.rows[0] as Record<string, unknown> | undefined;
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  if (match.status === "COMPLETED") {
    return NextResponse.json({ error: "Match already completed" }, { status: 400 });
  }

  if (match.player1_id !== auth.session.userId && match.player2_id !== auth.session.userId) {
    return NextResponse.json({ error: "You are not a participant in this match" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { winnerId, score1, score2 } = parsed.data;

  if (winnerId !== match.player1_id && winnerId !== match.player2_id) {
    return NextResponse.json({ error: "Winner must be a match participant" }, { status: 400 });
  }

  if (score1 === score2) {
    return NextResponse.json({ error: "Tournament matches cannot end in a draw. One player must win." }, { status: 400 });
  }

  const now = new Date().toISOString();

  await db.execute({
    sql: "UPDATE tournament_matches SET winner_id = ?, score1 = ?, score2 = ?, status = 'COMPLETED', completed_at = ? WHERE id = ?",
    args: [winnerId, score1, score2, now, matchId],
  });

  const groupId = match.group_id as string | null;

  if (groupId) {
    const homeScore = score1;
    const awayScore = score2;
    const homeUserId = match.player1_id as string;
    const awayUserId = match.player2_id as string;

    for (const userId of [homeUserId, awayUserId]) {
      const isHome = userId === homeUserId;
      const scored = isHome ? homeScore : awayScore;
      const conceded = isHome ? awayScore : homeScore;
      const won = scored > conceded;
      const drawn = scored === conceded;

      const existingRes = await db.execute({
        sql: "SELECT * FROM tournament_group_standings WHERE group_id = ? AND user_id = ?",
        args: [groupId, userId],
      });
      const existing = existingRes.rows[0] as Record<string, unknown> | undefined;

      const played = Number(existing?.played ?? 0) + 1;
      const wins = Number(existing?.wins ?? 0) + (won ? 1 : 0);
      const draws = Number(existing?.draws ?? 0) + (drawn ? 1 : 0);
      const losses = Number(existing?.losses ?? 0) + (!won && !drawn ? 1 : 0);
      const goalsFor = Number(existing?.goals_for ?? 0) + scored;
      const goalsAgainst = Number(existing?.goals_against ?? 0) + conceded;
      const goalDifference = goalsFor - goalsAgainst;
      const points = Number(existing?.points ?? 0) + (won ? 3 : drawn ? 1 : 0);

      if (existing) {
        await db.execute({
          sql: "UPDATE tournament_group_standings SET points=?, played=?, wins=?, draws=?, losses=?, goals_for=?, goals_against=?, goal_difference=? WHERE group_id=? AND user_id=?",
          args: [points, played, wins, draws, losses, goalsFor, goalsAgainst, goalDifference, groupId, userId],
        });
      } else {
        await db.execute({
          sql: "INSERT INTO tournament_group_standings (id, group_id, user_id, points, played, wins, draws, losses, goals_for, goals_against, goal_difference) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
          args: [crypto.randomUUID(), groupId, userId, points, played, wins, draws, losses, goalsFor, goalsAgainst, goalDifference],
        });
      }
    }
  }

  const tournRes = await db.execute({
    sql: "SELECT id, bracket, name, type FROM tournaments WHERE id = ?",
    args: [tournamentId],
  });
  const tournRow = tournRes.rows[0] as Record<string, unknown> | undefined;

  if (tournRow?.bracket) {
    let bracket = typeof tournRow.bracket === "string" ? JSON.parse(tournRow.bracket as string) : tournRow.bracket;

    if (bracket.rounds) {
      const currentRound = Number(match.round);
      const currentMatchIndex = Number(match.match_index);

      for (let r = 0; r < bracket.rounds.length; r++) {
        for (let m = 0; m < bracket.rounds[r].length; m++) {
          const bm = bracket.rounds[r][m];
          if (bm.id === matchId) {
            bm.winnerId = winnerId;
            bm.status = "COMPLETED";
            bm.score1 = score1;
            bm.score2 = score2;
          }

          if (r === currentRound + 1) {
            const nextRound = bracket.rounds[r];
            const nextMatch = nextRound[m];
            if (!nextMatch) continue;

            const advancingWinner = winnerId;
            const matchSlot = currentMatchIndex % 2 === 0 ? "player1Id" : "player2Id";

            if (!nextMatch[matchSlot]) {
              nextMatch[matchSlot] = advancingWinner;
              nextMatch.status = nextMatch.player1Id && nextMatch.player2Id ? "READY" : "PENDING";

              const existingNM = await db.execute({
                sql: "SELECT id FROM tournament_matches WHERE tournament_id = ? AND round = ? AND match_index = ?",
                args: [tournamentId, r + 1, m],
              });
              if (existingNM.rows.length === 0) {
                await db.execute({
                  sql: "INSERT INTO tournament_matches (id, tournament_id, round, match_index, player1_id, player2_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                  args: [crypto.randomUUID(), tournamentId, r + 1, m, nextMatch.player1Id ?? null, nextMatch.player2Id ?? null, nextMatch.status === "READY" ? "READY" : "PENDING", now],
                });
              } else {
                await db.execute({
                  sql: "UPDATE tournament_matches SET player1_id = ?, player2_id = ?, status = ? WHERE tournament_id = ? AND round = ? AND match_index = ?",
                  args: [nextMatch.player1Id ?? null, nextMatch.player2Id ?? null, nextMatch.status === "READY" ? "READY" : "PENDING", tournamentId, r + 1, m],
                });
              }
            }
          }
        }
      }

      const finalRound = bracket.rounds[bracket.rounds.length - 1];
      const finalMatch = finalRound?.[0];
      if (finalMatch?.status === "COMPLETED") {
        await db.execute({
          sql: "UPDATE tournaments SET status = 'COMPLETED', end_at = ? WHERE id = ?",
          args: [now, tournamentId],
        });
        await db.execute({
          sql: "UPDATE tournament_participants SET status = 'ELIMINATED' WHERE tournament_id = ? AND user_id != ?",
          args: [tournamentId, finalMatch.winnerId],
        });
      }

      await db.execute({
        sql: "UPDATE tournaments SET bracket = ?, updated_at = ? WHERE id = ?",
        args: [JSON.stringify(bracket), now, tournamentId],
      });
    }
  }

  const loserId = winnerId === match.player1_id ? match.player2_id : match.player1_id;
  await db.execute({
    sql: "UPDATE tournament_participants SET status = 'ELIMINATED' WHERE tournament_id = ? AND user_id = ?",
    args: [tournamentId, loserId],
  });

  return NextResponse.json({ match: { id: matchId, status: "COMPLETED", winnerId, score1, score2 } });
}