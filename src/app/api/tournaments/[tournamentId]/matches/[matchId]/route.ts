import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";
import { advanceBracket } from "@/lib/tournament-bracket";
import { notifyTournamentBracketAdvance } from "@/lib/whatsapp";

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

  const now = new Date().toISOString();

  await db.execute({
    sql: "UPDATE tournament_matches SET winner_id = ?, score1 = ?, score2 = ?, status = 'COMPLETED', completed_at = ? WHERE id = ?",
    args: [winnerId, score1, score2, now, matchId],
  });

  const tournRes = await db.execute({
    sql: "SELECT bracket, name FROM tournaments WHERE id = ?",
    args: [tournamentId],
  });
  const tournRow = tournRes.rows[0] as Record<string, unknown> | undefined;
  if (tournRow?.bracket) {
    let bracket = typeof tournRow.bracket === "string" ? JSON.parse(tournRow.bracket as string) : tournRow.bracket;
    bracket = advanceBracket(bracket, matchId, winnerId, score1, score2);

    await db.execute({
      sql: "UPDATE tournaments SET bracket = ?, updated_at = ? WHERE id = ?",
      args: [JSON.stringify(bracket), now, tournamentId],
    });

    for (const round of bracket.rounds) {
      for (const m of round) {
        if (m.status !== "PENDING") continue;
        const existingRes = await db.execute({
          sql: "SELECT id FROM tournament_matches WHERE id = ?",
          args: [m.id],
        });
        if (existingRes.rows.length === 0) {
          await db.execute({
            sql: "INSERT INTO tournament_matches (id, tournament_id, round, match_index, player1_id, player2_id, winner_id, score1, score2, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            args: [m.id, tournamentId, m.round, m.position, m.player1Id, m.player2Id, m.winnerId, m.score1, m.score2, m.status, now],
          });
        }
      }
    }

    const tournName = tournRow.name as string;
    const roundNum = Number(match.round);
    const nextRound = roundNum + 1;
    if (nextRound <= bracket.totalRounds) {
      const nextRoundMatches = bracket.rounds[nextRound - 1] ?? [];
      for (const nm of nextRoundMatches) {
        if (nm.status !== "READY") continue;
        if (!nm.player1Id || !nm.player2Id) continue;
        const pInfo = await db.execute({
          sql: "SELECT id, username, display_name, whatsapp FROM users WHERE id IN (?, ?)",
          args: [nm.player1Id, nm.player2Id],
        });
        const p1Row = pInfo.rows.find((r: Record<string, unknown>) => r.id === nm.player1Id) as Record<string, unknown> | undefined;
        const p2Row = pInfo.rows.find((r: Record<string, unknown>) => r.id === nm.player2Id) as Record<string, unknown> | undefined;
        const p1Name = (p1Row?.display_name as string) ?? (p1Row?.username as string) ?? "Player";
        const p2Name = (p2Row?.display_name as string) ?? (p2Row?.username as string) ?? "Player";
        if (p1Row?.whatsapp) {
          notifyTournamentBracketAdvance(p1Row.whatsapp as string, tournName, nextRound, p2Name);
        }
        if (p2Row?.whatsapp) {
          notifyTournamentBracketAdvance(p2Row.whatsapp as string, tournName, nextRound, p1Name);
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
  }

  return NextResponse.json({ match: { id: matchId, status: "COMPLETED", winnerId, score1, score2 } });
}
