import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";
import { generateBracket } from "@/lib/tournament-bracket";
import { notifyTournamentStart } from "@/lib/whatsapp";

export async function POST(req: Request, { params }: { params: Promise<{ tournamentId: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { tournamentId } = await params;

  const tournRes = await db.execute({
    sql: "SELECT id, name, status, type, max_players, entry_fee, organizer_id FROM tournaments WHERE id = ?",
    args: [tournamentId],
  });
  const tourn = tournRes.rows[0] as Record<string, unknown> | undefined;
  if (!tourn) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  if (tourn.status !== "REGISTRATION") {
    return NextResponse.json({ error: "Registration is closed" }, { status: 400 });
  }

  const existingRes = await db.execute({
    sql: "SELECT id FROM tournament_participants WHERE tournament_id = ? AND user_id = ?",
    args: [tournamentId, auth.session.userId],
  });
  if (existingRes.rows.length > 0) {
    return NextResponse.json({ error: "Already registered" }, { status: 409 });
  }

  const countRes = await db.execute({
    sql: "SELECT count(*) as c FROM tournament_participants WHERE tournament_id = ?",
    args: [tournamentId],
  });
  const currentCount = Number((countRes.rows[0] as Record<string, unknown>)?.c ?? 0);
  if (currentCount >= Number(tourn.max_players)) {
    return NextResponse.json({ error: "Tournament is full" }, { status: 400 });
  }

  const participantId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.execute({
    sql: "INSERT INTO tournament_participants (id, tournament_id, user_id, seed, status, created_at) VALUES (?, ?, ?, ?, 'REGISTERED', ?)",
    args: [participantId, tournamentId, auth.session.userId, currentCount + 1, now],
  });

  const newCount = currentCount + 1;

  const organizerRes = await db.execute({
    sql: "SELECT whatsapp FROM users WHERE id = ?",
    args: [tourn.organizer_id],
  });
  const organizerRow = organizerRes.rows[0] as Record<string, unknown> | undefined;
  if (organizerRow?.whatsapp) {
    notifyTournamentStart(organizerRow.whatsapp as string, tourn.name as string, 1, auth.session.username);
  }

  if (newCount >= Number(tourn.max_players)) {
    const allPlayersRes = await db.execute({
      sql: "SELECT tp.user_id, u.whatsapp FROM tournament_participants tp LEFT JOIN users u ON u.id = tp.user_id WHERE tp.tournament_id = ? ORDER BY tp.seed ASC",
      args: [tournamentId],
    });
    const allPlayers = allPlayersRes.rows.map((r: Record<string, unknown>) => ({
      userId: r.user_id as string,
      whatsapp: r.whatsapp as string | null,
    }));
    const playerIds = allPlayers.map((p) => p.userId);
    const bracket = generateBracket(tournamentId, playerIds, tourn.type as string);

    for (const round of bracket.rounds) {
      for (const match of round) {
        await db.execute({
          sql: "INSERT INTO tournament_matches (id, tournament_id, round, match_index, player1_id, player2_id, winner_id, score1, score2, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          args: [match.id, tournamentId, match.round, match.position, match.player1Id, match.player2Id, match.winnerId, match.score1, match.score2, match.status, now],
        });
      }
    }

    await db.execute({
      sql: "UPDATE tournaments SET status = 'LIVE', bracket = ?, updated_at = ? WHERE id = ?",
      args: [JSON.stringify(bracket), now, tournamentId],
    });

    await db.execute({
      sql: "UPDATE tournament_participants SET status = 'ACTIVE' WHERE tournament_id = ?",
      args: [tournamentId],
    });

    for (const round of bracket.rounds) {
      for (const match of round) {
        if (match.status !== "READY") continue;
        const p1 = allPlayers.find((p) => p.userId === match.player1Id);
        const p2 = allPlayers.find((p) => p.userId === match.player2Id);
        const p1Name = p1 ? allPlayersRes.rows.find((r: Record<string, unknown>) => r.user_id === match.player1Id)?.username ?? "Player" : "";
        const p2Name = p2 ? allPlayersRes.rows.find((r: Record<string, unknown>) => r.user_id === match.player2Id)?.username ?? "Player" : "";
        if (p1?.whatsapp) {
          notifyTournamentStart(p1.whatsapp, tourn.name as string, 1, String(p2Name));
        }
        if (p2?.whatsapp) {
          notifyTournamentStart(p2.whatsapp, tourn.name as string, 1, String(p1Name));
        }
      }
      break;
    }
  }

  return NextResponse.json({ participant: { id: participantId, status: "REGISTERED" } }, { status: 201 });
}
